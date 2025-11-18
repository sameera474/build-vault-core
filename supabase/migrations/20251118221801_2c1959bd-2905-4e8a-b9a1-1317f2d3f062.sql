-- Simplify projects INSERT RLS: apply to all roles, gate by profile/company match
DROP POLICY IF EXISTS "projects_insert" ON public.projects;

CREATE POLICY "projects_insert"
ON public.projects
FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.user_id = auth.uid()
      AND p.company_id = projects.company_id
  )
);