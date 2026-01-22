-- Fix function search_path issues for SECURITY DEFINER functions
-- This addresses the SUPA_function_search_path_mutable linter warning

-- First, let's fix update_updated_at_column if it exists without search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Ensure all timestamp update triggers use the secured function
-- No need to recreate triggers, just ensure the function is secure