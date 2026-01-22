-- ============================================
-- Fase 1: Corrigir Sistema MLM
-- ============================================

-- Criar tabela de configurações de comissão se não existir
CREATE TABLE IF NOT EXISTS public.commission_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_type TEXT NOT NULL UNIQUE, -- 'platform', 'creator', 'certification', 'mlm'
  platform_rate NUMERIC DEFAULT 20,
  creator_rate NUMERIC DEFAULT 60,
  affiliate_rate NUMERIC DEFAULT 10,
  mlm_level1_rate NUMERIC DEFAULT 5,
  mlm_level2_rate NUMERIC DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commission_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage commission settings
CREATE POLICY "Admins can manage commission settings"
ON public.commission_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Policy: Anyone can read commission settings
CREATE POLICY "Anyone can read commission settings"
ON public.commission_settings
FOR SELECT
TO authenticated
USING (true);

-- Insert default commission settings
INSERT INTO public.commission_settings (setting_type, platform_rate, creator_rate, affiliate_rate, mlm_level1_rate, mlm_level2_rate)
VALUES 
  ('platform', 85, 0, 10, 3, 2),           -- Produtos SKY: 85% Sky, 10% afiliado, 3% L1, 2% L2
  ('creator', 15, 65, 10, 5, 5),           -- Produtos Creator: 15% Sky, 65% Creator, 10% afiliado, 5% L1, 5% L2
  ('certification', 30, 50, 15, 3, 2)      -- Certificações: 30% Sky, 50% conteúdo, 15% afiliado, 3% L1, 2% L2
ON CONFLICT (setting_type) DO NOTHING;

-- ============================================
-- Função para vincular referrals a parent_affiliate_id
-- ============================================
CREATE OR REPLACE FUNCTION public.link_referrals_to_affiliates()
RETURNS TABLE(linked_count INTEGER, details JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_linked_count INT := 0;
  v_details JSONB := '[]'::JSONB;
  v_ref RECORD;
  v_referred_affiliate_id UUID;
  v_referrer_affiliate_id UUID;
  v_referred_email TEXT;
BEGIN
  -- Para cada referral pendente ou convertido
  FOR v_ref IN 
    SELECT 
      ar.id AS referral_id,
      ar.referrer_id,
      ar.referred_email,
      ar.referred_user_id,
      ar.status
    FROM affiliate_referrals ar
    WHERE ar.status IN ('pending', 'converted')
  LOOP
    -- Buscar o email do referido
    v_referred_email := v_ref.referred_email;
    
    -- Se não tem email, tentar pelo user_id
    IF v_referred_email IS NULL AND v_ref.referred_user_id IS NOT NULL THEN
      SELECT p.email INTO v_referred_email
      FROM profiles p
      WHERE p.user_id = v_ref.referred_user_id;
    END IF;
    
    -- Buscar o afiliado VIP do referido
    SELECT va.id INTO v_referred_affiliate_id
    FROM vip_affiliates va
    JOIN profiles p ON p.user_id = va.user_id
    WHERE p.email = v_referred_email
       OR va.user_id = v_ref.referred_user_id
    LIMIT 1;
    
    -- Se encontrou afiliado referido, atualizar parent_affiliate_id
    IF v_referred_affiliate_id IS NOT NULL THEN
      UPDATE vip_affiliates
      SET parent_affiliate_id = v_ref.referrer_id,
          updated_at = now()
      WHERE id = v_referred_affiliate_id
        AND (parent_affiliate_id IS NULL OR parent_affiliate_id != v_ref.referrer_id);
      
      IF FOUND THEN
        v_linked_count := v_linked_count + 1;
        v_details := v_details || jsonb_build_object(
          'referrer_id', v_ref.referrer_id,
          'referred_affiliate_id', v_referred_affiliate_id,
          'referred_email', v_referred_email
        );
      END IF;
    END IF;
  END LOOP;
  
  -- Recalcular direct_referrals_count para TODOS afiliados
  UPDATE vip_affiliates va
  SET direct_referrals_count = (
    SELECT COUNT(*) 
    FROM vip_affiliates child 
    WHERE child.parent_affiliate_id = va.id
  ),
  updated_at = now();
  
  RETURN QUERY SELECT v_linked_count, v_details;
END;
$$;

-- ============================================
-- Trigger: Auto-vincular parent quando novo afiliado é criado
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_link_affiliate_parent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_email TEXT;
  v_referral RECORD;
  v_referrer_id UUID;
BEGIN
  -- Buscar email do usuário
  SELECT p.email INTO v_user_email
  FROM profiles p
  WHERE p.user_id = NEW.user_id;
  
  -- Buscar referral para este email ou user_id
  SELECT ar.referrer_id INTO v_referrer_id
  FROM affiliate_referrals ar
  WHERE (ar.referred_email = v_user_email OR ar.referred_user_id = NEW.user_id)
    AND ar.status IN ('pending', 'converted')
  ORDER BY ar.created_at DESC
  LIMIT 1;
  
  -- Se encontrou referral, vincular parent
  IF v_referrer_id IS NOT NULL THEN
    NEW.parent_affiliate_id := v_referrer_id;
    
    -- Incrementar direct_referrals_count do parent
    UPDATE vip_affiliates
    SET direct_referrals_count = COALESCE(direct_referrals_count, 0) + 1,
        updated_at = now()
    WHERE id = v_referrer_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_auto_link_affiliate_parent ON vip_affiliates;
CREATE TRIGGER trigger_auto_link_affiliate_parent
  BEFORE INSERT ON vip_affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_affiliate_parent();

-- ============================================
-- Função para processar comissões MLM completas
-- ============================================
CREATE OR REPLACE FUNCTION public.process_full_mlm_commissions(
  p_order_id UUID,
  p_order_total NUMERIC,
  p_affiliate_id UUID,
  p_is_creator_product BOOLEAN DEFAULT false,
  p_creator_id UUID DEFAULT NULL,
  p_is_certification BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_settings RECORD;
  v_setting_type TEXT;
  v_affiliate RECORD;
  v_upline1 RECORD;
  v_upline2 RECORD;
  v_net_amount NUMERIC;
  v_platform_amount NUMERIC;
  v_creator_amount NUMERIC;
  v_affiliate_amount NUMERIC;
  v_level1_amount NUMERIC;
  v_level2_amount NUMERIC;
  v_result JSONB := '{}'::JSONB;
  v_referral_id UUID;
BEGIN
  -- Determinar tipo de configuração
  IF p_is_certification THEN
    v_setting_type := 'certification';
  ELSIF p_is_creator_product THEN
    v_setting_type := 'creator';
  ELSE
    v_setting_type := 'platform';
  END IF;
  
  -- Buscar configurações de comissão
  SELECT * INTO v_settings
  FROM commission_settings
  WHERE setting_type = v_setting_type AND is_active = true;
  
  IF NOT FOUND THEN
    -- Usar valores padrão
    v_settings := ROW(
      NULL, v_setting_type, 
      CASE v_setting_type 
        WHEN 'platform' THEN 85 
        WHEN 'creator' THEN 15 
        ELSE 30 
      END,
      CASE v_setting_type 
        WHEN 'creator' THEN 65 
        ELSE 0 
      END,
      CASE v_setting_type 
        WHEN 'certification' THEN 15 
        ELSE 10 
      END,
      5, 5, true, now(), now()
    );
  END IF;
  
  -- Calcular valores
  v_platform_amount := p_order_total * (v_settings.platform_rate / 100);
  v_creator_amount := CASE WHEN p_is_creator_product OR p_is_certification THEN p_order_total * (v_settings.creator_rate / 100) ELSE 0 END;
  v_affiliate_amount := p_order_total * (v_settings.affiliate_rate / 100);
  v_level1_amount := p_order_total * (v_settings.mlm_level1_rate / 100);
  v_level2_amount := p_order_total * (v_settings.mlm_level2_rate / 100);
  
  -- Registrar comissão da plataforma
  INSERT INTO platform_commissions (order_id, order_total, commission_rate, commission_amount, affiliate_id)
  VALUES (p_order_id, p_order_total, v_settings.platform_rate, v_platform_amount, p_affiliate_id)
  ON CONFLICT DO NOTHING;
  
  -- Registrar comissão do Creator (se aplicável)
  IF p_creator_id IS NOT NULL AND (p_is_creator_product OR p_is_certification) THEN
    INSERT INTO creator_payouts (creator_id, order_id, gross_amount, platform_amount, creator_amount, status)
    VALUES (p_creator_id, p_order_id, p_order_total, v_platform_amount, v_creator_amount, 'pending')
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Buscar dados do afiliado vendedor
  IF p_affiliate_id IS NOT NULL THEN
    SELECT * INTO v_affiliate FROM vip_affiliates WHERE id = p_affiliate_id AND status = 'approved';
    
    IF FOUND THEN
      -- Buscar referral relacionado
      SELECT id INTO v_referral_id
      FROM affiliate_referrals
      WHERE referrer_id = p_affiliate_id AND order_id = p_order_id
      LIMIT 1;
      
      -- Registrar comissão do afiliado vendedor (Nível 0)
      INSERT INTO affiliate_commissions (
        affiliate_id, order_id, referral_id, order_total, 
        commission_rate, commission_amount, status, commission_level, commission_type
      ) VALUES (
        p_affiliate_id, p_order_id, v_referral_id, p_order_total,
        v_settings.affiliate_rate, v_affiliate_amount, 'pending', 0, 'direct'
      )
      ON CONFLICT DO NOTHING;
      
      -- Atualizar earnings do afiliado
      UPDATE vip_affiliates
      SET total_earnings = total_earnings + v_affiliate_amount,
          updated_at = now()
      WHERE id = p_affiliate_id;
      
      -- Processar Upline Nível 1
      IF v_affiliate.parent_affiliate_id IS NOT NULL THEN
        SELECT * INTO v_upline1 FROM vip_affiliates WHERE id = v_affiliate.parent_affiliate_id AND status = 'approved';
        
        IF FOUND THEN
          INSERT INTO affiliate_commissions (
            affiliate_id, order_id, referral_id, order_total,
            commission_rate, commission_amount, status, commission_level, commission_type
          ) VALUES (
            v_upline1.id, p_order_id, v_referral_id, p_order_total,
            v_settings.mlm_level1_rate, v_level1_amount, 'pending', 1, 'mlm_level1'
          )
          ON CONFLICT DO NOTHING;
          
          -- Atualizar team_earnings
          UPDATE vip_affiliates
          SET team_earnings = team_earnings + v_level1_amount,
              updated_at = now()
          WHERE id = v_upline1.id;
          
          -- Processar Upline Nível 2
          IF v_upline1.parent_affiliate_id IS NOT NULL THEN
            SELECT * INTO v_upline2 FROM vip_affiliates WHERE id = v_upline1.parent_affiliate_id AND status = 'approved';
            
            IF FOUND THEN
              INSERT INTO affiliate_commissions (
                affiliate_id, order_id, referral_id, order_total,
                commission_rate, commission_amount, status, commission_level, commission_type
              ) VALUES (
                v_upline2.id, p_order_id, v_referral_id, p_order_total,
                v_settings.mlm_level2_rate, v_level2_amount, 'pending', 2, 'mlm_level2'
              )
              ON CONFLICT DO NOTHING;
              
              -- Atualizar team_earnings
              UPDATE vip_affiliates
              SET team_earnings = team_earnings + v_level2_amount,
                  updated_at = now()
              WHERE id = v_upline2.id;
            END IF;
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;
  
  -- Montar resultado
  v_result := jsonb_build_object(
    'order_id', p_order_id,
    'order_total', p_order_total,
    'setting_type', v_setting_type,
    'platform_amount', v_platform_amount,
    'creator_amount', v_creator_amount,
    'affiliate_amount', v_affiliate_amount,
    'level1_amount', v_level1_amount,
    'level2_amount', v_level2_amount,
    'affiliate_id', p_affiliate_id,
    'upline1_id', v_upline1.id,
    'upline2_id', v_upline2.id
  );
  
  RETURN v_result;
END;
$$;

-- ============================================
-- Executar correção dos dados existentes
-- ============================================
SELECT * FROM public.link_referrals_to_affiliates();