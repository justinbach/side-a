-- Create storage bucket for cover images
INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true);

-- Allow authenticated users to upload cover images
CREATE POLICY "Authenticated users can upload covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'covers');

-- Allow public read access to covers
CREATE POLICY "Public read access to covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'covers');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own covers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);
