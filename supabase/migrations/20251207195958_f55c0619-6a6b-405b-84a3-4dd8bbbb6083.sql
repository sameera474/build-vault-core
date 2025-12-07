-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "profiles_view_company_members" ON public.profiles;

-- Create a non-recursive policy using auth.jwt() to get company_id
-- First, we need to use a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.get_user_company_id_safe(user_uuid uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT company_id FROM profiles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Now create the policy using this function
CREATE POLICY "profiles_view_company_members"
ON public.profiles
FOR SELECT
USING (
  -- User can view their own profile
  auth.uid() = user_id
  -- Or profiles from the same company (using security definer function)
  OR company_id = get_user_company_id_safe(auth.uid())
  -- Or super admins can view all
  OR is_super_admin(auth.uid()) = true
);