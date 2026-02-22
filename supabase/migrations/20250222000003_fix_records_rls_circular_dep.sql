-- Drop the problematic policy that caused a circular RLS dependency:
-- records policy queried plays → plays policy queries records → infinite recursion
DROP POLICY IF EXISTS "Users can view records from followed users' plays" ON records;

-- Use a SECURITY DEFINER function to check follows without triggering plays RLS,
-- breaking the circular dependency.
CREATE OR REPLACE FUNCTION can_view_record_via_follows(record_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM plays p
    JOIN profiles pr ON pr.id = p.user_id AND pr.share_activity = true
    JOIN follows f ON f.follower_id = user_uuid AND f.following_id = p.user_id
    WHERE p.record_id = record_uuid
  )
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "Users can view records from followed users' plays" ON records FOR SELECT
  USING (can_view_record_via_follows(id, auth.uid()));
