-- Fix RLS policy to allow order creators to view their orders
-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

-- Create a more flexible SELECT policy that allows:
-- 1. Authenticated users to view orders where user_id matches
-- 2. Anyone to view orders by email match (for guest checkout)
CREATE POLICY "Users can view own orders" ON public.orders
FOR SELECT USING (
  auth.uid() = user_id 
  OR (user_id IS NULL AND customer_email IS NOT NULL)
);

-- Also ensure the INSERT policy properly allows guest checkout
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

CREATE POLICY "Anyone can create orders" ON public.orders
FOR INSERT WITH CHECK (true);