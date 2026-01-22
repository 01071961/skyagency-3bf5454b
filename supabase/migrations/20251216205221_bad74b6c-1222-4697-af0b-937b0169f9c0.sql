-- Tabela de programas de afiliação
CREATE TABLE public.affiliate_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  attribution_rule TEXT NOT NULL DEFAULT 'last_click', -- 'last_click' ou 'first_click'
  default_commission_rate NUMERIC NOT NULL DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de produtos em programas de afiliação
CREATE TABLE public.affiliate_program_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.affiliate_programs(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  commission_rate NUMERIC NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(program_id, product_id)
);

-- Tabela de convites de afiliados
CREATE TABLE public.affiliate_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES public.affiliate_programs(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT,
  token TEXT NOT NULL UNIQUE,
  commission_rate NUMERIC DEFAULT 10,
  status TEXT DEFAULT 'pending', -- pending, accepted, expired
  invited_by UUID REFERENCES auth.users(id),
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar program_id à tabela de afiliados
ALTER TABLE public.vip_affiliates 
ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES public.affiliate_programs(id),
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS invite_id UUID REFERENCES public.affiliate_invites(id);

-- Enable RLS
ALTER TABLE public.affiliate_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_program_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies para affiliate_programs
CREATE POLICY "Admins can manage affiliate programs" ON public.affiliate_programs
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active programs" ON public.affiliate_programs
FOR SELECT USING (is_active = true);

-- RLS Policies para affiliate_program_products
CREATE POLICY "Admins can manage program products" ON public.affiliate_program_products
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view program products" ON public.affiliate_program_products
FOR SELECT USING (true);

-- RLS Policies para affiliate_invites
CREATE POLICY "Admins can manage invites" ON public.affiliate_invites
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own invites by email" ON public.affiliate_invites
FOR SELECT USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_affiliate_programs_updated_at
BEFORE UPDATE ON public.affiliate_programs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();