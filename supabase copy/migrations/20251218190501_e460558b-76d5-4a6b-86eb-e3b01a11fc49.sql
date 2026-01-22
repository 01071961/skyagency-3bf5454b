-- Fix abandoned_forms table: Contains customer PII (name, email, phone) with public read access
-- Only admins should be able to view this data

DROP POLICY IF EXISTS "Allow admins to view abandoned_forms" ON public.abandoned_forms;
DROP POLICY IF EXISTS "Admins can view abandoned forms" ON public.abandoned_forms;
DROP POLICY IF EXISTS "Allow admins to manage abandoned_forms" ON public.abandoned_forms;
DROP POLICY IF EXISTS "Admins can update abandoned forms" ON public.abandoned_forms;
DROP POLICY IF EXISTS "Anyone can insert abandoned forms" ON public.abandoned_forms;
DROP POLICY IF EXISTS "Allow anonymous insert abandoned_forms" ON public.abandoned_forms;

-- Create secure policies: Only admins can read PII data
CREATE POLICY "Admins can view abandoned forms" ON public.abandoned_forms
FOR SELECT USING (
  auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin')
);

-- Allow public insert for form tracking (no PII returned)
CREATE POLICY "Anyone can insert abandoned forms" ON public.abandoned_forms
FOR INSERT WITH CHECK (true);

-- Only admins can update
CREATE POLICY "Admins can update abandoned forms" ON public.abandoned_forms
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin')
);

-- Only admins can delete
CREATE POLICY "Admins can delete abandoned forms" ON public.abandoned_forms
FOR DELETE USING (
  auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin')
);