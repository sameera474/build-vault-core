-- Add INSERT policy for projects
CREATE POLICY "Users can insert projects for their company"
ON public.projects
FOR INSERT
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.company_id = projects.company_id
    AND p.tenant_role IN ('admin', 'project_manager')
  )) OR (is_super_admin(auth.uid()) = true)
);

-- Add UPDATE policy for projects
CREATE POLICY "Users can update projects from their company"
ON public.projects
FOR UPDATE
USING (
  (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.company_id = projects.company_id
    AND p.tenant_role IN ('admin', 'project_manager')
  )) OR (is_super_admin(auth.uid()) = true)
);

-- Add DELETE policy for projects
CREATE POLICY "Project managers can delete projects from their company"
ON public.projects
FOR DELETE
USING (
  (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.company_id = projects.company_id
    AND p.tenant_role IN ('admin', 'project_manager')
  )) OR (is_super_admin(auth.uid()) = true)
);