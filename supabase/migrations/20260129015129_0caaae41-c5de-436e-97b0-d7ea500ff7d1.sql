-- Add missing values to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'editor';

-- Create scheduled_posts table
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL CHECK (platform IN ('facebook', 'instagram', 'both')),
  content text NOT NULL,
  media_url text,
  media_type text DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  scheduled_at timestamptz NOT NULL,
  published_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'failed', 'cancelled')),
  error_message text,
  facebook_post_id text,
  instagram_post_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own scheduled posts" ON public.scheduled_posts
  FOR ALL USING (auth.uid() = user_id);

-- Create system_health_status table
CREATE TABLE IF NOT EXISTS public.system_health_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text UNIQUE NOT NULL,
  status text DEFAULT 'operational' CHECK (status IN ('operational', 'degraded', 'down', 'maintenance')),
  last_check_at timestamptz DEFAULT now(),
  response_time_ms integer,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.system_health_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view system health" ON public.system_health_status FOR SELECT USING (true);
CREATE POLICY "Admins can manage system health" ON public.system_health_status FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Insert default health services
INSERT INTO public.system_health_status (service_name, status) VALUES
  ('database', 'operational'),
  ('edge_functions', 'operational'),
  ('payment_api', 'operational'),
  ('storage', 'operational'),
  ('email_api', 'operational'),
  ('backend', 'operational')
ON CONFLICT (service_name) DO NOTHING;

-- Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_views integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_end timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Add missing columns to user_points
ALTER TABLE public.user_points ADD COLUMN IF NOT EXISTS current_balance integer DEFAULT 0;
ALTER TABLE public.user_points ADD COLUMN IF NOT EXISTS total_earned integer DEFAULT 0;
ALTER TABLE public.user_points ADD COLUMN IF NOT EXISTS tier text DEFAULT 'bronze';

-- Add missing columns to vip_affiliates
ALTER TABLE public.vip_affiliates ADD COLUMN IF NOT EXISTS direct_referrals_count integer DEFAULT 0;
ALTER TABLE public.vip_affiliates ADD COLUMN IF NOT EXISTS available_balance numeric DEFAULT 0;
ALTER TABLE public.vip_affiliates ADD COLUMN IF NOT EXISTS total_earnings numeric DEFAULT 0;
ALTER TABLE public.vip_affiliates ADD COLUMN IF NOT EXISTS tier text DEFAULT 'bronze';
ALTER TABLE public.vip_affiliates ADD COLUMN IF NOT EXISTS is_creator boolean DEFAULT false;

-- Add missing column to study_streaks
ALTER TABLE public.study_streaks ADD COLUMN IF NOT EXISTS last_activity_date date;

-- Add missing column to affiliate_commissions
ALTER TABLE public.affiliate_commissions ADD COLUMN IF NOT EXISTS commission_amount numeric DEFAULT 0;