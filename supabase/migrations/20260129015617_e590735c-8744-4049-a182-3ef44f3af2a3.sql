-- Add missing columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS trailer_url text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS testimonials jsonb DEFAULT '[]';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS faq jsonb DEFAULT '[]';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS guarantee_days integer DEFAULT 7;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS access_days integer;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS max_installments integer DEFAULT 12;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS affiliate_free boolean DEFAULT false;

-- Fix type enum for product type if needed (add mentoring)
DO $$ 
BEGIN
  -- Check if 'mentoring' exists in product_type enum, if not add it
  BEGIN
    ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'mentoring';
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore if enum doesn't exist or value exists
  END;
END $$;

-- Add storage_used to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS storage_used bigint DEFAULT 0;