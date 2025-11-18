-- Update projects RLS policy to allow project_manager role to create projects
DROP POLICY IF EXISTS "projects_insert" ON public.projects;

CREATE POLICY "projects_insert" 
ON public.projects 
FOR INSERT 
TO authenticated
WITH CHECK (
  is_super_admin(auth.uid()) 
  OR (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.user_id = auth.uid() 
      AND p.company_id = projects.company_id 
      AND p.role = ANY(ARRAY['admin'::text, 'company_admin'::text, 'project_manager'::text])
    )
  )
);