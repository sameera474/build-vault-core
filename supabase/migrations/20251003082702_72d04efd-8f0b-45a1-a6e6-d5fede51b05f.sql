-- Drop existing restrictive policies
DROP POLICY IF EXISTS "profiles_self_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_company_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_super_admin_read" ON public.profiles;

-- Allow users to read and update their own profile
CREATE POLICY "Users can view and update own profile"
ON public.profiles
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow users to view profiles in their company
CREATE POLICY "Users can view company profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
);

-- Allow super admins to view all profiles
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  is_super_admin(auth.uid())
);

-- Allow super admins to update any profile (including company assignment)
CREATE POLICY "Super admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  is_super_admin(auth.uid())
)
WITH CHECK (
  is_super_admin(auth.uid())
);