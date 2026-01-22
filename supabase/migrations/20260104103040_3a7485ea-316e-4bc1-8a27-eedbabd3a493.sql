-- Make affiliate-files bucket public so avatars/covers can be viewed
UPDATE storage.buckets SET public = true WHERE id = 'affiliate-files';

-- Add policy for public read access to affiliate files
CREATE POLICY "Public can view affiliate files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'affiliate-files');