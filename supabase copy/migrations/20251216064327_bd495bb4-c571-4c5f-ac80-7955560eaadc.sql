-- Fix RLS policies on admin_emails to allow admins to manage invites properly
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow admins to manage admin_emails" ON public.admin_emails;
DROP POLICY IF EXISTS "Allow admins to view admin_emails" ON public.admin_emails;

-- Create proper PERMISSIVE policies for admin management
CREATE POLICY "Admins can view admin_emails" 
ON public.admin_emails 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert admin_emails" 
ON public.admin_emails 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update admin_emails" 
ON public.admin_emails 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete admin_emails" 
ON public.admin_emails 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));