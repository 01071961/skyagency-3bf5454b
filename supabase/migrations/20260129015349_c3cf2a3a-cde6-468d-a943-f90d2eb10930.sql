-- Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS followers_count integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count integer DEFAULT 0;

-- Add missing columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sales_page_content jsonb DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pricing_type text DEFAULT 'one_time';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cover_image_url text;

-- Add missing columns to affiliate_invites
ALTER TABLE public.affiliate_invites ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE public.affiliate_invites ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.affiliate_invites ADD COLUMN IF NOT EXISTS program_id uuid;
ALTER TABLE public.affiliate_invites ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 0;
ALTER TABLE public.affiliate_invites ADD COLUMN IF NOT EXISTS invited_by uuid;

-- Create affiliate_follows table if not exists
CREATE TABLE IF NOT EXISTS public.affiliate_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.affiliate_follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "affiliate_follows_select" ON public.affiliate_follows;
DROP POLICY IF EXISTS "affiliate_follows_all" ON public.affiliate_follows;
CREATE POLICY "affiliate_follows_select" ON public.affiliate_follows FOR SELECT USING (true);
CREATE POLICY "affiliate_follows_all" ON public.affiliate_follows FOR ALL USING (true);

-- Add affiliate_id column to affiliate_post_likes if missing
ALTER TABLE public.affiliate_post_likes ADD COLUMN IF NOT EXISTS affiliate_id uuid;

-- Create vip_live_chat table if not exists
CREATE TABLE IF NOT EXISTS public.vip_live_chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.vip_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_pinned boolean DEFAULT false,
  is_highlighted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.vip_live_chat ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vip_live_chat_select" ON public.vip_live_chat;
DROP POLICY IF EXISTS "vip_live_chat_all" ON public.vip_live_chat;
CREATE POLICY "vip_live_chat_select" ON public.vip_live_chat FOR SELECT USING (true);
CREATE POLICY "vip_live_chat_all" ON public.vip_live_chat FOR ALL USING (auth.uid() = user_id);

-- Add referrer_id column to affiliate_referrals if missing
ALTER TABLE public.affiliate_referrals ADD COLUMN IF NOT EXISTS referrer_id uuid;

-- Add title and category columns to affiliate_posts if missing
ALTER TABLE public.affiliate_posts ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.affiliate_posts ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.affiliate_posts ADD COLUMN IF NOT EXISTS image_url text;

-- Add certificate_template_id to company_settings if it uses key-value structure
-- Since company_settings uses setting_key/setting_value pattern, we need to handle it differently in code