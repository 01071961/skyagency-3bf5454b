-- Adicionar colunas faltantes em profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS drive_connected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free';

-- Adicionar colunas faltantes em chat_conversations
ALTER TABLE public.chat_conversations
ADD COLUMN IF NOT EXISTS assigned_admin_id uuid,
ADD COLUMN IF NOT EXISTS transferred_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rating integer,
ADD COLUMN IF NOT EXISTS visitor_name text,
ADD COLUMN IF NOT EXISTS current_mode text DEFAULT 'support',
ADD COLUMN IF NOT EXISTS ai_confidence numeric,
ADD COLUMN IF NOT EXISTS last_activity_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS escalation_reason text;

-- Adicionar colunas faltantes em product_lessons
ALTER TABLE public.product_lessons
ADD COLUMN IF NOT EXISTS quiz_required boolean DEFAULT false;

-- Adicionar colunas faltantes em onboarding_progress
ALTER TABLE public.onboarding_progress
ADD COLUMN IF NOT EXISTS is_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS current_step integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS data jsonb DEFAULT '{}';

-- Adicionar colunas faltantes em chat_messages
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS is_ai_response boolean DEFAULT false;

-- Criar tabela video_likes se não existir
CREATE TABLE IF NOT EXISTS public.video_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(video_id, user_id)
);

ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own video likes" ON public.video_likes
FOR ALL USING (auth.uid() = user_id);

-- Criar tabela video_views se não existir
CREATE TABLE IF NOT EXISTS public.video_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id uuid,
  viewer_ip text,
  watched_seconds integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert video views" ON public.video_views
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own video views" ON public.video_views
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Criar tabela historico_modulos se não existir
CREATE TABLE IF NOT EXISTS public.historico_modulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id uuid REFERENCES public.product_modules(id) ON DELETE CASCADE,
  completed_at timestamp with time zone DEFAULT now(),
  score integer,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.historico_modulos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own historico_modulos" ON public.historico_modulos
FOR ALL USING (auth.uid() = user_id);