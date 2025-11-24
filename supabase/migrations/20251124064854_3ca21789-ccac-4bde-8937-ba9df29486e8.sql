-- Update projects RLS policy to allow project managers to delete projects
-- This replaces the existing policy to add project_manager role

DROP POLICY IF EXISTS "projects_delete" ON public.projects;

CREATE POLICY "projects_delete" 
ON public.projects
FOR DELETE
USING (
  is_super_admin(auth.uid()) 
  OR (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() 
      AND p.company_id = projects.company_id
      AND p.role IN ('admin', 'company_admin', 'project_manager')
    )
  )
);