-- Atualizar constraint para incluir platinum e ouro (aliases)
ALTER TABLE public.vip_affiliates DROP CONSTRAINT IF EXISTS vip_affiliates_tier_check;

ALTER TABLE public.vip_affiliates ADD CONSTRAINT vip_affiliates_tier_check 
CHECK (tier = ANY (ARRAY['bronze', 'silver', 'gold', 'ouro', 'diamond', 'diamante', 'platinum', 'platina']));

-- Atualizar usuários de teste para tiers premium
UPDATE vip_affiliates 
SET tier = 'gold'
WHERE user_id = '6f6a4e01-c151-4c0f-bfad-e90b4daa5b18';

UPDATE vip_affiliates 
SET tier = 'platinum'
WHERE user_id = '623cc6e8-0869-42cb-9bb1-5c440d210376';