-- Fix projects INSERT RLS: change TO public so anon key can insert
DROP POLICY IF EXISTS "projects_insert" ON public.projects;

CREATE POLICY "projects_insert"
ON public.projects
FOR INSERT
TO public
WITH CHECK (
  auth.role() = 'authenticated'
);