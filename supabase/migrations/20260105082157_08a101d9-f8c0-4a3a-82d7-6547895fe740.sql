-- Drop existing policies
DROP POLICY IF EXISTS "Affiliates can create posts" ON public.affiliate_posts;
DROP POLICY IF EXISTS "Affiliates can view all posts" ON public.affiliate_posts;
DROP POLICY IF EXISTS "Authors can update their posts" ON public.affiliate_posts;
DROP POLICY IF EXISTS "Authors can delete their posts" ON public.affiliate_posts;

-- Create corrected policies using 'approved' status
CREATE POLICY "Affiliates can create posts" ON public.affiliate_posts
FOR INSERT WITH CHECK (
  author_id IN (
    SELECT id FROM vip_affiliates 
    WHERE user_id = auth.uid() AND status = 'approved'
  )
);

CREATE POLICY "Affiliates can view all posts" ON public.affiliate_posts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM vip_affiliates 
    WHERE user_id = auth.uid() AND status = 'approved'
  )
);

CREATE POLICY "Authors can update their posts" ON public.affiliate_posts
FOR UPDATE USING (
  author_id IN (
    SELECT id FROM vip_affiliates WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Authors can delete their posts" ON public.affiliate_posts
FOR DELETE USING (
  author_id IN (
    SELECT id FROM vip_affiliates WHERE user_id = auth.uid()
  )
);