CREATE TABLE wish_list_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mbid          TEXT NOT NULL,
  title         TEXT NOT NULL,
  artist        TEXT NOT NULL,
  cover_art_url TEXT,
  release_date  TEXT,
  label         TEXT,
  track_count   INTEGER NOT NULL DEFAULT 0,
  tracks        JSONB NOT NULL DEFAULT '[]',
  added_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, mbid)
);
CREATE INDEX idx_wish_list_user ON wish_list_items(user_id);
ALTER TABLE wish_list_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Wish list items readable by authenticated users"
  ON wish_list_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner can insert wish list items"
  ON wish_list_items FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner can delete wish list items"
  ON wish_list_items FOR DELETE USING (user_id = auth.uid());
