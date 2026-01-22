-- Product categories table
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default categories
INSERT INTO public.product_categories (name, slug, description, icon) VALUES
  ('Marketing Digital', 'marketing-digital', 'Cursos e materiais sobre marketing online', 'TrendingUp'),
  ('Desenvolvimento Pessoal', 'desenvolvimento-pessoal', 'Autoconhecimento e crescimento', 'User'),
  ('Negócios', 'negocios', 'Empreendedorismo e gestão', 'Briefcase'),
  ('Tecnologia', 'tecnologia', 'Programação e ferramentas digitais', 'Code'),
  ('Streaming', 'streaming', 'Lives, OBS, monetização de conteúdo', 'Video'),
  ('Finanças', 'financas', 'Investimentos e educação financeira', 'DollarSign'),
  ('Saúde e Bem-estar', 'saude-bem-estar', 'Fitness, nutrição e qualidade de vida', 'Heart'),
  ('Criatividade', 'criatividade', 'Design, fotografia, vídeo', 'Palette')
ON CONFLICT (slug) DO NOTHING;

-- Enhance products table with new columns for Hotmart-like features
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.product_categories(id),
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'pt-BR',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS guarantee_days INTEGER DEFAULT 7,
  ADD COLUMN IF NOT EXISTS sales_page_template TEXT DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS sales_page_content JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS affiliate_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS affiliate_commission_rate NUMERIC DEFAULT 50,
  ADD COLUMN IF NOT EXISTS trailer_url TEXT,
  ADD COLUMN IF NOT EXISTS testimonials JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS faq JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS hotmart_product_id TEXT,
  ADD COLUMN IF NOT EXISTS hotmart_webhook_url TEXT,
  ADD COLUMN IF NOT EXISTS external_integrations JSONB DEFAULT '{}';

-- Affiliate materials table (banners, swipes, etc)
CREATE TABLE IF NOT EXISTS public.affiliate_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'banner', 'email_swipe', 'social_post', 'video'
  title TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  dimensions TEXT, -- '300x250', '728x90', etc
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Product content table (for courses: modules and lessons are separate)
-- For other types: generic content storage
CREATE TABLE IF NOT EXISTS public.product_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'ebook_file', 'audiobook_chapter', 'software_file', 'license_key', 'generic_file'
  title TEXT,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  position INTEGER DEFAULT 0,
  is_preview BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sales page templates
CREATE TABLE IF NOT EXISTS public.sales_page_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  thumbnail_url TEXT,
  template_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default templates
INSERT INTO public.sales_page_templates (name, slug, description, template_config) VALUES
  ('Clássico', 'classic', 'Layout tradicional com hero, benefícios e CTA', '{"layout": "classic", "sections": ["hero", "benefits", "modules", "testimonials", "faq", "cta"]}'),
  ('Minimalista', 'minimal', 'Design limpo e focado na conversão', '{"layout": "minimal", "sections": ["hero", "features", "cta"]}'),
  ('VSL Focus', 'vsl', 'Centrado em vídeo de vendas', '{"layout": "vsl", "sections": ["video", "benefits", "testimonials", "cta"]}'),
  ('Landing Longa', 'long-form', 'Página extensa com todos os elementos', '{"layout": "long-form", "sections": ["hero", "problem", "solution", "benefits", "modules", "bonus", "testimonials", "guarantee", "faq", "cta"]}'),
  ('Premium Dark', 'premium-dark', 'Estilo premium com tema escuro', '{"layout": "premium-dark", "sections": ["hero", "features", "modules", "testimonials", "pricing", "faq"]}')
ON CONFLICT (slug) DO NOTHING;

-- Enable RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_page_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view categories" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.product_categories FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active materials" ON public.affiliate_materials FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage materials" ON public.affiliate_materials FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Enrolled users can view content" ON public.product_content FOR SELECT 
USING (
  is_preview = true OR 
  EXISTS (
    SELECT 1 FROM enrollments e 
    WHERE e.product_id = product_content.product_id 
    AND e.user_id = auth.uid() 
    AND e.status = 'active'
  ) OR
  has_role(auth.uid(), 'admin')
);
CREATE POLICY "Admins can manage content" ON public.product_content FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view templates" ON public.sales_page_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage templates" ON public.sales_page_templates FOR ALL USING (has_role(auth.uid(), 'admin'));