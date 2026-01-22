-- Fix infinite recursion in tenant_members RLS policy
-- Create security definer function to check tenant membership

-- First, drop the problematic policy if it exists
DROP POLICY IF EXISTS "Users can view their own tenant memberships" ON public.tenant_members;
DROP POLICY IF EXISTS "tenant_members_select_policy" ON public.tenant_members;

-- Create a security definer function to check membership
CREATE OR REPLACE FUNCTION public.is_tenant_member(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE user_id = _user_id AND tenant_id = _tenant_id
  )
$$;

-- Create safe RLS policies for tenant_members
CREATE POLICY "Users can view own memberships"
ON public.tenant_members
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own memberships"
ON public.tenant_members
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own memberships"
ON public.tenant_members
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own memberships"
ON public.tenant_members
FOR DELETE
USING (user_id = auth.uid());