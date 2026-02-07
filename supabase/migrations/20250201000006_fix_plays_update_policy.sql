-- Add missing UPDATE policy for plays table
-- This allows users to update their own plays (e.g., to add a mood)

CREATE POLICY "Users can update their own plays"
  ON plays FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
