-- Fix projects INSERT RLS: Allow authenticated users to create projects for their own company
DROP POLICY IF EXISTS "projects_insert" ON public.projects;

CREATE POLICY "projects_insert"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
  -- Super admins can create for any company
  is_super_admin(auth.uid())
  OR
  -- Regular users can only create for their own company
  company_id = (SELECT company_id FROM profiles WHERE user_id = auth.uid())
);