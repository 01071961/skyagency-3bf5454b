-- 1. Adicionar 'platinum' ao ENUM affiliate_tier
ALTER TYPE affiliate_tier ADD VALUE IF NOT EXISTS 'platinum' AFTER 'gold';

-- 2. Adicionar campos de volume e qualificação em vip_affiliates
ALTER TABLE vip_affiliates 
  ADD COLUMN IF NOT EXISTS personal_volume DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS group_volume DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qualified_referrals_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_qualification_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS qualification_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tier_package_id UUID;

-- 3. Criar tabela de configuração de tiers (admin editável)
CREATE TABLE IF NOT EXISTS affiliate_tier_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT UNIQUE NOT NULL,
  tier_order INTEGER NOT NULL DEFAULT 0,
  min_pv DECIMAL NOT NULL DEFAULT 0,
  min_gv DECIMAL DEFAULT 0,
  min_referrals INTEGER DEFAULT 0,
  min_qualified_referrals INTEGER DEFAULT 0,
  commission_rate DECIMAL NOT NULL DEFAULT 10,
  package_price DECIMAL,
  package_stripe_price_id TEXT,
  can_sell_products BOOLEAN DEFAULT false,
  min_points INTEGER DEFAULT 0,
  max_points INTEGER DEFAULT 999999,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Inserir configuração dos 5 tiers
INSERT INTO affiliate_tier_config (tier, tier_order, min_pv, min_gv, min_referrals, min_qualified_referrals, commission_rate, package_price, can_sell_products, min_points, max_points) VALUES
  ('bronze', 0, 300, 0, 0, 0, 12.5, 900, false, 0, 499),
  ('silver', 1, 1200, 6000, 3, 3, 20, 2700, false, 500, 1999),
  ('gold', 2, 3000, 30000, 8, 3, 27.5, 10500, true, 2000, 4999),
  ('platinum', 3, 6000, 120000, 14, 4, 37.5, 52500, true, 5000, 9999),
  ('diamond', 4, 15000, 600000, 33, 6, 47.5, 210000, true, 10000, 999999)
ON CONFLICT (tier) DO UPDATE SET
  tier_order = EXCLUDED.tier_order,
  min_pv = EXCLUDED.min_pv,
  min_gv = EXCLUDED.min_gv,
  min_referrals = EXCLUDED.min_referrals,
  min_qualified_referrals = EXCLUDED.min_qualified_referrals,
  commission_rate = EXCLUDED.commission_rate,
  package_price = EXCLUDED.package_price,
  can_sell_products = EXCLUDED.can_sell_products,
  min_points = EXCLUDED.min_points,
  max_points = EXCLUDED.max_points,
  updated_at = now();

-- 5. Habilitar RLS
ALTER TABLE affiliate_tier_config ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS
DROP POLICY IF EXISTS "Tier config is viewable" ON affiliate_tier_config;
CREATE POLICY "Tier config is viewable" ON affiliate_tier_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage tier config" ON affiliate_tier_config;
CREATE POLICY "Admins can manage tier config" ON affiliate_tier_config FOR ALL USING (has_role(auth.uid(), 'admin'));