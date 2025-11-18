-- Relax projects INSERT RLS so any user from the same company (plus super admins) can create projects
DROP POLICY IF EXISTS "projects_insert" ON public.projects;

CREATE POLICY "projects_insert"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
  is_super_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.user_id = auth.uid()
      AND p.company_id = projects.company_id
  )
);