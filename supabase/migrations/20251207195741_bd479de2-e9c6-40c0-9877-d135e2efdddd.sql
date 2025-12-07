-- Allow users to view profiles of team members in their company
CREATE POLICY "profiles_view_company_members"
ON public.profiles
FOR SELECT
USING (
  -- User can view their own profile
  auth.uid() = user_id
  -- Or profiles from the same company
  OR company_id = (SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid())
  -- Or super admins can view all
  OR is_super_admin(auth.uid()) = true
);