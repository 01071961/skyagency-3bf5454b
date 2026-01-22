-- Create enum for video types
CREATE TYPE video_type AS ENUM ('video', 'short', 'live');

-- Create enum for video privacy
CREATE TYPE video_privacy AS ENUM ('public', 'students', 'vip', 'private');

-- Create enum for video status
CREATE TYPE video_status AS ENUM ('processing', 'ready', 'live', 'ended', 'failed');

-- Create videos table
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type video_type NOT NULL DEFAULT 'video',
  privacy video_privacy NOT NULL DEFAULT 'public',
  status video_status NOT NULL DEFAULT 'processing',
  
  -- Storage info
  storage_type TEXT NOT NULL DEFAULT 'internal' CHECK (storage_type IN ('internal', 'drive')),
  storage_url TEXT,
  hls_playlist_url TEXT,
  thumbnail_url TEXT,
  
  -- Video metadata
  duration INTEGER, -- in seconds
  width INTEGER,
  height INTEGER,
  file_size BIGINT,
  mime_type TEXT,
  
  -- Engagement
  views_count INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  
  -- Live specific
  is_recording BOOLEAN DEFAULT false,
  live_started_at TIMESTAMP WITH TIME ZONE,
  live_ended_at TIMESTAMP WITH TIME ZONE,
  recording_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create video_comments table
CREATE TABLE public.video_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.video_comments(id) ON DELETE CASCADE,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create video_likes table
CREATE TABLE public.video_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(video_id, user_id)
);

-- Create video_views table for analytics
CREATE TABLE public.video_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  watched_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create live_chat_messages table
CREATE TABLE public.live_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

-- Videos policies
CREATE POLICY "Public videos are viewable by everyone"
ON public.videos FOR SELECT
USING (privacy = 'public' OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can view student videos"
ON public.videos FOR SELECT
USING (privacy = 'students' AND auth.uid() IS NOT NULL);

CREATE POLICY "VIP users can view VIP videos"
ON public.videos FOR SELECT
USING (privacy = 'vip' AND EXISTS (
  SELECT 1 FROM public.vip_affiliates WHERE user_id = auth.uid() AND status = 'approved'
));

CREATE POLICY "Users can create their own videos"
ON public.videos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos"
ON public.videos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos"
ON public.videos FOR DELETE
USING (auth.uid() = user_id);

-- Video comments policies
CREATE POLICY "Anyone can view video comments"
ON public.video_comments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can comment"
ON public.video_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.video_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.video_comments FOR DELETE
USING (auth.uid() = user_id);

-- Video likes policies
CREATE POLICY "Anyone can view likes"
ON public.video_likes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like"
ON public.video_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their likes"
ON public.video_likes FOR DELETE
USING (auth.uid() = user_id);

-- Video views policies
CREATE POLICY "Anyone can create views"
ON public.video_views FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can see their views"
ON public.video_views FOR SELECT
USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM public.videos WHERE id = video_id));

-- Live chat policies
CREATE POLICY "Anyone can view live chat"
ON public.live_chat_messages FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can chat"
ON public.live_chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for live chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.videos;

-- Create indexes
CREATE INDEX idx_videos_user_id ON public.videos(user_id);
CREATE INDEX idx_videos_type ON public.videos(type);
CREATE INDEX idx_videos_status ON public.videos(status);
CREATE INDEX idx_videos_privacy ON public.videos(privacy);
CREATE INDEX idx_videos_created_at ON public.videos(created_at DESC);
CREATE INDEX idx_video_comments_video_id ON public.video_comments(video_id);
CREATE INDEX idx_video_likes_video_id ON public.video_likes(video_id);
CREATE INDEX idx_live_chat_video_id ON public.live_chat_messages(video_id);

-- Trigger to update comments count
CREATE OR REPLACE FUNCTION update_video_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.videos SET comments_count = comments_count + 1 WHERE id = NEW.video_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.videos SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.video_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_video_comment_change
AFTER INSERT OR DELETE ON public.video_comments
FOR EACH ROW EXECUTE FUNCTION update_video_comments_count();

-- Trigger to update likes count
CREATE OR REPLACE FUNCTION update_video_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.videos SET likes_count = likes_count + 1 WHERE id = NEW.video_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.videos SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.video_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_video_like_change
AFTER INSERT OR DELETE ON public.video_likes
FOR EACH ROW EXECUTE FUNCTION update_video_likes_count();

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('videos', 'videos', true, 5368709120, ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for videos bucket
CREATE POLICY "Anyone can view videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);