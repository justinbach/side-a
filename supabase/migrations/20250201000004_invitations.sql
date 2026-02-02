-- Invitations table for sharing collections
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(collection_id, email)
);

-- Index for looking up invitations by email
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_collection ON invitations(collection_id);

-- Enable RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invitations
CREATE POLICY "Collection owners can view invitations"
  ON invitations FOR SELECT
  USING (is_collection_owner(collection_id, auth.uid()));

CREATE POLICY "Collection owners can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (is_collection_owner(collection_id, auth.uid()));

CREATE POLICY "Collection owners can delete invitations"
  ON invitations FOR DELETE
  USING (is_collection_owner(collection_id, auth.uid()));

-- Users can view invitations sent to their email
CREATE POLICY "Users can view their own invitations"
  ON invitations FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Function to accept an invitation
CREATE OR REPLACE FUNCTION accept_invitation(invitation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  inv RECORD;
  user_email TEXT;
BEGIN
  -- Get current user's email
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();

  -- Get the invitation
  SELECT * INTO inv FROM invitations WHERE id = invitation_id AND email = user_email AND accepted_at IS NULL;

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
