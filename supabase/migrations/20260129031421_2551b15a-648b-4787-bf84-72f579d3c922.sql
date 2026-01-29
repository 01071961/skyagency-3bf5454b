-- Add admin role to user skyagencysc@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('0114da79-cf36-405a-afa7-a4bcd0a0912a', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;