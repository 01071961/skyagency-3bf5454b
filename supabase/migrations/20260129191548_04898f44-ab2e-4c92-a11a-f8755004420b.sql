-- Add owner role to Daniel Moreira (keeping existing admin role)
INSERT INTO public.user_roles (user_id, role)
VALUES ('47fce4ba-15cb-46e5-a942-7416bdb07354', 'owner')
ON CONFLICT (user_id, role) DO NOTHING;