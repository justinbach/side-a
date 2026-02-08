-- Add foreign key from plays.user_id to profiles.id
-- This enables Supabase's automatic join syntax: plays.select('profiles(display_name)')
-- Both already reference auth.users(id), so data integrity is already guaranteed

ALTER TABLE plays
ADD CONSTRAINT plays_user_id_profiles_fk
FOREIGN KEY (user_id) REFERENCES profiles(id);
