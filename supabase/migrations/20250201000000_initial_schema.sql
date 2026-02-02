-- Side A Initial Schema
-- This migration sets up the core data model with RLS policies

-- Mood enum for play logging
CREATE TYPE mood AS ENUM (
  'Morning',
  'Cocktail Hour',
  'Dinner',
  'Late Night',
  'Background',
  'Weekend'
);

-- Collection member role enum
CREATE TYPE collection_role AS ENUM ('owner', 'member');

-- Collections table
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Collection members (links users to collections)
CREATE TABLE collection_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role collection_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(collection_id, user_id)
);

-- Records (album entries in a collection)
CREATE TABLE records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  cover_image_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Plays (play log entries)
CREATE TABLE plays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mood mood
);

-- Notes (per-record notes with star ratings)
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  star_rating INTEGER CHECK (star_rating >= 1 AND star_rating <= 5),
  text TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(record_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_collection_members_user ON collection_members(user_id);
CREATE INDEX idx_collection_members_collection ON collection_members(collection_id);
CREATE INDEX idx_records_collection ON records(collection_id);
CREATE INDEX idx_plays_record ON plays(record_id);
CREATE INDEX idx_plays_user ON plays(user_id);
CREATE INDEX idx_plays_played_at ON plays(played_at DESC);
CREATE INDEX idx_notes_record ON notes(record_id);

-- Enable Row Level Security on all tables
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user is a member of a collection
CREATE OR REPLACE FUNCTION is_collection_member(collection_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM collection_members
    WHERE collection_id = collection_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Check if user is the owner of a collection
CREATE OR REPLACE FUNCTION is_collection_owner(collection_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM collection_members
    WHERE collection_id = collection_uuid AND user_id = user_uuid AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for collections
CREATE POLICY "Users can view collections they are members of"
  ON collections FOR SELECT
  USING (is_collection_member(id, auth.uid()));

CREATE POLICY "Users can create collections"
  ON collections FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their collections"
  ON collections FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their collections"
  ON collections FOR DELETE
  USING (owner_id = auth.uid());

-- RLS Policies for collection_members
CREATE POLICY "Members can view collection membership"
  ON collection_members FOR SELECT
  USING (is_collection_member(collection_id, auth.uid()));

CREATE POLICY "Owners can add members"
  ON collection_members FOR INSERT
  WITH CHECK (is_collection_owner(collection_id, auth.uid()) OR (user_id = auth.uid() AND role = 'owner'));

CREATE POLICY "Owners can remove members"
  ON collection_members FOR DELETE
  USING (is_collection_owner(collection_id, auth.uid()) OR user_id = auth.uid());

-- RLS Policies for records
CREATE POLICY "Members can view records in their collections"
  ON records FOR SELECT
  USING (is_collection_member(collection_id, auth.uid()));

CREATE POLICY "Members can add records to their collections"
  ON records FOR INSERT
  WITH CHECK (is_collection_member(collection_id, auth.uid()));

CREATE POLICY "Members can update records in their collections"
  ON records FOR UPDATE
  USING (is_collection_member(collection_id, auth.uid()));

CREATE POLICY "Members can delete records from their collections"
  ON records FOR DELETE
  USING (is_collection_member(collection_id, auth.uid()));

-- RLS Policies for plays
CREATE POLICY "Members can view plays in their collections"
  ON plays FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM records r
      WHERE r.id = plays.record_id
      AND is_collection_member(r.collection_id, auth.uid())
    )
  );

CREATE POLICY "Members can log plays"
  ON plays FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM records r
      WHERE r.id = record_id
      AND is_collection_member(r.collection_id, auth.uid())
    )
  );

CREATE POLICY "Users can delete their own plays"
  ON plays FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for notes
CREATE POLICY "Members can view notes in their collections"
  ON notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM records r
      WHERE r.id = notes.record_id
      AND is_collection_member(r.collection_id, auth.uid())
    )
  );

CREATE POLICY "Members can add notes"
  ON notes FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM records r
      WHERE r.id = record_id
      AND is_collection_member(r.collection_id, auth.uid())
    )
  );

CREATE POLICY "Users can update their own notes"
  ON notes FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notes"
  ON notes FOR DELETE
  USING (user_id = auth.uid());

-- Trigger to automatically add owner as a collection member
CREATE OR REPLACE FUNCTION add_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO collection_members (collection_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_collection_created
  AFTER INSERT ON collections
  FOR EACH ROW
  EXECUTE FUNCTION add_owner_as_member();

-- Trigger to update notes.updated_at on change
CREATE OR REPLACE FUNCTION update_notes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_notes_updated
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_notes_timestamp();
