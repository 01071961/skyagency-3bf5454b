-- Add missing columns to rewards table for gamification
ALTER TABLE public.rewards 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'discount',
ADD COLUMN IF NOT EXISTS tier_required TEXT DEFAULT 'bronze',
ADD COLUMN IF NOT EXISTS cash_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock INTEGER;

-- Rename points_cost to points_required for consistency (create alias view)
ALTER TABLE public.rewards RENAME COLUMN points_cost TO points_required;

-- Clear existing data and insert proper tier-based rewards
DELETE FROM public.rewards;

-- BRONZE TIER (0-499 pontos) - Acessível a todos
INSERT INTO public.rewards (name, description, type, points_required, tier_required, cash_value, discount_percent, stock, is_active) VALUES
('Desconto 5% Sky Academy', 'Cupom de 5% de desconto em qualquer curso da Academy', 'discount', 100, 'bronze', 0, 5, NULL, true),
('Badge Iniciante', 'Badge exclusivo de Afiliado Iniciante', 'badge', 50, 'bronze', 0, 0, NULL, true),
('Crédito R$5', 'R$5 em créditos para usar na plataforma', 'cash', 200, 'bronze', 5, 0, NULL, true),
('Material Promocional Básico', 'Kit de banners e artes para redes sociais', 'product', 150, 'bronze', 0, 0, 100, true);

-- SILVER/PRATA TIER (500-1999 pontos)
INSERT INTO public.rewards (name, description, type, points_required, tier_required, cash_value, discount_percent, stock, is_active) VALUES
('Desconto 15% Sky Academy', 'Cupom de 15% de desconto em cursos premium', 'discount', 500, 'silver', 0, 15, NULL, true),
('Mentoria Express 30min', 'Sessão de mentoria individual com especialista', 'product', 750, 'silver', 0, 0, 50, true),
('Crédito R$25', 'R$25 em créditos para saques ou compras', 'cash', 800, 'silver', 25, 0, NULL, true),
('Badge Prata Estrela', 'Badge exclusivo tier Prata', 'badge', 600, 'silver', 0, 0, NULL, true),
('Acesso Webinar VIP', 'Entrada para webinars exclusivos mensais', 'feature', 400, 'silver', 0, 0, NULL, true);

-- GOLD/OURO TIER (2000-9999 pontos)
INSERT INTO public.rewards (name, description, type, points_required, tier_required, cash_value, discount_percent, stock, is_active) VALUES
('Desconto 30% Sky Academy', 'Cupom de 30% em qualquer produto da plataforma', 'discount', 2000, 'gold', 0, 30, NULL, true),
('Mentoria Completa 1h', 'Sessão completa de mentoria estratégica', 'product', 3000, 'gold', 0, 0, 30, true),
('Crédito R$100', 'R$100 em créditos livres', 'cash', 3500, 'gold', 100, 0, NULL, true),
('Kit Razer Streamer', 'Mouse pad + webcam cover branded Razer', 'product', 5000, 'gold', 0, 0, 20, true),
('Badge Ouro Master', 'Badge exclusivo tier Ouro', 'badge', 2500, 'gold', 0, 0, NULL, true),
('Analytics Premium 3 meses', 'Acesso ao módulo de analytics IA por 3 meses', 'feature', 4000, 'gold', 0, 0, NULL, true);

-- DIAMOND/DIAMANTE TIER (10000+ pontos)
INSERT INTO public.rewards (name, description, type, points_required, tier_required, cash_value, discount_percent, stock, is_active) VALUES
('Desconto 50% Sky Academy', 'Cupom de 50% em qualquer produto premium', 'discount', 10000, 'diamond', 0, 50, NULL, true),
('Mentoria VIP + Consultoria', 'Pacote completo: 4h mentoria + consultoria estratégica', 'product', 15000, 'diamond', 0, 0, 10, true),
('Crédito R$500', 'R$500 em créditos para saques', 'cash', 18000, 'diamond', 500, 0, NULL, true),
('Setup Streamer Completo', 'Ring light + suporte + kit de iluminação profissional', 'product', 25000, 'diamond', 0, 0, 5, true),
('Badge Diamante Elite', 'Badge máximo de prestígio na plataforma', 'badge', 12000, 'diamond', 0, 0, NULL, true),
('Parceria RedBull Gaming', 'Kit exclusivo RedBull + patrocínio mensal', 'product', 30000, 'diamond', 0, 0, 3, true),
('Analytics Premium Vitalício', 'Acesso vitalício ao módulo de analytics IA', 'feature', 20000, 'diamond', 0, 0, NULL, true),
('Viagem SKY Summit', 'Passagem + hospedagem para o evento anual SKY Summit', 'product', 50000, 'diamond', 0, 0, 2, true);