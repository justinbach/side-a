-- Fix trigger to not overwrite explicitly provided owner_id

-- Drop the existing trigger
DROP TRIGGER IF EXISTS on_collection_insert ON collections;
DROP FUNCTION IF EXISTS set_collection_owner();

-- Create updated function that respects provided owner_id
CREATE OR REPLACE FUNCTION set_collection_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set owner_id if not already provided
  IF NEW.owner_id IS NULL THEN
    NEW.owner_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_collection_insert
  BEFORE INSERT ON collections
  FOR EACH ROW
  EXECUTE FUNCTION set_collection_owner();
