-- Remove public read policy from ai_learnings (Edge Function uses service role, doesn't need public access)
DROP POLICY IF EXISTS "Anyone can read active learnings" ON public.ai_learnings;

-- Only admins can view learnings now
CREATE POLICY "Admins can view all learnings" 
ON public.ai_learnings 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));