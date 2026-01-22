-- Fix affiliate_follows RLS policies - was checking for 'active' but affiliates have 'approved'

-- Drop existing policies
DROP POLICY IF EXISTS "Affiliates can follow" ON public.affiliate_follows;
DROP POLICY IF EXISTS "Affiliates can unfollow" ON public.affiliate_follows;
DROP POLICY IF EXISTS "Affiliates can view all follows" ON public.affiliate_follows;

-- Create corrected policies checking for 'approved' status
CREATE POLICY "Affiliates can follow" 
ON public.affiliate_follows 
FOR INSERT 
WITH CHECK (
  follower_id IN (
    SELECT id FROM public.vip_affiliates 
    WHERE user_id = auth.uid() AND status = 'approved'
  )
);

CREATE POLICY "Affiliates can unfollow" 
ON public.affiliate_follows 
FOR DELETE 
USING (
  follower_id IN (
    SELECT id FROM public.vip_affiliates 
    WHERE user_id = auth.uid() AND status = 'approved'
  )
);

CREATE POLICY "Affiliates can view all follows" 
ON public.affiliate_follows 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.vip_affiliates 
    WHERE user_id = auth.uid() AND status = 'approved'
  )
);