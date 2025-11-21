-- Drop the existing policy
DROP POLICY IF EXISTS "projects_insert" ON public.projects;

-- Create a more robust policy that directly checks profiles
CREATE POLICY "projects_insert"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND (
      is_super_admin = true 
      OR company_id = projects.company_id
    )
  )
);