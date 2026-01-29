-- Add team_earnings column to vip_affiliates for MLM tracking
ALTER TABLE public.vip_affiliates 
ADD COLUMN IF NOT EXISTS team_earnings numeric DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.vip_affiliates.team_earnings IS 'Total earnings from MLM network (downline commissions)';