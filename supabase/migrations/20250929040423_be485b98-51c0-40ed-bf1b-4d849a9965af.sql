-- Update the INSERT policy to allow super admins to create projects for any company
DROP POLICY IF EXISTS "tenant insert projects" ON public.projects;

CREATE POLICY "tenant insert projects"
ON public.projects FOR INSERT
WITH CHECK (
  -- Super admins can create projects for any company
  (SELECT is_super_admin FROM public.profiles WHERE user_id = auth.uid()) = true
  OR
  -- Regular users can only create projects for their own company
  company_id = public.current_user_company()
);

-- Also update the UPDATE policy for consistency
DROP POLICY IF EXISTS "tenant update projects" ON public.projects;

CREATE POLICY "tenant update projects"
ON public.projects FOR UPDATE
USING (
  -- Super admins can update any project
  (SELECT is_super_admin FROM public.profiles WHERE user_id = auth.uid()) = true
  OR
  -- Regular users can only update their company's projects
  company_id = public.current_user_company()
);

-- Update the DELETE policy for consistency
DROP POLICY IF EXISTS "tenant delete projects" ON public.projects;

CREATE POLICY "tenant delete projects"
ON public.projects FOR DELETE
USING (
  -- Super admins can delete any project
  (SELECT is_super_admin FROM public.profiles WHERE user_id = auth.uid()) = true
  OR
  -- Regular users can only delete their company's projects
  company_id = public.current_user_company()
);