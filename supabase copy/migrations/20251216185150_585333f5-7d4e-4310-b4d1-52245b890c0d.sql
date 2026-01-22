-- Migration: Implement Anonymous Authentication for Chat System
-- This fixes the PUBLIC_DATA_EXPOSURE and STORAGE_EXPOSURE security issues

-- Add user_id column to chat_conversations for anonymous auth
ALTER TABLE public.chat_conversations 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add user_id column to chat_messages for anonymous auth
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);

-- Drop existing overly permissive policies on chat_conversations
DROP POLICY IF EXISTS "Visitors can view own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Visitors can update own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can create conversations" ON public.chat_conversations;

-- Create new secure policies for chat_conversations using auth.uid()
CREATE POLICY "Authenticated users can view own conversations"
ON public.chat_conversations
FOR SELECT
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Authenticated users can create conversations"
ON public.chat_conversations
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (user_id IS NULL OR user_id = auth.uid())
);

CREATE POLICY "Authenticated users can update own conversations"
ON public.chat_conversations
FOR UPDATE
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Drop existing overly permissive policies on chat_messages
DROP POLICY IF EXISTS "Visitors can view messages in their conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.chat_messages;

-- Create new secure policies for chat_messages using auth.uid()
CREATE POLICY "Authenticated users can view messages in own conversations"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = conversation_id
    AND (c.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Authenticated users can insert messages in own conversations"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = conversation_id
    AND (c.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Update storage policies for chat-attachments bucket
-- First remove overly permissive policies
DROP POLICY IF EXISTS "Anyone can upload chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can download chat attachments" ON storage.objects;

-- Create secure storage policies
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can view chat attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'chat-attachments'
  AND (
    auth.uid() IS NOT NULL
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);