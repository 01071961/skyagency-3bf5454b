-- Adicionar storage_url e status na tabela videos
ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS storage_url text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';

-- Criar tabela community_posts se não existir  
CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text,
  course_id uuid,
  media_urls text[],
  likes_count integer DEFAULT 0,
  replies_count integer DEFAULT 0,
  is_pinned boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community posts are viewable" ON public.community_posts
FOR SELECT USING (true);

CREATE POLICY "Users can create own posts" ON public.community_posts
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.community_posts
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON public.community_posts
FOR DELETE USING (auth.uid() = user_id);

-- Criar tabela community_likes
CREATE TABLE IF NOT EXISTS public.community_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE,
  reply_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable" ON public.community_likes
FOR SELECT USING (true);

CREATE POLICY "Users can like" ON public.community_likes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike" ON public.community_likes
FOR DELETE USING (auth.uid() = user_id);

-- Criar tabela community_replies
CREATE TABLE IF NOT EXISTS public.community_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  likes_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Replies are viewable" ON public.community_replies
FOR SELECT USING (true);

CREATE POLICY "Users can reply" ON public.community_replies
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own replies" ON public.community_replies
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own replies" ON public.community_replies
FOR DELETE USING (auth.uid() = user_id);

-- Criar tabela profile_experiences para LinkedIn sync
CREATE TABLE IF NOT EXISTS public.profile_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text,
  company text,
  location text,
  start_date date,
  end_date date,
  is_current boolean DEFAULT false,
  description text,
  linkedin_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.profile_experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own experiences" ON public.profile_experiences
FOR ALL USING (auth.uid() = user_id);