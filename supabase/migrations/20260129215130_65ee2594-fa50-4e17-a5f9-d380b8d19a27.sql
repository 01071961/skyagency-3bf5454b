-- Inserir badges predefinidos para gamificação SKY BRASIL
-- Badges de Indicação
INSERT INTO badges (name, description, icon_url, points_required, criteria, is_active) VALUES
('Primeiro Passo', 'Fez sua primeira indicação', '🌱', 50, '{"type": "referrals", "value": 1}'::jsonb, true),
('Recrutador Iniciante', 'Alcançou 5 indicações', '👥', 100, '{"type": "referrals", "value": 5}'::jsonb, true),
('Recrutador Mestre', 'Alcançou 10 indicações ativas', '🎯', 200, '{"type": "referrals", "value": 10}'::jsonb, true),
('Líder de Equipe', 'Alcançou 25 indicações', '🏆', 500, '{"type": "referrals", "value": 25}'::jsonb, true),
('Mestre da Rede', 'Alcançou 50 indicações', '👑', 1000, '{"type": "referrals", "value": 50}'::jsonb, true)
ON CONFLICT DO NOTHING;

-- Badges de Vendas
INSERT INTO badges (name, description, icon_url, points_required, criteria, is_active) VALUES
('Primeira Venda', 'Realizou sua primeira venda', '💰', 100, '{"type": "sales", "value": 1}'::jsonb, true),
('Vendedor Bronze', 'Alcançou R$ 1.000 em vendas', '📈', 200, '{"type": "sales", "value": 1000}'::jsonb, true),
('Vendedor Prata', 'Alcançou R$ 5.000 em vendas', '🚀', 500, '{"type": "sales", "value": 5000}'::jsonb, true),
('Vendedor Ouro', 'Alcançou R$ 10.000 em vendas', '💎', 1000, '{"type": "sales", "value": 10000}'::jsonb, true),
('Top Seller', 'Alcançou R$ 50.000 em vendas', '⭐', 2500, '{"type": "sales", "value": 50000}'::jsonb, true)
ON CONFLICT DO NOTHING;

-- Badges de Tier
INSERT INTO badges (name, description, icon_url, points_required, criteria, is_active) VALUES
('Prata Alcançado', 'Conquistou o tier Prata', '🥈', 250, '{"type": "tier", "value": "silver"}'::jsonb, true),
('Ouro Alcançado', 'Conquistou o tier Ouro', '🥇', 500, '{"type": "tier", "value": "gold"}'::jsonb, true),
('Diamante Alcançado', 'Conquistou o tier Diamante', '💎', 1500, '{"type": "tier", "value": "diamond"}'::jsonb, true)
ON CONFLICT DO NOTHING;

-- Badges de Desafio e Especiais
INSERT INTO badges (name, description, icon_url, points_required, criteria, is_active) VALUES
('Consistente', '7 dias consecutivos com atividade', '🔥', 100, '{"type": "streak", "value": 7}'::jsonb, true),
('Dedicado', '30 dias consecutivos com atividade', '🌟', 500, '{"type": "streak", "value": 30}'::jsonb, true),
('Graduado SKY', 'Completou a Academy SKY', '🎓', 750, '{"type": "challenge", "value": "academy"}'::jsonb, true),
('Early Adopter', 'Um dos primeiros 100 afiliados', '🌅', 500, '{"type": "manual", "value": "early_adopter"}'::jsonb, true)
ON CONFLICT DO NOTHING;

-- Inserir recompensas iniciais para loja de pontos
INSERT INTO rewards (name, description, points_cost, quantity_available, is_active) VALUES
('Desconto 10% em cursos', 'Cupom de 10% de desconto para qualquer curso da plataforma', 500, null, true),
('Desconto 20% em cursos', 'Cupom de 20% de desconto para qualquer curso premium', 1000, null, true),
('Mentoria Individual 30min', 'Sessão de mentoria individual com especialista', 2500, 10, true),
('Acesso Academy Premium 1 mês', 'Acesso completo à Academy SKY por 1 mês', 3000, null, true),
('Kit Parceiro Razer', 'Kit exclusivo de parceria com a Razer (Top 10 mensal)', 10000, 5, true),
('Crédito R$ 50', 'Crédito de R$ 50 para usar na plataforma', 5000, null, true),
('Crédito R$ 100', 'Crédito de R$ 100 para usar na plataforma', 9000, null, true)
ON CONFLICT DO NOTHING;