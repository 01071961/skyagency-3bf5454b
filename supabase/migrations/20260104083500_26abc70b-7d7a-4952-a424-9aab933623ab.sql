-- =====================================================
-- FASE 1: STORAGE SEPARADO PARA AFILIADOS
-- =====================================================

-- Bucket separado para arquivos dos afiliados (isolado do admin)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('affiliate-files', 'affiliate-files', false, 104857600, ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv', 'application/zip'
  ])
ON CONFLICT (id) DO NOTHING;

-- Bucket para arquivos do admin (separado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('admin-files', 'admin-files', false, 104857600, ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'application/zip'
  ])
ON CONFLICT (id) DO NOTHING;

-- Bucket para apresentações VIP
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('vip-presentations', 'vip-presentations', false, 209715200, ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ])
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para affiliate-files (cada afiliado acessa SUA pasta)
CREATE POLICY "Affiliates can view own folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'affiliate-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Affiliates can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'affiliate-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Affiliates can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'affiliate-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Affiliates can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'affiliate-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Políticas de storage para admin-files (apenas admins)
CREATE POLICY "Admins can manage admin files"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'admin-files' 
  AND has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'admin-files' 
  AND has_role(auth.uid(), 'admin')
);

-- Políticas para vip-presentations (Gold/Platinum apenas)
CREATE POLICY "VIP users can manage own presentations"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'vip-presentations' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM vip_affiliates va 
    WHERE va.user_id = auth.uid() 
    AND va.tier IN ('gold', 'ouro', 'platinum', 'platina')
  )
)
WITH CHECK (
  bucket_id = 'vip-presentations' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM vip_affiliates va 
    WHERE va.user_id = auth.uid() 
    AND va.tier IN ('gold', 'ouro', 'platinum', 'platina')
  )
);

-- =====================================================
-- FASE 2: PERFIL LINKEDIN-LIKE
-- =====================================================

-- Tabela para experiência profissional
CREATE TABLE IF NOT EXISTS public.profile_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  position TEXT NOT NULL,
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  company_logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para educação
CREATE TABLE IF NOT EXISTS public.profile_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_name TEXT NOT NULL,
  degree TEXT NOT NULL,
  field_of_study TEXT,
  start_date DATE,
  end_date DATE,
  grade TEXT,
  description TEXT,
  institution_logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para habilidades
CREATE TABLE IF NOT EXISTS public.profile_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  endorsements_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, skill_name)
);

-- Tabela para recomendações
CREATE TABLE IF NOT EXISTS public.profile_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommender_id UUID REFERENCES auth.users(id),
  recommender_name TEXT NOT NULL,
  recommender_title TEXT,
  recommender_company TEXT,
  relationship TEXT,
  content TEXT NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para histórico de edições do perfil
CREATE TABLE IF NOT EXISTS public.profile_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- Expandir tabela profiles com campos LinkedIn-like
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS headline TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- =====================================================
-- FASE 3: INFORMAÇÕES DA EMPRESA (ADMIN)
-- =====================================================

-- Tabela para informações da empresa
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  legal_name TEXT,
  cnpj TEXT,
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  address_country TEXT DEFAULT 'Brasil',
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#10b981',
  
  -- Responsáveis legais
  legal_representative_name TEXT,
  legal_representative_cpf TEXT,
  legal_representative_role TEXT,
  legal_representative_signature_url TEXT,
  
  academic_coordinator_name TEXT,
  academic_coordinator_role TEXT,
  academic_coordinator_signature_url TEXT,
  
  -- Configurações de certificado
  certificate_template TEXT DEFAULT 'modern',
  certificate_footer_text TEXT,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- FASE 4: APRESENTAÇÕES VIP (CANVA-LIKE)
-- =====================================================

-- Tabela para apresentações
CREATE TABLE IF NOT EXISTS public.vip_presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Apresentação sem título',
  description TEXT,
  thumbnail_url TEXT,
  slides JSONB DEFAULT '[]'::jsonb,
  theme JSONB DEFAULT '{}'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  views_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para templates de apresentação
CREATE TABLE IF NOT EXISTS public.presentation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  thumbnail_url TEXT,
  slides JSONB DEFAULT '[]'::jsonb,
  theme JSONB DEFAULT '{}'::jsonb,
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para assets da apresentação
CREATE TABLE IF NOT EXISTS public.presentation_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID REFERENCES public.vip_presentations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'video', 'audio', 'icon', 'shape')),
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para histórico de versões
CREATE TABLE IF NOT EXISTS public.presentation_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID NOT NULL REFERENCES public.vip_presentations(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  slides JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Profile experiences
ALTER TABLE public.profile_experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own experiences"
ON public.profile_experiences FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public profiles experiences are visible"
ON public.profile_experiences FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = profile_experiences.user_id 
    AND p.is_public = true
  )
);

-- Profile education
ALTER TABLE public.profile_education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own education"
ON public.profile_education FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public profiles education are visible"
ON public.profile_education FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = profile_education.user_id 
    AND p.is_public = true
  )
);

-- Profile skills
ALTER TABLE public.profile_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own skills"
ON public.profile_skills FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public profiles skills are visible"
ON public.profile_skills FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = profile_skills.user_id 
    AND p.is_public = true
  )
);

-- Profile recommendations
ALTER TABLE public.profile_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recommendations"
ON public.profile_recommendations FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Visible recommendations are public"
ON public.profile_recommendations FOR SELECT
TO authenticated
USING (is_visible = true);

-- Profile edit history
ALTER TABLE public.profile_edit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own edit history"
ON public.profile_edit_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can insert edit history"
ON public.profile_edit_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Company settings
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view company settings"
ON public.company_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage company settings"
ON public.company_settings FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- VIP Presentations
ALTER TABLE public.vip_presentations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "VIP users can manage own presentations"
ON public.vip_presentations FOR ALL
TO authenticated
USING (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM vip_affiliates va 
    WHERE va.user_id = auth.uid() 
    AND va.tier IN ('gold', 'ouro', 'platinum', 'platina')
  )
)
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM vip_affiliates va 
    WHERE va.user_id = auth.uid() 
    AND va.tier IN ('gold', 'ouro', 'platinum', 'platina')
  )
);

CREATE POLICY "Public presentations are viewable"
ON public.vip_presentations FOR SELECT
USING (is_public = true);

-- Presentation templates
ALTER TABLE public.presentation_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "VIP users can view templates"
ON public.presentation_templates FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND (
    is_premium = false 
    OR EXISTS (
      SELECT 1 FROM vip_affiliates va 
      WHERE va.user_id = auth.uid() 
      AND va.tier IN ('gold', 'ouro', 'platinum', 'platina')
    )
  )
);

CREATE POLICY "Admins can manage templates"
ON public.presentation_templates FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Presentation assets
ALTER TABLE public.presentation_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own presentation assets"
ON public.presentation_assets FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Presentation versions
ALTER TABLE public.presentation_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own presentation versions"
ON public.presentation_versions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM vip_presentations p 
    WHERE p.id = presentation_versions.presentation_id 
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create presentation versions"
ON public.presentation_versions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM vip_presentations p 
    WHERE p.id = presentation_versions.presentation_id 
    AND p.user_id = auth.uid()
  )
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profile_experiences_user ON public.profile_experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_education_user ON public.profile_education(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_skills_user ON public.profile_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_recommendations_user ON public.profile_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_presentations_user ON public.vip_presentations(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_presentations_status ON public.vip_presentations(status);
CREATE INDEX IF NOT EXISTS idx_presentation_assets_presentation ON public.presentation_assets(presentation_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_experiences_updated_at
  BEFORE UPDATE ON public.profile_experiences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_trigger();

CREATE TRIGGER update_profile_education_updated_at
  BEFORE UPDATE ON public.profile_education
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_trigger();

CREATE TRIGGER update_vip_presentations_updated_at
  BEFORE UPDATE ON public.vip_presentations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_trigger();

CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_trigger();