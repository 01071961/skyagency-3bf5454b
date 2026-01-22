-- =============================================
-- FASE 1: Sistema de Afiliados VIP
-- =============================================

-- Tabela principal de afiliados VIP
CREATE TABLE public.vip_affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'diamond')),
  referral_code TEXT UNIQUE NOT NULL,
  commission_rate NUMERIC DEFAULT 10.00,
  total_earnings NUMERIC DEFAULT 0,
  available_balance NUMERIC DEFAULT 0,
  withdrawn_balance NUMERIC DEFAULT 0,
  bank_info JSONB,
  pix_key TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Indicações/Referrals
CREATE TABLE public.affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.vip_affiliates(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id),
  referred_email TEXT,
  order_id UUID REFERENCES public.orders(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'expired', 'cancelled')),
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Comissões de afiliados
CREATE TABLE public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.vip_affiliates(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id),
  referral_id UUID REFERENCES public.affiliate_referrals(id),
  order_total NUMERIC NOT NULL,
  commission_rate NUMERIC NOT NULL,
  commission_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  paid_via TEXT,
  pix_transaction_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- FASE 2: Sistema de Gamificação (Pontos)
-- =============================================

-- Saldo de pontos do usuário
CREATE TABLE public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_balance INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'diamond', 'platinum')),
  last_activity TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Histórico de transações de pontos
CREATE TABLE public.point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id),
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'bonus', 'adjustment', 'referral', 'expiry')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Catálogo de recompensas
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('cash', 'product', 'feature', 'badge', 'discount', 'exclusive')),
  points_required INTEGER NOT NULL,
  cash_value NUMERIC,
  discount_percent NUMERIC,
  product_id UUID REFERENCES public.products(id),
  image_url TEXT,
  stock INTEGER,
  is_active BOOLEAN DEFAULT true,
  tier_required TEXT DEFAULT 'bronze' CHECK (tier_required IN ('bronze', 'silver', 'gold', 'diamond', 'platinum')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Resgates de recompensas
CREATE TABLE public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id),
  points_spent INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'failed')),
  payout_method TEXT,
  payout_details JSONB,
  pix_transaction_id UUID,
  completed_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Badges/conquistas
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_icon TEXT,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_type)
);

-- =============================================
-- FASE 3: Transações PIX Efí
-- =============================================

CREATE TABLE public.pix_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id),
  withdrawal_id UUID REFERENCES public.withdrawals(id),
  redemption_id UUID REFERENCES public.reward_redemptions(id),
  commission_id UUID REFERENCES public.affiliate_commissions(id),
  txid TEXT UNIQUE NOT NULL,
  e2e_id TEXT,
  loc_id TEXT,
  qr_code TEXT,
  qr_code_base64 TEXT,
  valor NUMERIC NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('cobranca', 'envio', 'devolucao')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paid', 'expired', 'cancelled', 'failed')),
  chave_pix TEXT,
  split_config_id TEXT,
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  webhook_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Configurações de Split PIX
-- =============================================

CREATE TABLE public.pix_split_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  efi_split_id TEXT,
  is_active BOOLEAN DEFAULT true,
  splits JSONB NOT NULL DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- RLS Policies
-- =============================================

ALTER TABLE public.vip_affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pix_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pix_split_configs ENABLE ROW LEVEL SECURITY;

-- VIP Affiliates Policies
CREATE POLICY "Users can view own affiliate profile" ON public.vip_affiliates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own affiliate profile" ON public.vip_affiliates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own affiliate profile" ON public.vip_affiliates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all affiliates" ON public.vip_affiliates
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Affiliate Referrals Policies
CREATE POLICY "Affiliates can view own referrals" ON public.affiliate_referrals
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.vip_affiliates va 
    WHERE va.id = referrer_id AND va.user_id = auth.uid()
  ));

CREATE POLICY "Anyone can create referrals" ON public.affiliate_referrals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all referrals" ON public.affiliate_referrals
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Affiliate Commissions Policies
CREATE POLICY "Affiliates can view own commissions" ON public.affiliate_commissions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.vip_affiliates va 
    WHERE va.id = affiliate_id AND va.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all commissions" ON public.affiliate_commissions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User Points Policies
CREATE POLICY "Users can view own points" ON public.user_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all points" ON public.user_points
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Point Transactions Policies
CREATE POLICY "Users can view own transactions" ON public.point_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all transactions" ON public.point_transactions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Rewards Policies (public read)
CREATE POLICY "Anyone can view active rewards" ON public.rewards
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage rewards" ON public.rewards
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Reward Redemptions Policies
CREATE POLICY "Users can view own redemptions" ON public.reward_redemptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own redemptions" ON public.reward_redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all redemptions" ON public.reward_redemptions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User Badges Policies
CREATE POLICY "Users can view own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all badges" ON public.user_badges
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- PIX Transactions Policies
CREATE POLICY "Users can view own PIX transactions" ON public.pix_transactions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.reward_redemptions rr WHERE rr.id = redemption_id AND rr.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all PIX transactions" ON public.pix_transactions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- PIX Split Configs Policies
CREATE POLICY "Admins can manage split configs" ON public.pix_split_configs
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- Triggers para atualização automática
-- =============================================

CREATE TRIGGER update_vip_affiliates_updated_at
  BEFORE UPDATE ON public.vip_affiliates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_points_updated_at
  BEFORE UPDATE ON public.user_points
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at
  BEFORE UPDATE ON public.rewards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pix_transactions_updated_at
  BEFORE UPDATE ON public.pix_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pix_split_configs_updated_at
  BEFORE UPDATE ON public.pix_split_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Função para gerar código de referência único
-- =============================================

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := 'SKY-';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- =============================================
-- Função para calcular tier baseado em pontos
-- =============================================

CREATE OR REPLACE FUNCTION public.calculate_user_tier(total_points INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  IF total_points >= 10000 THEN
    RETURN 'platinum';
  ELSIF total_points >= 5000 THEN
    RETURN 'diamond';
  ELSIF total_points >= 2000 THEN
    RETURN 'gold';
  ELSIF total_points >= 500 THEN
    RETURN 'silver';
  ELSE
    RETURN 'bronze';
  END IF;
END;
$$;

-- =============================================
-- Trigger para atualizar pontos após compra
-- =============================================

CREATE OR REPLACE FUNCTION public.award_points_on_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  points_to_award INTEGER;
  current_user_points public.user_points%ROWTYPE;
  referrer_affiliate public.vip_affiliates%ROWTYPE;
  referral_record public.affiliate_referrals%ROWTYPE;
BEGIN
  -- Only award points when order is paid
  IF NEW.status = 'paid' AND OLD.status != 'paid' AND NEW.user_id IS NOT NULL THEN
    -- Calculate points (1 point per R$1)
    points_to_award := FLOOR(NEW.total);
    
    -- Get or create user points record
    SELECT * INTO current_user_points FROM public.user_points WHERE user_id = NEW.user_id;
    
    IF NOT FOUND THEN
      INSERT INTO public.user_points (user_id, current_balance, total_earned)
      VALUES (NEW.user_id, points_to_award, points_to_award)
      RETURNING * INTO current_user_points;
    ELSE
      UPDATE public.user_points
      SET current_balance = current_balance + points_to_award,
          total_earned = total_earned + points_to_award,
          tier = public.calculate_user_tier(total_earned + points_to_award),
          last_activity = now()
      WHERE user_id = NEW.user_id
      RETURNING * INTO current_user_points;
    END IF;
    
    -- Record the transaction
    INSERT INTO public.point_transactions (user_id, order_id, type, amount, balance_after, description)
    VALUES (NEW.user_id, NEW.id, 'earn', points_to_award, current_user_points.current_balance, 
            'Pontos por compra - Pedido ' || NEW.order_number);
    
    -- Check for referral and award commission
    SELECT * INTO referral_record 
    FROM public.affiliate_referrals 
    WHERE referred_user_id = NEW.user_id AND status = 'pending'
    ORDER BY created_at DESC LIMIT 1;
    
    IF FOUND THEN
      -- Get affiliate info
      SELECT * INTO referrer_affiliate FROM public.vip_affiliates WHERE id = referral_record.referrer_id;
      
      IF FOUND AND referrer_affiliate.status = 'approved' THEN
        -- Create commission record
        INSERT INTO public.affiliate_commissions (
          affiliate_id, order_id, referral_id, order_total, 
          commission_rate, commission_amount, status
        ) VALUES (
          referrer_affiliate.id, NEW.id, referral_record.id, NEW.total,
          referrer_affiliate.commission_rate, 
          NEW.total * (referrer_affiliate.commission_rate / 100),
          'pending'
        );
        
        -- Update referral status
        UPDATE public.affiliate_referrals 
        SET status = 'converted', converted_at = now(), order_id = NEW.id
        WHERE id = referral_record.id;
        
        -- Update affiliate total earnings (will be available after approval)
        UPDATE public.vip_affiliates
        SET total_earnings = total_earnings + (NEW.total * (commission_rate / 100))
        WHERE id = referrer_affiliate.id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER award_points_on_order_paid
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.award_points_on_purchase();

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.pix_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.point_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_commissions;