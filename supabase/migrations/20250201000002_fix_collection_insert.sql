-- Fix collection insert RLS by using a trigger to set owner_id

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can create collections" ON collections;

-- Create a trigger to automatically set owner_id on insert
CREATE OR REPLACE FUNCTION set_collection_owner()
RETURNS TRIGGER AS $$
BEGIN
  NEW.owner_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_collection_insert
  BEFORE INSERT ON collections
  FOR EACH ROW
  EXECUTE FUNCTION set_collection_owner();

-- New policy: authenticated users can create collections
CREATE POLICY "Authenticated users can create collections"
  ON collections FOR INSERT
  TO authenticated
  WITH CHECK (true);
