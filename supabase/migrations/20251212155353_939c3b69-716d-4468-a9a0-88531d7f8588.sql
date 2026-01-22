-- Fix chat_messages RLS policy - restrict SELECT to conversation participants only
DROP POLICY IF EXISTS "Anyone can view messages in conversations" ON public.chat_messages;

CREATE POLICY "Users can view messages in their conversations" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = conversation_id 
      AND (
        c.visitor_id = (current_setting('request.headers', true)::json->>'x-visitor-id')
        OR has_role(auth.uid(), 'admin'::app_role)
      )
    )
  );

-- Fix abandoned_forms RLS policy - add explicit SELECT restriction to admins only
-- The table already has admin-only SELECT but let's ensure it's properly configured
DROP POLICY IF EXISTS "Admins can view abandoned forms" ON public.abandoned_forms;

CREATE POLICY "Admins can view abandoned forms" ON public.abandoned_forms
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix contact_submissions RLS policy - ensure SELECT is admin-only
DROP POLICY IF EXISTS "Admins can view contact submissions" ON public.contact_submissions;

CREATE POLICY "Admins can view contact submissions" ON public.contact_submissions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Also add protection for admin_emails table
DROP POLICY IF EXISTS "Admins can manage admin emails" ON public.admin_emails;

CREATE POLICY "Admins can manage admin emails" ON public.admin_emails
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));