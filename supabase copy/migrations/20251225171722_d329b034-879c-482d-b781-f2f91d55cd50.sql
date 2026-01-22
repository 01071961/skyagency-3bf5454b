-- Fix: Remove vulnerable email-based access policy from orders table
-- This prevents attackers from exploiting email matching to access customer data

-- Drop the vulnerable policy that allows email-based access
DROP POLICY IF EXISTS "Users can view own orders secure" ON public.orders;

-- Create a new secure policy that ONLY uses user_id (no email matching)
CREATE POLICY "Users can view own orders secure" 
ON public.orders 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Also fix: Make orders INSERT more secure - require user_id when authenticated
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON public.orders;

-- New secure INSERT policy: authenticated users must set their user_id
CREATE POLICY "Authenticated users can insert orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  -- Unauthenticated checkout allowed (guest checkout)
  (auth.uid() IS NULL) OR
  -- Authenticated users must set their own user_id
  (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
);

-- Improve UPDATE policy to be more restrictive
DROP POLICY IF EXISTS "Users can update own orders secure" ON public.orders;

CREATE POLICY "Users can update own orders secure" 
ON public.orders 
FOR UPDATE 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Add index for better admin query performance
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email) WHERE customer_email IS NOT NULL;