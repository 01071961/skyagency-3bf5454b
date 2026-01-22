-- 1. Adicionar colunas para tipo de certificação e módulo na tabela course_certificates
ALTER TABLE public.course_certificates
ADD COLUMN IF NOT EXISTS certification_type TEXT NOT NULL DEFAULT 'course_completion' CHECK (certification_type IN ('course_completion', 'financial', 'module')),
ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES public.product_modules(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

-- 2. Adicionar colunas para armazenamento híbrido na tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS drive_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS default_storage TEXT DEFAULT 'internal' CHECK (default_storage IN ('internal', 'drive')),
ADD COLUMN IF NOT EXISTS storage_used BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'bronze', 'prata', 'ouro', 'diamante', 'platina'));

-- 3. Criar bucket de armazenamento para arquivos dos usuários
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-files', 'user-files', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Criar tabela para tokens do Google Drive (preparação)
CREATE TABLE IF NOT EXISTS public.user_drive_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  expiry_date TIMESTAMPTZ,
  scope TEXT,
  folder_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS for user_drive_tokens
ALTER TABLE public.user_drive_tokens ENABLE ROW LEVEL SECURITY;

-- Policies for user_drive_tokens
CREATE POLICY "Users can view own drive tokens"
ON public.user_drive_tokens FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own drive tokens"
ON public.user_drive_tokens FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drive tokens"
ON public.user_drive_tokens FOR UPDATE
USING (auth.uid() = user_id);

-- 5. Criar tabela para metadados de arquivos internos
CREATE TABLE IF NOT EXISTS public.user_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  file_type TEXT,
  storage_type TEXT NOT NULL DEFAULT 'internal' CHECK (storage_type IN ('internal', 'drive')),
  drive_file_id TEXT,
  drive_web_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for user_files
ALTER TABLE public.user_files ENABLE ROW LEVEL SECURITY;

-- Policies for user_files
CREATE POLICY "Users can view own files"
ON public.user_files FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own files"
ON public.user_files FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files"
ON public.user_files FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
ON public.user_files FOR DELETE
USING (auth.uid() = user_id);

-- 6. Políticas de storage para user-files bucket
CREATE POLICY "Users can view own storage files"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Premium users can upload own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND plan IN ('ouro', 'diamante', 'platina')
  )
);

CREATE POLICY "Users can delete own storage files"
ON storage.objects FOR DELETE
USING (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 7. Função para atualizar storage_used no perfil
CREATE OR REPLACE FUNCTION public.update_user_storage_used()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET storage_used = COALESCE(storage_used, 0) + NEW.file_size WHERE user_id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET storage_used = GREATEST(0, COALESCE(storage_used, 0) - OLD.file_size) WHERE user_id = OLD.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger para atualizar storage_used
DROP TRIGGER IF EXISTS update_storage_on_file_change ON public.user_files;
CREATE TRIGGER update_storage_on_file_change
AFTER INSERT OR DELETE ON public.user_files
FOR EACH ROW
EXECUTE FUNCTION public.update_user_storage_used();

-- 9. Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_files_user_id ON public.user_files(user_id);
CREATE INDEX IF NOT EXISTS idx_course_certificates_certification_type ON public.course_certificates(certification_type);
CREATE INDEX IF NOT EXISTS idx_course_certificates_module_id ON public.course_certificates(module_id);