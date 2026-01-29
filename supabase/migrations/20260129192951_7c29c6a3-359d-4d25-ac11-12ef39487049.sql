-- Add policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Create missing profiles for users with roles
INSERT INTO public.profiles (user_id, email, name)
SELECT ur.user_id, au.email, COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1))
FROM public.user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = ur.user_id)
ON CONFLICT (user_id) DO NOTHING;