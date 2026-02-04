-- Fix case-sensitivity issues in invitation email matching

-- Drop and recreate the RLS policy with case-insensitive matching
DROP POLICY IF EXISTS "Users can view their own invitations" ON invitations;
CREATE POLICY "Users can view their own invitations"
  ON invitations FOR SELECT
  USING (LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid())));

-- Update the accept_invitation function to use case-insensitive email matching
CREATE OR REPLACE FUNCTION accept_invitation(invitation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  inv RECORD;
  user_email TEXT;
BEGIN
  -- Get current user's email (lowercased for comparison)
  SELECT LOWER(email) INTO user_email FROM auth.users WHERE id = auth.uid();

  -- Get the invitation (case-insensitive email match)
  SELECT * INTO inv FROM invitations
  WHERE id = invitation_id
    AND LOWER(email) = user_email
    AND accepted_at IS NULL;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Add user as member
  INSERT INTO collection_members (collection_id, user_id, role)
  VALUES (inv.collection_id, auth.uid(), 'member')
  ON CONFLICT (collection_id, user_id) DO NOTHING;

  -- Mark invitation as accepted
  UPDATE invitations SET accepted_at = NOW() WHERE id = invitation_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
