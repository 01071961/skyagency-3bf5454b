-- Fix PUBLIC_DATA_EXPOSURE: Orders table RLS policy allows unauthenticated read
-- Drop the vulnerable policy that allows reading orders with NULL user_id

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can view orders" ON public.orders;
DROP POLICY IF EXISTS "Public can view orders" ON public.orders;

-- Create secure policy: Only authenticated users can view their own orders
-- Guest orders (user_id IS NULL) can only be viewed if the authenticated user's email matches
CREATE POLICY "Users can view own orders secure" ON public.orders
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id 
    OR public.has_role(auth.uid(), 'admin')
    OR (
      user_id IS NULL 
      AND customer_email IS NOT NULL 
      AND auth.jwt()->>'email' = customer_email
    )
  )
);

-- Ensure INSERT policy is secure
DROP POLICY IF EXISTS "Users can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON public.orders;

CREATE POLICY "Authenticated users can insert orders" ON public.orders
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND (
    user_id = auth.uid() OR user_id IS NULL
  )
);

-- Ensure UPDATE policy is secure
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update orders" ON public.orders;

CREATE POLICY "Users can update own orders secure" ON public.orders
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id 
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Ensure DELETE policy is secure (admin only)
DROP POLICY IF EXISTS "Users can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can delete orders" ON public.orders;

CREATE POLICY "Admin can delete orders" ON public.orders
FOR DELETE USING (
  auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin')
);

-- Add service role policy for webhooks and edge functions
DROP POLICY IF EXISTS "Service role full access" ON public.orders;

CREATE POLICY "Service role full access" ON public.orders
FOR ALL USING (
  auth.jwt()->>'role' = 'service_role'
);