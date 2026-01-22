-- Add is_active column to products table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.products ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Update any NULL values to true
UPDATE public.products SET is_active = true WHERE is_active IS NULL;