-- Create storage bucket for social media uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('social-media', 'social-media', true, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to posts folder
CREATE POLICY "Authenticated users can upload posts media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'social-media' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'posts'
);

-- Allow public read access
CREATE POLICY "Public can view social media"
ON storage.objects FOR SELECT
USING (bucket_id = 'social-media');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own social media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'social-media' 
  AND auth.role() = 'authenticated'
);