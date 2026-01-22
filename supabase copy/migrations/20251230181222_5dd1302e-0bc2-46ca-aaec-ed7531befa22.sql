-- Add upline (parent) tracking to vip_affiliates for MLM structure
ALTER TABLE public.vip_affiliates 
ADD COLUMN IF NOT EXISTS parent_affiliate_id UUID REFERENCES public.vip_affiliates(id),
ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS direct_referrals_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS team_earnings NUMERIC DEFAULT 0;

-- Add commission level tracking to affiliate_commissions
ALTER TABLE public.affiliate_commissions 
ADD COLUMN IF NOT EXISTS commission_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_type TEXT DEFAULT 'direct' CHECK (commission_type IN ('direct', 'mlm_level1', 'mlm_level2', 'platform'));

-- Create platform_commissions table for SKY earnings
CREATE TABLE IF NOT EXISTS public.platform_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id),
  order_total NUMERIC NOT NULL,
  commission_rate NUMERIC NOT NULL,
  commission_amount NUMERIC NOT NULL,
  affiliate_id UUID REFERENCES public.vip_affiliates(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on platform_commissions
ALTER TABLE public.platform_commissions ENABLE ROW LEVEL SECURITY;

-- Only admins/owners can view platform commissions
CREATE POLICY "Admins can manage platform commissions"
ON public.platform_commissions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Create function to process MLM commissions
CREATE OR REPLACE FUNCTION public.process_mlm_commissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  referral_record public.affiliate_referrals%ROWTYPE;
  direct_affiliate public.vip_affiliates%ROWTYPE;
  level1_affiliate public.vip_affiliates%ROWTYPE;
  level2_affiliate public.vip_affiliates%ROWTYPE;
  platform_settings JSONB;
  platform_rate NUMERIC := 5;
  mlm_enabled BOOLEAN := true;
  mlm_level1_rate NUMERIC := 5;
  mlm_level2_rate NUMERIC := 2;
  net_amount NUMERIC;
  platform_amount NUMERIC;
BEGIN
  -- Only process when status changes to 'paid'
  IF NEW.status = 'paid' AND (OLD IS NULL OR OLD.status != 'paid') THEN
    
    -- Load platform settings
    SELECT setting_value INTO platform_settings
    FROM public.ai_assistant_settings 
    WHERE setting_key = 'platform_commission_settings';
    
    IF platform_settings IS NOT NULL THEN
      platform_rate := COALESCE((platform_settings->>'platform_commission_rate')::NUMERIC, 5);
      mlm_enabled := COALESCE((platform_settings->>'mlm_enabled')::BOOLEAN, true);
      mlm_level1_rate := COALESCE((platform_settings->>'mlm_level1_rate')::NUMERIC, 5);
      mlm_level2_rate := COALESCE((platform_settings->>'mlm_level2_rate')::NUMERIC, 2);
    END IF;
    
    -- Calculate platform commission (SKY is at the top)
    platform_amount := NEW.total * (platform_rate / 100);
    net_amount := NEW.total - platform_amount;
    
    -- Find referral for this order or user
    SELECT * INTO referral_record 
    FROM public.affiliate_referrals 
    WHERE (order_id = NEW.id OR referred_user_id = NEW.user_id) 
      AND status IN ('pending', 'converted')
    ORDER BY created_at DESC LIMIT 1;
    
    IF FOUND THEN
      -- Get direct affiliate (level 0 - the one who referred the customer)
      SELECT * INTO direct_affiliate 
      FROM public.vip_affiliates 
      WHERE id = referral_record.referrer_id AND status = 'approved';
      
      IF FOUND THEN
        -- Create platform commission record
        INSERT INTO public.platform_commissions (
          order_id, order_total, commission_rate, commission_amount, affiliate_id
        ) VALUES (
          NEW.id, NEW.total, platform_rate, platform_amount, direct_affiliate.id
        );
        
        -- Create direct affiliate commission (Level 0)
        INSERT INTO public.affiliate_commissions (
          affiliate_id, order_id, referral_id, order_total, 
          commission_rate, commission_amount, status, commission_level, commission_type
        ) VALUES (
          direct_affiliate.id, NEW.id, referral_record.id, net_amount,
          direct_affiliate.commission_rate, 
          net_amount * (direct_affiliate.commission_rate / 100),
          'pending', 0, 'direct'
        );
        
        -- Update direct affiliate earnings
        UPDATE public.vip_affiliates
        SET total_earnings = total_earnings + (net_amount * (commission_rate / 100)),
            direct_referrals_count = direct_referrals_count + 1,
            updated_at = now()
        WHERE id = direct_affiliate.id;
        
        -- Update referral status
        UPDATE public.affiliate_referrals 
        SET status = 'converted', converted_at = now(), order_id = NEW.id
        WHERE id = referral_record.id;
        
        -- Process MLM commissions if enabled
        IF mlm_enabled AND direct_affiliate.parent_affiliate_id IS NOT NULL THEN
          -- Get Level 1 upline (parent of direct affiliate)
          SELECT * INTO level1_affiliate 
          FROM public.vip_affiliates 
          WHERE id = direct_affiliate.parent_affiliate_id AND status = 'approved';
          
          IF FOUND THEN
            -- Create Level 1 commission
            INSERT INTO public.affiliate_commissions (
              affiliate_id, order_id, referral_id, order_total, 
              commission_rate, commission_amount, status, commission_level, commission_type
            ) VALUES (
              level1_affiliate.id, NEW.id, referral_record.id, net_amount,
              mlm_level1_rate, 
              net_amount * (mlm_level1_rate / 100),
              'pending', 1, 'mlm_level1'
            );
            
            -- Update Level 1 affiliate team earnings
            UPDATE public.vip_affiliates
            SET team_earnings = team_earnings + (net_amount * (mlm_level1_rate / 100)),
                referral_count = referral_count + 1,
                updated_at = now()
            WHERE id = level1_affiliate.id;
            
            -- Check for Level 2 upline
            IF level1_affiliate.parent_affiliate_id IS NOT NULL THEN
              SELECT * INTO level2_affiliate 
              FROM public.vip_affiliates 
              WHERE id = level1_affiliate.parent_affiliate_id AND status = 'approved';
              
              IF FOUND THEN
                -- Create Level 2 commission
                INSERT INTO public.affiliate_commissions (
                  affiliate_id, order_id, referral_id, order_total, 
                  commission_rate, commission_amount, status, commission_level, commission_type
                ) VALUES (
                  level2_affiliate.id, NEW.id, referral_record.id, net_amount,
                  mlm_level2_rate, 
                  net_amount * (mlm_level2_rate / 100),
                  'pending', 2, 'mlm_level2'
                );
                
                -- Update Level 2 affiliate team earnings
                UPDATE public.vip_affiliates
                SET team_earnings = team_earnings + (net_amount * (mlm_level2_rate / 100)),
                    updated_at = now()
                WHERE id = level2_affiliate.id;
              END IF;
            END IF;
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_process_mlm_commissions ON public.orders;
CREATE TRIGGER trigger_process_mlm_commissions
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.process_mlm_commissions();

-- Function to calculate affiliate tier based on referrals and earnings
CREATE OR REPLACE FUNCTION public.calculate_affiliate_tier(
  p_direct_referrals INTEGER,
  p_total_earnings NUMERIC,
  p_team_earnings NUMERIC
)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  combined_score NUMERIC;
BEGIN
  -- Combined score: referrals * 100 + total_earnings + team_earnings
  combined_score := (p_direct_referrals * 100) + p_total_earnings + p_team_earnings;
  
  IF combined_score >= 50000 OR p_direct_referrals >= 100 THEN
    RETURN 'platinum';
  ELSIF combined_score >= 20000 OR p_direct_referrals >= 50 THEN
    RETURN 'diamond';
  ELSIF combined_score >= 10000 OR p_direct_referrals >= 25 THEN
    RETURN 'gold';
  ELSIF combined_score >= 3000 OR p_direct_referrals >= 10 THEN
    RETURN 'silver';
  ELSE
    RETURN 'bronze';
  END IF;
END;
$$;

-- Function to get tier commission rate
CREATE OR REPLACE FUNCTION public.get_tier_commission_rate(p_tier TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  CASE p_tier
    WHEN 'platinum' THEN RETURN 30;
    WHEN 'diamond' THEN RETURN 25;
    WHEN 'gold' THEN RETURN 20;
    WHEN 'silver' THEN RETURN 15;
    ELSE RETURN 10; -- bronze
  END CASE;
END;
$$;

-- Trigger to auto-update tier and commission rate
CREATE OR REPLACE FUNCTION public.auto_update_affiliate_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_tier TEXT;
  new_rate NUMERIC;
BEGIN
  new_tier := public.calculate_affiliate_tier(
    NEW.direct_referrals_count,
    NEW.total_earnings,
    NEW.team_earnings
  );
  
  IF new_tier != OLD.tier THEN
    new_rate := public.get_tier_commission_rate(new_tier);
    NEW.tier := new_tier;
    NEW.commission_rate := new_rate;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_update_tier ON public.vip_affiliates;
CREATE TRIGGER trigger_auto_update_tier
  BEFORE UPDATE ON public.vip_affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_update_affiliate_tier();