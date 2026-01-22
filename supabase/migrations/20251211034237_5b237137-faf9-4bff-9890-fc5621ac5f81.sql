-- =====================================================
-- FASE 1: CORREÇÕES DE SEGURANÇA RLS
-- =====================================================

-- Remover políticas permissivas antigas de chat_conversations
DROP POLICY IF EXISTS "Anyone can create conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Anyone can update their own conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Anyone can view their own conversations" ON chat_conversations;

-- Remover políticas permissivas antigas de chat_messages
DROP POLICY IF EXISTS "Anyone can insert messages" ON chat_messages;
DROP POLICY IF EXISTS "Anyone can view messages" ON chat_messages;

-- =====================================================
-- FASE 2: NOVAS COLUNAS EM chat_conversations
-- =====================================================

ALTER TABLE chat_conversations 
ADD COLUMN IF NOT EXISTS visitor_phone text,
ADD COLUMN IF NOT EXISTS subject text,
ADD COLUMN IF NOT EXISTS assigned_admin_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS transferred_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_activity_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS is_typing_admin boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_typing_visitor boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS rating integer CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN IF NOT EXISTS rating_comment text,
ADD COLUMN IF NOT EXISTS form_completed boolean DEFAULT false;

-- =====================================================
-- FASE 3: NOVAS COLUNAS EM chat_messages
-- =====================================================

ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
ADD COLUMN IF NOT EXISTS file_url text,
ADD COLUMN IF NOT EXISTS file_name text,
ADD COLUMN IF NOT EXISTS file_type text,
ADD COLUMN IF NOT EXISTS file_size integer;

-- =====================================================
-- FASE 4: NOVA TABELA admin_availability
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  status text DEFAULT 'offline' CHECK (status IN ('online', 'busy', 'away', 'offline')),
  last_seen_at timestamp with time zone DEFAULT now(),
  active_conversations integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS para admin_availability
ALTER TABLE admin_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view admin availability" ON admin_availability
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage their own availability" ON admin_availability
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- FASE 5: NOVA TABELA abandoned_forms
-- =====================================================

CREATE TABLE IF NOT EXISTS abandoned_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  name text,
  email text,
  phone text,
  subject text,
  created_at timestamp with time zone DEFAULT now(),
  follow_up_sent boolean DEFAULT false,
  follow_up_sent_at timestamp with time zone
);

-- RLS para abandoned_forms
ALTER TABLE abandoned_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view abandoned forms" ON abandoned_forms
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert abandoned forms" ON abandoned_forms
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update abandoned forms" ON abandoned_forms
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- FASE 6: NOVAS POLÍTICAS RLS SEGURAS
-- =====================================================

-- Políticas para chat_conversations (baseadas em visitor_id)
CREATE POLICY "Visitors can create their own conversations" ON chat_conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Visitors can view their own conversations" ON chat_conversations
  FOR SELECT USING (
    visitor_id = current_setting('request.headers', true)::json->>'x-visitor-id'
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Visitors can update their own conversations" ON chat_conversations
  FOR UPDATE USING (
    visitor_id = current_setting('request.headers', true)::json->>'x-visitor-id'
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Políticas para chat_messages
CREATE POLICY "Users can insert messages in their conversations" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations c
      WHERE c.id = conversation_id
      AND (
        c.visitor_id = current_setting('request.headers', true)::json->>'x-visitor-id'
        OR has_role(auth.uid(), 'admin'::app_role)
      )
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can view messages in their conversations" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_conversations c
      WHERE c.id = conversation_id
      AND (
        c.visitor_id = current_setting('request.headers', true)::json->>'x-visitor-id'
        OR has_role(auth.uid(), 'admin'::app_role)
      )
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- =====================================================
-- FASE 7: STORAGE BUCKET PARA ARQUIVOS
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments', 
  'chat-attachments', 
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "Anyone can upload chat attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "Anyone can view chat attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-attachments');

CREATE POLICY "Admins can delete chat attachments" ON storage.objects
  FOR DELETE USING (bucket_id = 'chat-attachments' AND has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- FASE 8: HABILITAR REALTIME
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE admin_availability;

-- =====================================================
-- FASE 9: TRIGGER PARA UPDATED_AT
-- =====================================================

CREATE TRIGGER update_admin_availability_updated_at
  BEFORE UPDATE ON admin_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();