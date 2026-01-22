-- Add affiliate_free column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS affiliate_free BOOLEAN DEFAULT false;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_affiliate_free ON public.products(affiliate_free) WHERE affiliate_free = true;

-- Add comment for documentation
COMMENT ON COLUMN public.products.affiliate_free IS 'When true, product is free exclusively for VIP affiliates';