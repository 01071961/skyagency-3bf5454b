-- ========================================
-- VIP SOCIAL NETWORK TABLES
-- ========================================

-- 1. Follows table (Follow/Unfollow system)
CREATE TABLE IF NOT EXISTS public.vip_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- 2. Posts table (Feed content)
CREATE TABLE IF NOT EXISTS public.vip_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  media_type TEXT CHECK (media_type IN ('text', 'image', 'video', 'short', 'live')),
  media_url TEXT,
  youtube_video_id TEXT,
  thumbnail_url TEXT,
  title TEXT,
  hashtags TEXT[],
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  dislikes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  is_live BOOLEAN DEFAULT false,
  live_started_at TIMESTAMPTZ,
  live_ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Reactions table (Like, Dislike, Heart, Wow, Haha, Sad, Angry + Super Reactions)
CREATE TABLE IF NOT EXISTS public.vip_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.vip_posts(id) ON DELETE CASCADE,
  comment_id UUID,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike', 'heart', 'wow', 'haha', 'sad', 'angry', 'super_like', 'super_heart', 'fire')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, post_id, comment_id)
);

-- 4. Comments table (with nested replies)
CREATE TABLE IF NOT EXISTS public.vip_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.vip_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.vip_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Bookmarks/Saved posts
CREATE TABLE IF NOT EXISTS public.vip_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.vip_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- 6. Playlists table
CREATE TABLE IF NOT EXISTS public.vip_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  thumbnail_url TEXT,
  posts_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Playlist items
CREATE TABLE IF NOT EXISTS public.vip_playlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES public.vip_playlists(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.vip_posts(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(playlist_id, post_id)
);

-- 8. Live chat messages
CREATE TABLE IF NOT EXISTS public.vip_live_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.vip_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_highlighted BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  deleted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Shares tracking
CREATE TABLE IF NOT EXISTS public.vip_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.vip_posts(id) ON DELETE CASCADE,
  share_type TEXT CHECK (share_type IN ('internal', 'external', 'whatsapp', 'twitter', 'facebook')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_vip_posts_author ON public.vip_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_vip_posts_media_type ON public.vip_posts(media_type);
CREATE INDEX IF NOT EXISTS idx_vip_posts_created ON public.vip_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vip_posts_hashtags ON public.vip_posts USING GIN(hashtags);
CREATE INDEX IF NOT EXISTS idx_vip_follows_follower ON public.vip_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_vip_follows_following ON public.vip_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_vip_comments_post ON public.vip_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_vip_reactions_post ON public.vip_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_vip_live_chat_post ON public.vip_live_chat(post_id, created_at);

-- ========================================
-- RLS POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.vip_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_live_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_shares ENABLE ROW LEVEL SECURITY;

-- Follows policies
CREATE POLICY "Anyone can view follows" ON public.vip_follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON public.vip_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.vip_follows FOR DELETE USING (auth.uid() = follower_id);

-- Posts policies
CREATE POLICY "Anyone can view posts" ON public.vip_posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON public.vip_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own posts" ON public.vip_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own posts" ON public.vip_posts FOR DELETE USING (auth.uid() = author_id);

-- Reactions policies
CREATE POLICY "Anyone can view reactions" ON public.vip_reactions FOR SELECT USING (true);
CREATE POLICY "Users can add reactions" ON public.vip_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions" ON public.vip_reactions FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Anyone can view comments" ON public.vip_comments FOR SELECT USING (true);
CREATE POLICY "Users can add comments" ON public.vip_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own comments" ON public.vip_comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own comments" ON public.vip_comments FOR DELETE USING (auth.uid() = author_id);

-- Bookmarks policies
CREATE POLICY "Users can view own bookmarks" ON public.vip_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add bookmarks" ON public.vip_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove bookmarks" ON public.vip_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Playlists policies
CREATE POLICY "Anyone can view public playlists" ON public.vip_playlists FOR SELECT USING (is_public = true OR auth.uid() = owner_id);
CREATE POLICY "Users can create playlists" ON public.vip_playlists FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own playlists" ON public.vip_playlists FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own playlists" ON public.vip_playlists FOR DELETE USING (auth.uid() = owner_id);

-- Playlist items policies
CREATE POLICY "Anyone can view playlist items" ON public.vip_playlist_items FOR SELECT USING (true);
CREATE POLICY "Playlist owners can add items" ON public.vip_playlist_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.vip_playlists WHERE id = playlist_id AND owner_id = auth.uid())
);
CREATE POLICY "Playlist owners can remove items" ON public.vip_playlist_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.vip_playlists WHERE id = playlist_id AND owner_id = auth.uid())
);

-- Live chat policies
CREATE POLICY "Anyone can view live chat" ON public.vip_live_chat FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can send chat messages" ON public.vip_live_chat FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete own messages" ON public.vip_live_chat FOR UPDATE USING (auth.uid() = author_id OR auth.uid() = deleted_by);

-- Shares policies
CREATE POLICY "Users can view own shares" ON public.vip_shares FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create shares" ON public.vip_shares FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========================================
-- ENABLE REALTIME
-- ========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.vip_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vip_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vip_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vip_live_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vip_follows;