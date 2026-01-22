-- Add 2FA columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret text,
ADD COLUMN IF NOT EXISTS two_factor_backup_codes text[];

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_two_factor ON public.profiles(two_factor_enabled) WHERE two_factor_enabled = true;

COMMENT ON COLUMN public.profiles.two_factor_enabled IS 'Whether 2FA is enabled for this user';
COMMENT ON COLUMN public.profiles.two_factor_secret IS 'TOTP secret key (encrypted in production)';
COMMENT ON COLUMN public.profiles.two_factor_backup_codes IS 'Backup codes for 2FA recovery';