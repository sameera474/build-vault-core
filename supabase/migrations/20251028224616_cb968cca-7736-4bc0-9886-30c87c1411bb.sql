-- Make company_id nullable for super admins
ALTER TABLE public.profiles ALTER COLUMN company_id DROP NOT NULL;

-- Add check constraint to ensure super admins have NULL company_id
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_super_admin_company;
ALTER TABLE public.profiles ADD CONSTRAINT check_super_admin_company 
  CHECK (
    (is_super_admin = true AND company_id IS NULL) OR 
    (is_super_admin = false AND company_id IS NOT NULL) OR
    is_super_admin IS NULL
  );

-- Insert super admin profile
INSERT INTO public.profiles (
  user_id,
  company_id,
  name,
  email,
  role,
  is_super_admin,
  is_active
)
VALUES (
  '116a951b-9012-42c7-88a0-a41791c4bdcc',
  NULL,
  'Sameera Chaturanga Wagaarachchige',
  'sameera474@gmail.com',
  'super_admin',
  true,
  true
)
ON CONFLICT (user_id) DO UPDATE SET
  company_id = NULL,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = 'super_admin',
  is_super_admin = true,
  is_active = true;

-- Insert user role
INSERT INTO public.user_roles (
  user_id,
  role
)
VALUES (
  '116a951b-9012-42c7-88a0-a41791c4bdcc',
  'super_admin'
)
ON CONFLICT (user_id, role) DO NOTHING;