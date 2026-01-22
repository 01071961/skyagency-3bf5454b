-- Add optional gumroad_link field to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS gumroad_link TEXT;