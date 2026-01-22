-- Tabela de ações de afiliados VIP (histórico de pontuação)
CREATE TABLE IF NOT EXISTS public.vip_affiliate_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_id UUID REFERENCES public.vip_affiliates(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('new_affiliate', 'sale', 'monthly_goal', 'tier_upgrade', 'event', 'share', 'referral_bonus', 'first_sale', 'milestone')),
  points_earned INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de notificações push VIP
CREATE TABLE IF NOT EXISTS public.vip_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('progress', 'achievement', 'ranking', 'reward', 'tier_upgrade', 'sale', 'withdrawal', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  icon TEXT DEFAULT 'bell',
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de metas mensais de afiliados
CREATE TABLE IF NOT EXISTS public.vip_monthly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  target_sales INTEGER DEFAULT 5,
  target_referrals INTEGER DEFAULT 3,
  current_sales INTEGER DEFAULT 0,
  current_referrals INTEGER DEFAULT 0,
  bonus_points INTEGER DEFAULT 50,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month, year)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_vip_affiliate_actions_user ON public.vip_affiliate_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_affiliate_actions_type ON public.vip_affiliate_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_vip_affiliate_actions_created ON public.vip_affiliate_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vip_notifications_user ON public.vip_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_notifications_unread ON public.vip_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_vip_monthly_goals_user ON public.vip_monthly_goals(user_id, year, month);

-- RLS para vip_affiliate_actions
ALTER TABLE public.vip_affiliate_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own actions"
  ON public.vip_affiliate_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert actions"
  ON public.vip_affiliate_actions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage all actions"
  ON public.vip_affiliate_actions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS para vip_notifications
ALTER TABLE public.vip_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.vip_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.vip_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.vip_notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage all notifications"
  ON public.vip_notifications FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS para vip_monthly_goals
ALTER TABLE public.vip_monthly_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
  ON public.vip_monthly_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON public.vip_monthly_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage goals"
  ON public.vip_monthly_goals FOR ALL
  USING (true);

-- Função para registrar ação e dar pontos
CREATE OR REPLACE FUNCTION public.record_vip_action(
  p_user_id UUID,
  p_action_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS INTEGER AS $$
DECLARE
  v_points INTEGER;
  v_affiliate_id UUID;
  v_current_balance INTEGER;
BEGIN
  -- Determinar pontos baseado no tipo de ação
  CASE p_action_type
    WHEN 'new_affiliate' THEN v_points := 10;
    WHEN 'sale' THEN v_points := 20;
    WHEN 'monthly_goal' THEN v_points := 50;
    WHEN 'tier_upgrade' THEN v_points := 100;
    WHEN 'event' THEN v_points := 30;
    WHEN 'share' THEN v_points := 5;
    WHEN 'referral_bonus' THEN v_points := 15;
    WHEN 'first_sale' THEN v_points := 50;
    WHEN 'milestone' THEN v_points := COALESCE((p_metadata->>'bonus_points')::INTEGER, 25);
    ELSE v_points := 5;
  END CASE;

  -- Buscar affiliate_id se existir
  SELECT id INTO v_affiliate_id FROM public.vip_affiliates WHERE user_id = p_user_id LIMIT 1;

  -- Inserir ação
  INSERT INTO public.vip_affiliate_actions (user_id, affiliate_id, action_type, points_earned, description, metadata)
  VALUES (p_user_id, v_affiliate_id, p_action_type, v_points, p_description, p_metadata);

  -- Atualizar pontos do usuário
  INSERT INTO public.user_points (user_id, current_balance, total_earned)
  VALUES (p_user_id, v_points, v_points)
  ON CONFLICT (user_id) DO UPDATE SET
    current_balance = user_points.current_balance + v_points,
    total_earned = user_points.total_earned + v_points,
    tier = public.calculate_user_tier(user_points.total_earned + v_points),
    last_activity = now()
  RETURNING current_balance INTO v_current_balance;

  -- Registrar transação de pontos
  INSERT INTO public.point_transactions (user_id, type, amount, balance_after, description)
  VALUES (p_user_id, 'earn', v_points, v_current_balance, COALESCE(p_description, 'Ação: ' || p_action_type));

  RETURN v_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função para criar notificação VIP
CREATE OR REPLACE FUNCTION public.create_vip_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT 'bell',
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.vip_notifications (user_id, type, title, message, action_url, icon, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_action_url, p_icon, p_metadata)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Habilitar realtime para notificações
ALTER PUBLICATION supabase_realtime ADD TABLE public.vip_notifications;