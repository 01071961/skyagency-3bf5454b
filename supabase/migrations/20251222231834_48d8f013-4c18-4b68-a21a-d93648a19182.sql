-- Add Stripe customer fields to profiles for subscription management
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subscription_end timestamp with time zone DEFAULT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);

-- Update saas_plans with Stripe price IDs if empty
UPDATE public.saas_plans 
SET stripe_price_id_monthly = CASE 
    WHEN slug = 'starter' THEN 'price_STARTER_MONTHLY'
    WHEN slug = 'pro' THEN 'price_PRO_MONTHLY'
    WHEN slug = 'enterprise' THEN 'price_ENTERPRISE_MONTHLY'
    ELSE stripe_price_id_monthly
END
WHERE stripe_price_id_monthly IS NULL OR stripe_price_id_monthly = '';