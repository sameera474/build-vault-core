-- Enable RLS on project_members if not already enabled
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view project members for projects in their company
CREATE POLICY "Users can view project members for their company projects"
ON public.project_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN projects proj ON proj.company_id = p.company_id
    WHERE p.user_id = auth.uid() AND proj.id = project_members.project_id
  )
  OR is_super_admin(auth.uid()) = true
);

-- Policy: Admins and Project Managers can insert project members
CREATE POLICY "Admins can insert project members"
ON public.project_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN projects proj ON proj.company_id = p.company_id
    WHERE p.user_id = auth.uid() 
      AND proj.id = project_members.project_id
      AND p.tenant_role IN ('admin', 'project_manager', 'quality_manager')
  )
  OR is_super_admin(auth.uid()) = true
);

-- Policy: Admins and Project Managers can update project members
CREATE POLICY "Admins can update project members"
ON public.project_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN projects proj ON proj.company_id = p.company_id
    WHERE p.user_id = auth.uid() 
      AND proj.id = project_members.project_id
      AND p.tenant_role IN ('admin', 'project_manager', 'quality_manager')
  )
  OR is_super_admin(auth.uid()) = true
);

-- Policy: Admins and Project Managers can delete project members
CREATE POLICY "Admins can delete project members"
ON public.project_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN projects proj ON proj.company_id = p.company_id
    WHERE p.user_id = auth.uid() 
      AND proj.id = project_members.project_id
      AND p.tenant_role IN ('admin', 'project_manager', 'quality_manager')
  )
  OR is_super_admin(auth.uid()) = true
);