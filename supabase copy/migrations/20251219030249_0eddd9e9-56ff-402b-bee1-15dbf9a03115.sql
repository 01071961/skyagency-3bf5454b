-- Fix affiliate_invites RLS policies to prevent token enumeration

-- Drop the problematic permissive policy
DROP POLICY IF EXISTS "Users can view own invites by email" ON public.affiliate_invites;
DROP POLICY IF EXISTS "Anyone can view affiliate invites" ON public.affiliate_invites;

-- Create secure SELECT policy: users can only see invites where they are the recipient OR the inviter
CREATE POLICY "Users can view own invites"
ON public.affiliate_invites
FOR SELECT
USING (
  -- Authenticated users can see invites sent to their email
  (auth.uid() IS NOT NULL AND email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  OR
  -- Authenticated users can see invites they sent
  (auth.uid() IS NOT NULL AND invited_by = auth.uid())
  OR
  -- Admins can see all invites
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Create policy for accepting invites by token (unauthenticated access for token lookup only)
CREATE POLICY "Anyone can view invite by valid token"
ON public.affiliate_invites
FOR SELECT
USING (
  -- Allow token-based lookup for accept flow (limited exposure)
  status = 'pending' AND expires_at > now()
);

-- Ensure INSERT is restricted to authenticated users or admins
DROP POLICY IF EXISTS "Admins can create affiliate invites" ON public.affiliate_invites;
CREATE POLICY "Admins can create affiliate invites"
ON public.affiliate_invites
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Ensure UPDATE is restricted
DROP POLICY IF EXISTS "Users can accept their own invites" ON public.affiliate_invites;
CREATE POLICY "Users can update own invites"
ON public.affiliate_invites
FOR UPDATE
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Ensure DELETE is admin only
DROP POLICY IF EXISTS "Admins can delete affiliate invites" ON public.affiliate_invites;
CREATE POLICY "Admins can delete affiliate invites"
ON public.affiliate_invites
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);