-- =============================================
-- FASE 1: Multi-Tenancy Foundation
-- =============================================

-- Tabela de Tenants (Agências/Organizações)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{"theme": "dark", "features": {}}',
  subscription_tier TEXT DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'trial', 'suspended', 'cancelled')),
  trial_ends_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  max_users INTEGER DEFAULT 1,
  max_affiliates INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Membros do Tenant
CREATE TABLE IF NOT EXISTS public.tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member')),
  permissions JSONB DEFAULT '{}',
  invited_by UUID,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Sistema de Notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'commission', 'referral', 'system', 'promotion')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Planos SaaS
CREATE TABLE IF NOT EXISTS public.saas_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  price_yearly NUMERIC,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB DEFAULT '{}',
  limits JSONB DEFAULT '{"users": 1, "affiliates": 10, "products": 5, "storage_gb": 1}',
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding Progress
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 1,
  completed_steps JSONB DEFAULT '[]',
  onboarding_type TEXT DEFAULT 'affiliate' CHECK (onboarding_type IN ('affiliate', 'agency', 'customer')),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Events (para PostHog local backup)
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_properties JSONB DEFAULT '{}',
  user_properties JSONB DEFAULT '{}',
  session_id TEXT,
  page_url TEXT,
  referrer TEXT,
  device_type TEXT,
  browser TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Policies for tenants
CREATE POLICY "Users can view their tenants" ON public.tenants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = tenants.id AND user_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage tenants" ON public.tenants
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies for tenant_members
CREATE POLICY "Users can view tenant members" ON public.tenant_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.tenant_members tm WHERE tm.tenant_id = tenant_members.tenant_id AND tm.user_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Tenant admins can manage members" ON public.tenant_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tenant_members tm WHERE tm.tenant_id = tenant_members.tenant_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin'))
    OR has_role(auth.uid(), 'admin')
  );

-- Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all notifications" ON public.notifications
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies for saas_plans
CREATE POLICY "Anyone can view active plans" ON public.saas_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON public.saas_plans
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies for onboarding_progress
CREATE POLICY "Users can manage own onboarding" ON public.onboarding_progress
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all onboarding" ON public.onboarding_progress
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Policies for analytics_events
CREATE POLICY "Users can insert own events" ON public.analytics_events
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Admins can view all events" ON public.analytics_events
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Insert default SaaS plans
INSERT INTO public.saas_plans (name, slug, description, price_monthly, price_yearly, features, limits, is_popular, sort_order) VALUES
  ('Basic', 'basic', 'Para afiliados iniciantes', 49, 470, 
   '{"dashboard": true, "referral_links": true, "basic_analytics": true, "email_support": true}',
   '{"users": 1, "affiliates": 10, "products": 5, "storage_gb": 1}',
   false, 1),
  ('Pro', 'pro', 'Para afiliados profissionais', 99, 950,
   '{"dashboard": true, "referral_links": true, "advanced_analytics": true, "ai_assistant": true, "priority_support": true, "custom_domain": true, "api_access": true}',
   '{"users": 5, "affiliates": 100, "products": 50, "storage_gb": 10}',
   true, 2),
  ('Enterprise', 'enterprise', 'Para agências e grandes operações', 299, 2870,
   '{"dashboard": true, "referral_links": true, "advanced_analytics": true, "ai_assistant": true, "dedicated_support": true, "custom_domain": true, "api_access": true, "white_label": true, "multi_tenant": true, "sla": true}',
   '{"users": -1, "affiliates": -1, "products": -1, "storage_gb": 100}',
   false, 3)
ON CONFLICT (slug) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_members_user ON public.tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant ON public.tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_onboarding_user ON public.onboarding_progress(user_id);

-- Trigger para updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_updated_at BEFORE UPDATE ON public.onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();