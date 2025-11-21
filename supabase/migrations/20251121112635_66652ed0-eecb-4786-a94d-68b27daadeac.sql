
-- Drop the existing projects_insert policy
DROP POLICY IF EXISTS "projects_insert" ON public.projects;

-- Create a new, more explicit INSERT policy
-- This policy allows:
-- 1. Super admins to insert any project
-- 2. Regular users to insert projects ONLY for their own company
CREATE POLICY "users_can_create_projects_for_own_company"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
  -- Super admins can create projects for any company
  public.is_super_admin(auth.uid())
  OR
  -- Regular users can only create projects for their own company
  (
    company_id = public.get_user_company_id(auth.uid())
    AND public.get_user_company_id(auth.uid()) IS NOT NULL
  )
);
