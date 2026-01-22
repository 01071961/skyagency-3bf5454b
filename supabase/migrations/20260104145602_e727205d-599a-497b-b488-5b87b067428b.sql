-- =============================================
-- PLANO DE MELHORIAS SAAS HÍBRIDA COMPLETA
-- =============================================

-- 1. SISTEMA DE COMUNIDADE REAL
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  course_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_solution BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES public.community_replies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, reply_id)
);

-- 2. POSTS AGENDADOS REAL
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'both')),
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'failed', 'cancelled')),
  error_message TEXT,
  facebook_post_id TEXT,
  instagram_post_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. MÉTRICAS DE ESTUDO (adicionar watch_time se não existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lesson_progress' AND column_name = 'watch_time_seconds'
  ) THEN
    ALTER TABLE public.lesson_progress ADD COLUMN watch_time_seconds INTEGER DEFAULT 0;
  END IF;
END $$;

-- 4. TABELA DE STREAK DE ESTUDOS
CREATE TABLE IF NOT EXISTS public.study_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  total_study_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. HEALTH CHECK STATUS TABLE
CREATE TABLE IF NOT EXISTS public.system_health_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'operational' CHECK (status IN ('operational', 'degraded', 'down', 'maintenance')),
  last_check_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  response_time_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Initial health services
INSERT INTO public.system_health_status (service_name, status) VALUES
  ('backend', 'operational'),
  ('database', 'operational'),
  ('email_api', 'operational'),
  ('payment_api', 'operational'),
  ('storage', 'operational'),
  ('edge_functions', 'operational')
ON CONFLICT (service_name) DO NOTHING;

-- 6. ENABLE RLS ON NEW TABLES
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_status ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES FOR COMMUNITY
CREATE POLICY "Users can view all posts" ON public.community_posts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.community_posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view all replies" ON public.community_replies FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create replies" ON public.community_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own replies" ON public.community_replies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own replies" ON public.community_replies FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view all likes" ON public.community_likes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage own likes" ON public.community_likes FOR ALL USING (auth.uid() = user_id);

-- 8. RLS POLICIES FOR SCHEDULED POSTS
CREATE POLICY "Admins can view all scheduled posts" ON public.scheduled_posts FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage scheduled posts" ON public.scheduled_posts FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 9. RLS POLICIES FOR STUDY STREAKS
CREATE POLICY "Users can view own streak" ON public.study_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own streak" ON public.study_streaks FOR ALL USING (auth.uid() = user_id);

-- 10. RLS POLICIES FOR HEALTH STATUS
CREATE POLICY "Admins can view health status" ON public.system_health_status FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can update health status" ON public.system_health_status FOR UPDATE USING (true);

-- 11. FUNCTION TO UPDATE STUDY STREAK
CREATE OR REPLACE FUNCTION public.update_study_streak(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  SELECT last_activity_date, current_streak, longest_streak 
  INTO v_last_activity, v_current_streak, v_longest_streak
  FROM study_streaks WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO study_streaks (user_id, current_streak, longest_streak, last_activity_date, total_study_days)
    VALUES (p_user_id, 1, 1, v_today, 1);
  ELSIF v_last_activity = v_today THEN
    -- Already updated today, do nothing
    NULL;
  ELSIF v_last_activity = v_today - 1 THEN
    -- Consecutive day, increment streak
    UPDATE study_streaks SET
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      last_activity_date = v_today,
      total_study_days = total_study_days + 1,
      updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    -- Streak broken, reset to 1
    UPDATE study_streaks SET
      current_streak = 1,
      last_activity_date = v_today,
      total_study_days = total_study_days + 1,
      updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- 12. TRIGGER TO UPDATE STREAK ON LESSON PROGRESS
CREATE OR REPLACE FUNCTION public.trigger_update_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM update_study_streak(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_lesson_progress_update_streak ON public.lesson_progress;
CREATE TRIGGER on_lesson_progress_update_streak
  AFTER INSERT OR UPDATE ON public.lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_streak();

-- 13. FUNCTION TO UPDATE COMMUNITY COUNTS
CREATE OR REPLACE FUNCTION public.update_community_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'community_replies' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE community_posts SET replies_count = replies_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE community_posts SET replies_count = GREATEST(0, replies_count - 1) WHERE id = OLD.post_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'community_likes' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.post_id IS NOT NULL THEN
        UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
      ELSIF NEW.reply_id IS NOT NULL THEN
        UPDATE community_replies SET likes_count = likes_count + 1 WHERE id = NEW.reply_id;
      END IF;
    ELSIF TG_OP = 'DELETE' THEN
      IF OLD.post_id IS NOT NULL THEN
        UPDATE community_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
      ELSIF OLD.reply_id IS NOT NULL THEN
        UPDATE community_replies SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.reply_id;
      END IF;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS on_community_reply_change ON public.community_replies;
CREATE TRIGGER on_community_reply_change
  AFTER INSERT OR DELETE ON public.community_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_community_counts();

DROP TRIGGER IF EXISTS on_community_like_change ON public.community_likes;
CREATE TRIGGER on_community_like_change
  AFTER INSERT OR DELETE ON public.community_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_community_counts();

-- 14. ENABLE REALTIME FOR NEW TABLES
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_replies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_health_status;