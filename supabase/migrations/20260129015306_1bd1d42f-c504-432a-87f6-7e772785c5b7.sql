-- Add missing columns to existing vip_posts table
ALTER TABLE public.vip_posts ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.vip_posts ADD COLUMN IF NOT EXISTS media_type text DEFAULT 'text';
ALTER TABLE public.vip_posts ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE public.vip_posts ADD COLUMN IF NOT EXISTS youtube_video_id text;
ALTER TABLE public.vip_posts ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE public.vip_posts ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.vip_posts ADD COLUMN IF NOT EXISTS hashtags text[];
ALTER TABLE public.vip_posts ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0;
ALTER TABLE public.vip_posts ADD COLUMN IF NOT EXISTS dislikes_count integer DEFAULT 0;
ALTER TABLE public.vip_posts ADD COLUMN IF NOT EXISTS shares_count integer DEFAULT 0;
ALTER TABLE public.vip_posts ADD COLUMN IF NOT EXISTS is_live boolean DEFAULT false;
ALTER TABLE public.vip_posts ADD COLUMN IF NOT EXISTS live_started_at timestamptz;
ALTER TABLE public.vip_posts ADD COLUMN IF NOT EXISTS live_ended_at timestamptz;

-- Copy user_id to author_id for existing records
UPDATE public.vip_posts SET author_id = user_id WHERE author_id IS NULL AND user_id IS NOT NULL;

-- Create missing VIP tables

-- VIP Follows table
CREATE TABLE IF NOT EXISTS public.vip_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.vip_follows ENABLE ROW LEVEL SECURITY;

-- VIP Reactions table
CREATE TABLE IF NOT EXISTS public.vip_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES public.vip_posts(id) ON DELETE CASCADE NOT NULL,
  reaction_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.vip_reactions ENABLE ROW LEVEL SECURITY;

-- VIP Comments table
CREATE TABLE IF NOT EXISTS public.vip_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.vip_posts(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_id uuid REFERENCES public.vip_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  likes_count integer DEFAULT 0,
  replies_count integer DEFAULT 0,
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.vip_comments ENABLE ROW LEVEL SECURITY;

-- VIP Bookmarks table
CREATE TABLE IF NOT EXISTS public.vip_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES public.vip_posts(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.vip_bookmarks ENABLE ROW LEVEL SECURITY;

-- Add missing column to exam_attempts
ALTER TABLE public.exam_attempts ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Add missing columns to generated_certificates 
ALTER TABLE public.generated_certificates ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.generated_certificates ADD COLUMN IF NOT EXISTS product_id uuid;
ALTER TABLE public.generated_certificates ADD COLUMN IF NOT EXISTS status text DEFAULT 'generated';
ALTER TABLE public.generated_certificates ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Add missing column to admin_availability
ALTER TABLE public.admin_availability ADD COLUMN IF NOT EXISTS status text DEFAULT 'offline';

-- Add referral_count to vip_affiliates if missing
ALTER TABLE public.vip_affiliates ADD COLUMN IF NOT EXISTS referral_count integer DEFAULT 0;

-- Add last_activity_date to study_streaks if missing
ALTER TABLE public.study_streaks ADD COLUMN IF NOT EXISTS last_activity_date date;

-- Create RLS policies for new tables
DROP POLICY IF EXISTS "vip_follows_select" ON public.vip_follows;
DROP POLICY IF EXISTS "vip_follows_all" ON public.vip_follows;
CREATE POLICY "vip_follows_select" ON public.vip_follows FOR SELECT USING (true);
CREATE POLICY "vip_follows_all" ON public.vip_follows FOR ALL USING (auth.uid() = follower_id);

DROP POLICY IF EXISTS "vip_reactions_select" ON public.vip_reactions;
DROP POLICY IF EXISTS "vip_reactions_all" ON public.vip_reactions;
CREATE POLICY "vip_reactions_select" ON public.vip_reactions FOR SELECT USING (true);
CREATE POLICY "vip_reactions_all" ON public.vip_reactions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "vip_comments_select" ON public.vip_comments;
DROP POLICY IF EXISTS "vip_comments_all" ON public.vip_comments;
CREATE POLICY "vip_comments_select" ON public.vip_comments FOR SELECT USING (true);
CREATE POLICY "vip_comments_all" ON public.vip_comments FOR ALL USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "vip_bookmarks_select" ON public.vip_bookmarks;
DROP POLICY IF EXISTS "vip_bookmarks_all" ON public.vip_bookmarks;
CREATE POLICY "vip_bookmarks_select" ON public.vip_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "vip_bookmarks_all" ON public.vip_bookmarks FOR ALL USING (auth.uid() = user_id);