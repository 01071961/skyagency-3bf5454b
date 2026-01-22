
-- Função para recalcular e corrigir vínculos MLM baseado em referrals existentes
CREATE OR REPLACE FUNCTION public.fix_mlm_parent_links()
RETURNS TABLE(updated_count int, details jsonb) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated_count int := 0;
  v_details jsonb := '[]'::jsonb;
  v_ref record;
  v_referrer_id uuid;
  v_referred_affiliate_id uuid;
BEGIN
  -- Para cada referral, encontrar o afiliado referido e atualizar parent_affiliate_id
  FOR v_ref IN 
    SELECT 
      ar.id as referral_id,
      ar.referrer_id,
      ar.referred_email,
      ar.referred_user_id
    FROM affiliate_referrals ar
    WHERE ar.status IN ('converted', 'pending')
  LOOP
    -- Encontrar afiliado do referido pelo email ou user_id
    SELECT va.id INTO v_referred_affiliate_id
    FROM vip_affiliates va
    JOIN profiles p ON p.user_id = va.user_id
    WHERE p.email = v_ref.referred_email 
       OR va.user_id = v_ref.referred_user_id
    LIMIT 1;
    
    -- Se encontrou afiliado referido, atualizar parent_affiliate_id
    IF v_referred_affiliate_id IS NOT NULL THEN
      UPDATE vip_affiliates
      SET parent_affiliate_id = v_ref.referrer_id
      WHERE id = v_referred_affiliate_id
        AND (parent_affiliate_id IS NULL OR parent_affiliate_id != v_ref.referrer_id);
      
      IF FOUND THEN
        v_updated_count := v_updated_count + 1;
        v_details := v_details || jsonb_build_object(
          'referrer_id', v_ref.referrer_id,
          'referred_affiliate_id', v_referred_affiliate_id,
          'referred_email', v_ref.referred_email
        );
      END IF;
    END IF;
  END LOOP;
  
  -- Recalcular contagem de referidos diretos
  UPDATE vip_affiliates va
  SET direct_referrals_count = (
    SELECT COUNT(*) 
    FROM vip_affiliates child 
    WHERE child.parent_affiliate_id = va.id
  );
  
  RETURN QUERY SELECT v_updated_count, v_details;
END;
$$;

-- Criar tabela para configurações de tier (mais rigorosos)
CREATE TABLE IF NOT EXISTS public.tier_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text NOT NULL UNIQUE,
  min_referrals int NOT NULL DEFAULT 0,
  min_sales_total numeric NOT NULL DEFAULT 0,
  min_points int NOT NULL DEFAULT 0,
  commission_rate numeric NOT NULL DEFAULT 10,
  benefits jsonb DEFAULT '[]'::jsonb,
  icon text DEFAULT '🥉',
  color text DEFAULT 'amber',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.tier_requirements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view tier requirements"
  ON public.tier_requirements FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage tier requirements"
  ON public.tier_requirements FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Inserir requisitos de tier MAIS RIGOROSOS
INSERT INTO public.tier_requirements (tier, min_referrals, min_sales_total, min_points, commission_rate, icon, color, sort_order, benefits)
VALUES
  ('bronze', 0, 0, 0, 10, '🥉', 'amber', 0, '["Acesso básico", "Link de afiliado"]'::jsonb),
  ('silver', 5, 500, 1000, 12, '🥈', 'slate', 1, '["Materiais exclusivos", "Suporte prioritário", "Acesso a treinamentos"]'::jsonb),
  ('gold', 15, 2000, 5000, 15, '🥇', 'yellow', 2, '["Modo Creator gratuito", "Comissão aumentada", "Acesso a mentorias"]'::jsonb),
  ('diamond', 50, 10000, 20000, 20, '💎', 'cyan', 3, '["Bônus MLM 5%", "Eventos exclusivos", "Conta verificada"]'::jsonb),
  ('platinum', 100, 50000, 50000, 25, '👑', 'violet', 4, '["Bônus MLM 10%", "Parceria oficial", "Acesso total", "Suporte VIP dedicado"]'::jsonb)
ON CONFLICT (tier) DO UPDATE SET
  min_referrals = EXCLUDED.min_referrals,
  min_sales_total = EXCLUDED.min_sales_total,
  min_points = EXCLUDED.min_points,
  commission_rate = EXCLUDED.commission_rate,
  benefits = EXCLUDED.benefits,
  updated_at = now();

-- Função para calcular tier baseado nos novos requisitos
CREATE OR REPLACE FUNCTION public.calculate_affiliate_tier(
  p_referrals int,
  p_sales_total numeric,
  p_points int
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier text := 'bronze';
  v_req record;
BEGIN
  FOR v_req IN 
    SELECT tier, min_referrals, min_sales_total, min_points
    FROM tier_requirements
    ORDER BY sort_order DESC
  LOOP
    IF p_referrals >= v_req.min_referrals 
       AND p_sales_total >= v_req.min_sales_total 
       AND p_points >= v_req.min_points THEN
      v_tier := v_req.tier;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_tier;
END;
$$;

-- Função para recalcular tier de um afiliado
CREATE OR REPLACE FUNCTION public.recalculate_affiliate_tier(p_affiliate_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_tier text;
  v_referrals int;
  v_sales_total numeric;
  v_points int;
  v_user_id uuid;
BEGIN
  -- Buscar dados do afiliado
  SELECT 
    va.user_id,
    va.direct_referrals_count,
    va.total_earnings
  INTO v_user_id, v_referrals, v_sales_total
  FROM vip_affiliates va
  WHERE va.id = p_affiliate_id;
  
  IF v_user_id IS NULL THEN
    RETURN 'bronze';
  END IF;
  
  -- Buscar pontos do usuário
  SELECT COALESCE(total_earned, 0) INTO v_points
  FROM user_points
  WHERE user_id = v_user_id;
  
  IF v_points IS NULL THEN
    v_points := 0;
  END IF;
  
  -- Calcular novo tier
  v_new_tier := calculate_affiliate_tier(v_referrals, v_sales_total, v_points);
  
  -- Atualizar tier do afiliado
  UPDATE vip_affiliates
  SET tier = v_new_tier, updated_at = now()
  WHERE id = p_affiliate_id;
  
  -- Atualizar tier nos pontos do usuário também
  UPDATE user_points
  SET tier = v_new_tier, updated_at = now()
  WHERE user_id = v_user_id;
  
  RETURN v_new_tier;
END;
$$;

-- Recalcular todos os tiers
DO $$
DECLARE
  v_aff record;
BEGIN
  FOR v_aff IN SELECT id FROM vip_affiliates LOOP
    PERFORM recalculate_affiliate_tier(v_aff.id);
  END LOOP;
END;
$$;
