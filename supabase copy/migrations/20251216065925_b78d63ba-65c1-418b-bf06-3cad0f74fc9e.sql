-- Fix ai_assistant_settings RLS - restrict to admin only
DROP POLICY IF EXISTS "Anyone can read AI settings" ON public.ai_assistant_settings;

-- Only admins can read AI settings (edge functions use service role key which bypasses RLS)
CREATE POLICY "Only admins can read AI settings" 
ON public.ai_assistant_settings 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));