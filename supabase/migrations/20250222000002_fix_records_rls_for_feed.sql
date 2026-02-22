-- Allow reading records that appear in plays from followed users
-- Without this, the feed query can't join record data (title, artist, cover)
-- for plays from users outside your collections.
CREATE POLICY "Users can view records from followed users' plays" ON records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM plays p
      JOIN profiles pr ON pr.id = p.user_id AND pr.share_activity = true
      JOIN follows f ON f.follower_id = auth.uid() AND f.following_id = p.user_id
      WHERE p.record_id = records.id
    )
  );
