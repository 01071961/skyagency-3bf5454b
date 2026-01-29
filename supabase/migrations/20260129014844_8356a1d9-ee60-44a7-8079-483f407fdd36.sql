-- Adicionar mais colunas em profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS cover_image_url text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS headline text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS twitter_url text,
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS youtube_url text,
ADD COLUMN IF NOT EXISTS tiktok_url text,
ADD COLUMN IF NOT EXISTS github_url text;

-- Adicionar colunas em vip_affiliates
ALTER TABLE public.vip_affiliates
ADD COLUMN IF NOT EXISTS referral_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS tier text DEFAULT 'bronze';

-- Adicionar colunas em community_posts
ALTER TABLE public.community_posts
ADD COLUMN IF NOT EXISTS is_resolved boolean DEFAULT false;

-- Adicionar colunas em community_replies  
ALTER TABLE public.community_replies
ADD COLUMN IF NOT EXISTS is_solution boolean DEFAULT false;

-- Adicionar read_at em notifications
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS read_at timestamp with time zone;

-- Criar tabela profile_education
CREATE TABLE IF NOT EXISTS public.profile_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  school text,
  degree text,
  field_of_study text,
  start_date date,
  end_date date,
  is_current boolean DEFAULT false,
  description text,
  linkedin_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.profile_education ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own education" ON public.profile_education;
CREATE POLICY "Users can manage own education" ON public.profile_education
FOR ALL USING (auth.uid() = user_id);

-- Criar tabela profile_skills
CREATE TABLE IF NOT EXISTS public.profile_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  endorsement_count integer DEFAULT 0,
  linkedin_id text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.profile_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own skills" ON public.profile_skills;
CREATE POLICY "Users can manage own skills" ON public.profile_skills
FOR ALL USING (auth.uid() = user_id);

-- Criar tabela profile_edit_history
CREATE TABLE IF NOT EXISTS public.profile_edit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  field_changed text,
  old_value text,
  new_value text,
  changed_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.profile_edit_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own edit history" ON public.profile_edit_history;
CREATE POLICY "Users can view own edit history" ON public.profile_edit_history
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own edit history" ON public.profile_edit_history;
CREATE POLICY "Users can insert own edit history" ON public.profile_edit_history
FOR INSERT WITH CHECK (auth.uid() = user_id);