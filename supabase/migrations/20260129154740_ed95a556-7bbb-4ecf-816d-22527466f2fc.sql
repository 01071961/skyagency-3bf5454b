-- Add Daniel Moreira (skyagencysc@gmail.com) as Admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('47fce4ba-15cb-46e5-a942-7416bdb07354', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Add as VIP Diamond affiliate
INSERT INTO public.vip_affiliates (
  user_id, 
  referral_code, 
  tier, 
  status,
  total_earnings,
  available_balance,
  total_referrals,
  total_sales,
  level1_count,
  level2_count,
  is_creator
)
VALUES (
  '47fce4ba-15cb-46e5-a942-7416bdb07354',
  'DANIEL-VIP',
  'diamond',
  'active',
  0,
  0,
  0,
  0,
  0,
  0,
  true
)
ON CONFLICT (user_id) DO UPDATE SET
  tier = 'diamond',
  status = 'active',
  is_creator = true;