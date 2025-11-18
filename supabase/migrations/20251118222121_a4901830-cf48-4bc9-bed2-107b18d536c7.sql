-- Loosen projects INSERT RLS to allow any authenticated user to insert
DROP POLICY IF EXISTS "projects_insert" ON public.projects;

CREATE POLICY "projects_insert"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
  auth.role() = 'authenticated'
);