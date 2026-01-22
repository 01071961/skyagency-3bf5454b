-- Create function to check if user has specific role or higher
CREATE OR REPLACE FUNCTION public.has_role_or_higher(_user_id uuid, _min_role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND (
      (_min_role = 'user' AND role IN ('user', 'editor', 'admin', 'owner')) OR
      (_min_role = 'editor' AND role IN ('editor', 'admin', 'owner')) OR
      (_min_role = 'admin' AND role IN ('admin', 'owner')) OR
      (_min_role = 'owner' AND role = 'owner')
    )
  );
END;
$$;

-- Create function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  SELECT role INTO user_role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'owner' THEN 1 
      WHEN 'admin' THEN 2 
      WHEN 'moderator' THEN 3
      WHEN 'editor' THEN 4
      WHEN 'user' THEN 5 
    END
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'user'::app_role);
END;
$$;

-- Create admin invitations table for role-based invites
CREATE TABLE IF NOT EXISTS public.admin_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role app_role NOT NULL DEFAULT 'editor',
  token text NOT NULL UNIQUE,
  invited_by uuid REFERENCES auth.users(id),
  inviter_name text,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on admin_invitations
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- Only owners and admins can view invitations
CREATE POLICY "Admins can view invitations"
ON public.admin_invitations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Only owners can create owner invitations, admins can create editor/admin invitations
CREATE POLICY "Authorized users can insert invitations"
ON public.admin_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  (public.has_role(auth.uid(), 'owner')) OR 
  (public.has_role(auth.uid(), 'admin') AND role IN ('editor', 'admin'))
);

-- Only owners can delete invitations
CREATE POLICY "Owners can delete invitations"
ON public.admin_invitations
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_invitations_token ON public.admin_invitations(token);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_email ON public.admin_invitations(email);