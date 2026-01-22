-- Fix critical RLS policies to require authenticated users explicitly
-- This addresses linter warnings about anonymous access

-- 1. Fix user_roles table (critical for auth)
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Users can view own role" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- 2. Fix profiles table (contains PII)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Fix orders table (contains customer PII)
DROP POLICY IF EXISTS "Users can view own orders secure" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders secure" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;

CREATE POLICY "Users can view own orders" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own orders" 
ON public.orders 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage orders" 
ON public.orders 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Fix affiliate_commissions (financial data)
DROP POLICY IF EXISTS "Admins can manage all commissions" ON public.affiliate_commissions;
DROP POLICY IF EXISTS "Affiliates can view own commissions" ON public.affiliate_commissions;

CREATE POLICY "Admins can manage all commissions" 
ON public.affiliate_commissions 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Affiliates can view own commissions" 
ON public.affiliate_commissions 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.vip_affiliates va
  WHERE va.id = affiliate_commissions.affiliate_id 
  AND va.user_id = auth.uid()
));

-- 5. Fix vip_affiliates (personal data)
DROP POLICY IF EXISTS "Admins can manage all affiliates" ON public.vip_affiliates;
DROP POLICY IF EXISTS "Users can view own affiliate" ON public.vip_affiliates;
DROP POLICY IF EXISTS "Users can update own affiliate" ON public.vip_affiliates;

CREATE POLICY "Admins can manage all affiliates" 
ON public.vip_affiliates 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own affiliate" 
ON public.vip_affiliates 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own affiliate" 
ON public.vip_affiliates 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Fix admin_invitations (sensitive invitation tokens)
DROP POLICY IF EXISTS "Admins can view invitations" ON public.admin_invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON public.admin_invitations;
DROP POLICY IF EXISTS "Owners can delete invitations" ON public.admin_invitations;
DROP POLICY IF EXISTS "Anyone can view pending invitations by token" ON public.admin_invitations;

CREATE POLICY "Admins can manage invitations" 
ON public.admin_invitations 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- Allow viewing pending invitations by token (needed for accept-invite flow)
CREATE POLICY "Anyone can view valid pending invitations" 
ON public.admin_invitations 
FOR SELECT 
USING (
  accepted_at IS NULL 
  AND expires_at > now()
);

-- 7. Fix notifications (user data)
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" 
ON public.notifications 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
ON public.notifications 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications" 
ON public.notifications 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 8. Fix enrollments (user access data)
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.enrollments;

CREATE POLICY "Users can view own enrollments" 
ON public.enrollments 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage enrollments" 
ON public.enrollments 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 9. Fix subscriptions (financial data)
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON public.subscriptions;

CREATE POLICY "Users can view own subscriptions" 
ON public.subscriptions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage subscriptions" 
ON public.subscriptions 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));