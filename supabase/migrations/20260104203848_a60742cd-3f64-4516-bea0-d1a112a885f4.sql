-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "profiles_view_company_admins" ON public.profiles;

-- Recreate a non-recursive policy using get_user_company_id_safe function 
-- which is SECURITY DEFINER and bypasses RLS
CREATE POLICY "profiles_view_company_admins" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can always see their own profile
  auth.uid() = user_id 
  -- Super admins can see all (using existing security definer function)
  OR is_super_admin(auth.uid()) = true
  -- Admin roles can see company profiles (using security definer function to avoid recursion)
  OR (
    company_id = get_user_company_id_safe(auth.uid())
  )
);