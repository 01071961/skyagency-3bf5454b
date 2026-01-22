-- Add column for VIP tier access control (which VIP tiers get free access)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS affiliate_free_tiers TEXT[] DEFAULT '{}';

-- Comment for documentation
COMMENT ON COLUMN public.products.affiliate_free_tiers IS 'Array of VIP tiers that get free access: bronze, silver, gold, diamond, platinum';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_affiliate_free_tiers ON public.products USING GIN (affiliate_free_tiers);

-- Create function to check if user tier has free access to product
CREATE OR REPLACE FUNCTION public.user_has_tier_access(
  user_tier TEXT,
  allowed_tiers TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If no tiers are set, no free access
  IF allowed_tiers IS NULL OR array_length(allowed_tiers, 1) IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user tier is in allowed tiers
  RETURN user_tier = ANY(allowed_tiers);
END;
$$;