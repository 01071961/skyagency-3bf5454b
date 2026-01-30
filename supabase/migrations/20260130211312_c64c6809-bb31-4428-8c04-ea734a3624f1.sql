-- =====================================================
-- REMOVER TIER PLATINUM DO SISTEMA
-- Migrar todos os usuários platinum para diamond
-- =====================================================

-- 1. Primeiro, atualizar todos os afiliados com tier 'platinum' para 'diamond'
UPDATE public.vip_affiliates 
SET tier = 'diamond'::affiliate_tier, updated_at = now()
WHERE tier = 'platinum'::affiliate_tier;

-- 2. Para remover um valor do ENUM:
-- Precisamos dropar o default primeiro, alterar o tipo, depois recriar o default

-- Salvar e dropar o default
ALTER TABLE public.vip_affiliates ALTER COLUMN tier DROP DEFAULT;

-- Criar novo enum sem platinum
CREATE TYPE affiliate_tier_new AS ENUM ('bronze', 'silver', 'gold', 'diamond');

-- Alterar a coluna vip_affiliates.tier
ALTER TABLE public.vip_affiliates 
ALTER COLUMN tier TYPE affiliate_tier_new 
USING tier::text::affiliate_tier_new;

-- Dropar o tipo antigo
DROP TYPE affiliate_tier;

-- Renomear o novo tipo
ALTER TYPE affiliate_tier_new RENAME TO affiliate_tier;

-- Restaurar o default
ALTER TABLE public.vip_affiliates ALTER COLUMN tier SET DEFAULT 'bronze'::affiliate_tier;

-- 3. Atualizar coluna plan em profiles se tiver platinum
UPDATE public.profiles
SET plan = 'diamante'
WHERE plan IN ('platinum', 'platina');

-- Remover constraint antiga e adicionar nova em profiles (se existir a coluna)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'plan'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check 
    CHECK (plan IN ('free', 'bronze', 'prata', 'ouro', 'diamante'));
  END IF;
END $$;

-- 4. Remover constraint velha de vip_affiliates
ALTER TABLE public.vip_affiliates DROP CONSTRAINT IF EXISTS vip_affiliates_tier_check;