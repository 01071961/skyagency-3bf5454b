-- Add Stripe Connect fields to vip_affiliates
ALTER TABLE public.vip_affiliates 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_account_status TEXT DEFAULT 'not_configured';

-- Add admin approval fields to withdrawals
ALTER TABLE public.withdrawals 
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_reason TEXT,
ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES public.vip_affiliates(id),
ADD COLUMN IF NOT EXISTS stripe_payout_id TEXT,
ADD COLUMN IF NOT EXISTS affiliate_name TEXT,
ADD COLUMN IF NOT EXISTS affiliate_email TEXT;

-- Update RLS policies for withdrawals to allow admin access
DROP POLICY IF EXISTS "Admins can manage withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Users can create withdrawals" ON public.withdrawals;

-- Admins can manage all withdrawals
CREATE POLICY "Admins can manage withdrawals" 
ON public.withdrawals 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own withdrawals
CREATE POLICY "Users can view own withdrawals"
ON public.withdrawals
FOR SELECT
USING (requested_by = auth.uid());

-- Users can create withdrawal requests
CREATE POLICY "Users can create withdrawals"
ON public.withdrawals
FOR INSERT
WITH CHECK (requested_by = auth.uid());

-- Create index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_affiliate_id ON public.withdrawals(affiliate_id);