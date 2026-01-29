
-- Create admin_invitations table for storing role invites
CREATE TABLE public.admin_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    role app_role NOT NULL,
    token text NOT NULL UNIQUE,
    expires_at timestamp with time zone NOT NULL,
    invited_by uuid REFERENCES auth.users(id),
    inviter_name text,
    accepted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(email, role)
);

-- Enable RLS
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for admin_invitations
CREATE POLICY "Admins can view invitations" 
ON public.admin_invitations FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins can insert invitations" 
ON public.admin_invitations FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins can update invitations" 
ON public.admin_invitations FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins can delete invitations" 
ON public.admin_invitations FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Allow public access to validate tokens (needed for accepting invites)
CREATE POLICY "Anyone can validate invite tokens" 
ON public.admin_invitations FOR SELECT 
USING (token IS NOT NULL);
