-- =============================================
-- VIP CREATOR SYSTEM - Permitir VIPs criarem produtos
-- =============================================

-- 1. Adicionar campos para controle de Creator no vip_affiliates
ALTER TABLE public.vip_affiliates 
ADD COLUMN IF NOT EXISTS is_creator boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS creator_enabled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS creator_subscription_id text,
ADD COLUMN IF NOT EXISTS creator_commission_rate numeric DEFAULT 70,
ADD COLUMN IF NOT EXISTS platform_commission_rate numeric DEFAULT 20,
ADD COLUMN IF NOT EXISTS affiliate_commission_rate numeric DEFAULT 10;

-- 2. Adicionar campo creator_id na tabela de produtos para identificar quem criou
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS creator_id uuid REFERENCES public.vip_affiliates(id),
ADD COLUMN IF NOT EXISTS creator_commission_rate numeric DEFAULT 70,
ADD COLUMN IF NOT EXISTS platform_commission_rate numeric DEFAULT 20,
ADD COLUMN IF NOT EXISTS affiliate_commission_rate numeric DEFAULT 10,
ADD COLUMN IF NOT EXISTS is_creator_product boolean DEFAULT false;

-- 3. Criar tabela para gerenciar pagamentos de criadores
CREATE TABLE IF NOT EXISTS public.creator_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.vip_affiliates(id),
  product_id uuid REFERENCES public.products(id),
  order_id uuid REFERENCES public.orders(id),
  gross_amount numeric NOT NULL,
  creator_amount numeric NOT NULL,
  platform_amount numeric NOT NULL,
  affiliate_amount numeric DEFAULT 0,
  affiliate_id uuid REFERENCES public.vip_affiliates(id),
  stripe_transfer_id text,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  paid_at timestamp with time zone
);

-- 4. Criar tabela para assinaturas de Creator (para quem não é Ouro+)
CREATE TABLE IF NOT EXISTS public.creator_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.vip_affiliates(id),
  stripe_subscription_id text,
  stripe_customer_id text,
  status text DEFAULT 'active',
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  price_monthly numeric DEFAULT 97.00,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 5. Enable RLS
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_subscriptions ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies para creator_payouts
CREATE POLICY "Creators can view own payouts"
ON public.creator_payouts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM vip_affiliates va 
    WHERE va.id = creator_payouts.creator_id 
    AND va.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all payouts"
ON public.creator_payouts FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 7. RLS Policies para creator_subscriptions
CREATE POLICY "Users can view own creator subscription"
ON public.creator_subscriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM vip_affiliates va 
    WHERE va.id = creator_subscriptions.affiliate_id 
    AND va.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create own creator subscription"
ON public.creator_subscriptions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM vip_affiliates va 
    WHERE va.id = creator_subscriptions.affiliate_id 
    AND va.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all creator subscriptions"
ON public.creator_subscriptions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. Atualizar policy de produtos para permitir creators editarem seus próprios produtos
DROP POLICY IF EXISTS "Creators can manage own products" ON public.products;
CREATE POLICY "Creators can manage own products"
ON public.products FOR ALL
USING (
  creator_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM vip_affiliates va 
    WHERE va.id = products.creator_id 
    AND va.user_id = auth.uid()
    AND va.is_creator = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM vip_affiliates va 
    WHERE va.id = products.creator_id 
    AND va.user_id = auth.uid()
    AND va.is_creator = true
  )
);

-- 9. Função para verificar se VIP pode ser Creator (Ouro+ ou assinatura ativa)
CREATE OR REPLACE FUNCTION public.can_be_creator(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affiliate_record RECORD;
BEGIN
  SELECT * INTO affiliate_record
  FROM vip_affiliates
  WHERE user_id = user_uuid AND status = 'approved';
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Já é creator
  IF affiliate_record.is_creator THEN
    RETURN true;
  END IF;
  
  -- Verificar se é Ouro ou superior
  IF affiliate_record.tier IN ('ouro', 'gold', 'platinum', 'platina') THEN
    RETURN true;
  END IF;
  
  -- Verificar se tem assinatura ativa
  IF EXISTS (
    SELECT 1 FROM creator_subscriptions cs
    WHERE cs.affiliate_id = affiliate_record.id
    AND cs.status = 'active'
    AND cs.current_period_end > now()
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- 10. Função para ativar Creator
CREATE OR REPLACE FUNCTION public.enable_creator_access(affiliate_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE vip_affiliates
  SET 
    is_creator = true,
    creator_enabled_at = now()
  WHERE id = affiliate_uuid;
  
  RETURN true;
END;
$$;