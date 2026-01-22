-- Create storage bucket for product content (videos, PDFs, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-content', 'product-content', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for product-content bucket
CREATE POLICY "Anyone can view product content" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-content');

CREATE POLICY "Admins can upload product content" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'product-content' 
  AND public.has_role_or_higher(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update product content" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'product-content' 
  AND public.has_role_or_higher(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete product content" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'product-content' 
  AND public.has_role_or_higher(auth.uid(), 'admin')
);