-- Função para incrementar direct_referrals_count
CREATE OR REPLACE FUNCTION increment_direct_referrals(affiliate_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE vip_affiliates 
  SET 
    direct_referrals_count = COALESCE(direct_referrals_count, 0) + 1,
    referral_count = COALESCE(referral_count, 0) + 1
  WHERE id = affiliate_id;
END;
$$;

-- Função para recalcular todos os contadores de indicações (para correção)
CREATE OR REPLACE FUNCTION recalculate_affiliate_referral_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar direct_referrals_count baseado em parent_affiliate_id
  UPDATE vip_affiliates va
  SET direct_referrals_count = (
    SELECT COUNT(*)
    FROM vip_affiliates child
    WHERE child.parent_affiliate_id = va.id
  );
  
  -- Atualizar referral_count baseado em affiliate_referrals
  UPDATE vip_affiliates va
  SET referral_count = (
    SELECT COUNT(*)
    FROM affiliate_referrals ar
    WHERE ar.referrer_id = va.id
  );
END;
$$;

-- Executar recálculo para corrigir dados existentes
SELECT recalculate_affiliate_referral_counts();