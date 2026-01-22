-- Tabela para armazenar conexões de redes sociais dos usuários
CREATE TABLE public.social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'whatsapp')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  platform_user_id TEXT,
  platform_username TEXT,
  platform_name TEXT,
  profile_picture_url TEXT,
  page_id TEXT,
  page_name TEXT,
  permissions TEXT[],
  is_active BOOLEAN DEFAULT true,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Enable RLS
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;

-- Policies: usuários só veem suas próprias conexões
CREATE POLICY "Users can view own social connections"
ON public.social_connections
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own social connections"
ON public.social_connections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social connections"
ON public.social_connections
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own social connections"
ON public.social_connections
FOR DELETE
USING (auth.uid() = user_id);

-- Admins podem ver todas as conexões
CREATE POLICY "Admins can view all social connections"
ON public.social_connections
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_social_connections_updated_at
BEFORE UPDATE ON public.social_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();