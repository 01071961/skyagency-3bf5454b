-- Fix RLS policies for abandoned_forms table
DROP POLICY IF EXISTS "Allow insert from visitor" ON public.abandoned_forms;
DROP POLICY IF EXISTS "Allow admins full access" ON public.abandoned_forms;

-- Only admins can view abandoned_forms (contains PII)
CREATE POLICY "Allow admins to view abandoned_forms"
ON public.abandoned_forms
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert/update/delete abandoned_forms
CREATE POLICY "Allow admins to manage abandoned_forms"
ON public.abandoned_forms
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow edge functions/anonymous to insert (for tracking)
CREATE POLICY "Allow anonymous insert abandoned_forms"
ON public.abandoned_forms
FOR INSERT
WITH CHECK (true);

-- Fix RLS policies for admin_emails table
DROP POLICY IF EXISTS "Anyone can view admin emails" ON public.admin_emails;
DROP POLICY IF EXISTS "Admins can manage admin emails" ON public.admin_emails;

-- Only admins can view admin_emails (contains staff contact info)
CREATE POLICY "Allow admins to view admin_emails"
ON public.admin_emails
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can manage admin_emails
CREATE POLICY "Allow admins to manage admin_emails"
ON public.admin_emails
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));