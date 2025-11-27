-- ============================================
-- SET SUPER ADMIN USERS
-- FIXED: Uses tenant_role instead of role
-- ============================================

-- Update current authenticated user to super admin
UPDATE public.profiles
SET is_super_admin = true, tenant_role = 'admin'
WHERE user_id = auth.uid();

-- Update specific email to super admin
UPDATE public.profiles
SET is_super_admin = true, tenant_role = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'sameera474@gmail.com'
);

-- Update specific user_id to super admin (if known)
-- Uncomment and replace with your user_id
-- UPDATE public.profiles
-- SET is_super_admin = true, tenant_role = 'admin'
-- WHERE user_id = '4ff5493c-0123-4699-8c44-faf673c31e35';

-- Verify super admins
SELECT 
  user_id,
  name,
  email,
  tenant_role,
  is_super_admin,
  company_id
FROM public.profiles
WHERE is_super_admin = true;
