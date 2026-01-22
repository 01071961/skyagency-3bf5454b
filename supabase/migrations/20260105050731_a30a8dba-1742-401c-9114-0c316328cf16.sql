-- Create affiliate posts table for blog/forum
CREATE TABLE public.affiliate_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.vip_affiliates(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'geral',
    image_url TEXT,
    is_pinned BOOLEAN DEFAULT false,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create affiliate post comments table
CREATE TABLE public.affiliate_post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.affiliate_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.vip_affiliates(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create affiliate post likes table
CREATE TABLE public.affiliate_post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.affiliate_posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.affiliate_post_comments(id) ON DELETE CASCADE,
    affiliate_id UUID NOT NULL REFERENCES public.vip_affiliates(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT like_target_check CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR 
        (post_id IS NULL AND comment_id IS NOT NULL)
    ),
    CONSTRAINT unique_post_like UNIQUE (post_id, affiliate_id),
    CONSTRAINT unique_comment_like UNIQUE (comment_id, affiliate_id)
);

-- Create affiliate follows table for network connections
CREATE TABLE public.affiliate_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES public.vip_affiliates(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.vip_affiliates(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id),
    CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

-- Add followers/following count to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE public.affiliate_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for affiliate_posts
CREATE POLICY "Affiliates can view all posts" ON public.affiliate_posts
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.vip_affiliates WHERE user_id = auth.uid() AND status = 'active')
    );

CREATE POLICY "Affiliates can create posts" ON public.affiliate_posts
    FOR INSERT TO authenticated
    WITH CHECK (
        author_id IN (SELECT id FROM public.vip_affiliates WHERE user_id = auth.uid() AND status = 'active')
    );

CREATE POLICY "Authors can update their posts" ON public.affiliate_posts
    FOR UPDATE TO authenticated
    USING (
        author_id IN (SELECT id FROM public.vip_affiliates WHERE user_id = auth.uid())
    );

CREATE POLICY "Authors can delete their posts" ON public.affiliate_posts
    FOR DELETE TO authenticated
    USING (
        author_id IN (SELECT id FROM public.vip_affiliates WHERE user_id = auth.uid())
    );

-- RLS Policies for comments
CREATE POLICY "Affiliates can view all comments" ON public.affiliate_post_comments
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.vip_affiliates WHERE user_id = auth.uid() AND status = 'active')
    );

CREATE POLICY "Affiliates can create comments" ON public.affiliate_post_comments
    FOR INSERT TO authenticated
    WITH CHECK (
        author_id IN (SELECT id FROM public.vip_affiliates WHERE user_id = auth.uid() AND status = 'active')
    );

CREATE POLICY "Authors can delete their comments" ON public.affiliate_post_comments
    FOR DELETE TO authenticated
    USING (
        author_id IN (SELECT id FROM public.vip_affiliates WHERE user_id = auth.uid())
    );

-- RLS Policies for likes
CREATE POLICY "Affiliates can view all likes" ON public.affiliate_post_likes
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.vip_affiliates WHERE user_id = auth.uid() AND status = 'active')
    );

CREATE POLICY "Affiliates can like" ON public.affiliate_post_likes
    FOR INSERT TO authenticated
    WITH CHECK (
        affiliate_id IN (SELECT id FROM public.vip_affiliates WHERE user_id = auth.uid() AND status = 'active')
    );

CREATE POLICY "Affiliates can unlike" ON public.affiliate_post_likes
    FOR DELETE TO authenticated
    USING (
        affiliate_id IN (SELECT id FROM public.vip_affiliates WHERE user_id = auth.uid())
    );

-- RLS Policies for follows
CREATE POLICY "Affiliates can view all follows" ON public.affiliate_follows
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.vip_affiliates WHERE user_id = auth.uid() AND status = 'active')
    );

CREATE POLICY "Affiliates can follow" ON public.affiliate_follows
    FOR INSERT TO authenticated
    WITH CHECK (
        follower_id IN (SELECT id FROM public.vip_affiliates WHERE user_id = auth.uid() AND status = 'active')
    );

CREATE POLICY "Affiliates can unfollow" ON public.affiliate_follows
    FOR DELETE TO authenticated
    USING (
        follower_id IN (SELECT id FROM public.vip_affiliates WHERE user_id = auth.uid())
    );

-- Enable realtime for posts and comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_post_comments;