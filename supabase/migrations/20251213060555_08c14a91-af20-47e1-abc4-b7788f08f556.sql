-- Add INSERT policy for project_roads
CREATE POLICY "Users can insert project roads for their company projects"
ON public.project_roads
FOR INSERT
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM profiles p
    JOIN projects proj ON proj.company_id = p.company_id
    WHERE p.user_id = auth.uid() AND proj.id = project_roads.project_id
  )) OR (is_super_admin(auth.uid()) = true)
);

-- Add UPDATE policy for project_roads
CREATE POLICY "Users can update project roads from their company"
ON public.project_roads
FOR UPDATE
USING (
  (EXISTS (
    SELECT 1 FROM profiles p
    JOIN projects proj ON proj.company_id = p.company_id
    WHERE p.user_id = auth.uid() AND proj.id = project_roads.project_id
  )) OR (is_super_admin(auth.uid()) = true)
);

-- Add DELETE policy for project_roads  
CREATE POLICY "Users can delete project roads from their company"
ON public.project_roads
FOR DELETE
USING (
  (EXISTS (
    SELECT 1 FROM profiles p
    JOIN projects proj ON proj.company_id = p.company_id
    WHERE p.user_id = auth.uid() AND proj.id = project_roads.project_id
  )) OR (is_super_admin(auth.uid()) = true)
);