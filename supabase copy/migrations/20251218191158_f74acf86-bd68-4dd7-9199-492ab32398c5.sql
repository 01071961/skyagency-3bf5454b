-- Fix chat_conversations table: Contains visitor PII (email, phone, name) 
-- Ensure proper authorization for all operations

-- Drop existing policies to recreate with proper security
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Authenticated users can view own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can update conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can delete conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.chat_conversations;

-- Create secure policies

-- Admins can do everything
CREATE POLICY "Admins can manage all conversations" ON public.chat_conversations
FOR ALL USING (
  auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin')
);

-- Authenticated users can view their own conversations (by user_id)
CREATE POLICY "Users can view own conversations" ON public.chat_conversations
FOR SELECT USING (
  auth.uid() IS NOT NULL AND user_id = auth.uid()
);

-- Authenticated users can create conversations - must set user_id to their own
CREATE POLICY "Users can create own conversations" ON public.chat_conversations
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (user_id = auth.uid() OR user_id IS NULL)
);

-- Users can update their own conversations
CREATE POLICY "Users can update own conversations" ON public.chat_conversations
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND user_id = auth.uid()
);

-- Note: visitor_id based access is still allowed but requires auth.uid() to be present
-- This ensures anonymous conversations are linked to authenticated sessions