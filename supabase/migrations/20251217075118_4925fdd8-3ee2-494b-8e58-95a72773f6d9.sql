-- Add fields for product type specific content
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS download_url text,
ADD COLUMN IF NOT EXISTS saas_url text,
ADD COLUMN IF NOT EXISTS saas_features jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.products.download_url IS 'Download URL for ebooks, software, files';
COMMENT ON COLUMN public.products.saas_url IS 'SaaS tool access URL';
COMMENT ON COLUMN public.products.saas_features IS 'List of SaaS features and specifications';