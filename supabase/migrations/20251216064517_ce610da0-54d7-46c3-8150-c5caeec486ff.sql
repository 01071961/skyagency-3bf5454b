-- Fix RLS policies on chat_conversations to be PERMISSIVE
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Visitors can create their own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Visitors can update their own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Visitors can view their own conversations" ON public.chat_conversations;

-- Create PERMISSIVE policies for chat conversations
CREATE POLICY "Anyone can create conversations" 
ON public.chat_conversations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Visitors and admins can view conversations" 
ON public.chat_conversations 
FOR SELECT 
USING (true);

CREATE POLICY "Visitors and admins can update conversations" 
ON public.chat_conversations 
FOR UPDATE 
USING (true);

-- Also fix chat_messages policies
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.chat_messages;

CREATE POLICY "Anyone can insert messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view messages" 
ON public.chat_messages 
FOR SELECT 
USING (true);