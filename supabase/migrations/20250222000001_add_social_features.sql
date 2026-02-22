-- Add social features: follows table and activity sharing privacy

-- Create follows table for one-way follow relationships (Twitter/Instagram style)
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_follows_created ON follows(created_at DESC);

-- Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Users can view who they follow and who follows them
CREATE POLICY "Users can view follows" ON follows FOR SELECT
  USING (follower_id = auth.uid() OR following_id = auth.uid());

-- Users can follow others
CREATE POLICY "Users can follow others" ON follows FOR INSERT
  WITH CHECK (follower_id = auth.uid());

-- Users can unfollow
CREATE POLICY "Users can unfollow" ON follows FOR DELETE
  USING (follower_id = auth.uid());

-- Add privacy column to profiles (opt-out model: public by default)
ALTER TABLE profiles ADD COLUMN share_activity BOOLEAN NOT NULL DEFAULT true;

-- Users can update their own privacy settings
-- Note: The existing "Users can update own profile" policy already covers this,
-- but we're being explicit about which fields can be updated
CREATE POLICY "Users can update own privacy" ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add new play visibility policy for followed users with public activity
-- This works in OR combination with the existing "Members can view plays in their collections" policy
CREATE POLICY "Users can view followed users' public plays" ON plays FOR SELECT
  USING (
    -- The play's user has share_activity enabled
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = plays.user_id
      AND profiles.share_activity = true
    )
    AND (
      -- Current user follows the person who made the play
      EXISTS (
        SELECT 1 FROM follows
        WHERE follower_id = auth.uid()
        AND following_id = plays.user_id
      )
      -- OR they share a collection (enables feed to show plays from collection members)
      OR EXISTS (
        SELECT 1 FROM records r
        JOIN collection_members cm1 ON cm1.collection_id = r.collection_id
          AND cm1.user_id = plays.user_id
        JOIN collection_members cm2 ON cm2.collection_id = r.collection_id
          AND cm2.user_id = auth.uid()
        WHERE r.id = plays.record_id
      )
    )
  );

-- Backfill existing users to have share_activity = true (opt-out default)
UPDATE profiles SET share_activity = true WHERE share_activity IS NULL;
