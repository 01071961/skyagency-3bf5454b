-- Add download_files JSONB column to support multiple files per lesson
-- Structure: [{ url: string, name: string, type?: string }]

ALTER TABLE public.product_lessons 
ADD COLUMN IF NOT EXISTS download_files JSONB DEFAULT '[]'::jsonb;

-- Migrate existing file_url/file_name to download_files array
UPDATE public.product_lessons
SET download_files = jsonb_build_array(
  jsonb_build_object(
    'url', file_url,
    'name', COALESCE(file_name, 'Material'),
    'type', 'file'
  )
)
WHERE file_url IS NOT NULL 
  AND file_url != '' 
  AND (download_files IS NULL OR download_files = '[]'::jsonb);

-- Add comment for documentation
COMMENT ON COLUMN public.product_lessons.download_files IS 'Array of download files: [{url, name, type}]. Supports uploads, Google Drive, OneDrive, etc.';