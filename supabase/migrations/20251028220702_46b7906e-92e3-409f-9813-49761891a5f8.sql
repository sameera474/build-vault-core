-- 1) Broaden project visibility for Project Managers to all company projects
CREATE OR REPLACE FUNCTION public.user_accessible_project_ids(_user_id uuid)
RETURNS TABLE(project_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH user_info AS (
    SELECT p.company_id, p.role, p.is_super_admin
    FROM public.profiles p
    WHERE p.user_id = _user_id
  )
  SELECT DISTINCT pr.id as project_id
  FROM projects pr
  CROSS JOIN user_info ui
  LEFT JOIN project_members pm 
    ON pm.project_id = pr.id AND pm.user_id = _user_id
  WHERE
    -- super admin: all projects
    ui.is_super_admin = true
    -- company-level visibility for admins and PMs
    OR (ui.role IN ('company_admin', 'admin', 'project_manager') AND pr.company_id = ui.company_id)
    -- any explicit assignment still works for other roles
    OR pm.user_id IS NOT NULL;
$$;

-- 2) Ensure all relevant reports appear in Approvals (handle project_id NULL and company-level roles)
DROP POLICY IF EXISTS "test_reports_select_access" ON test_reports;
CREATE POLICY "test_reports_select_access"
ON test_reports
FOR SELECT
USING (
  -- super admin sees everything
  is_super_admin(auth.uid())
  OR
  -- company admins and PMs can see all company reports (even if project_id is null)
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.company_id = test_reports.company_id
      AND p.role IN ('admin','company_admin','project_manager')
  )
  OR
  -- members and explicit permissions for project-scoped access
  (test_reports.project_id IS NOT NULL AND (
     is_project_member(auth.uid(), test_reports.project_id)
     OR has_project_permission(auth.uid(), test_reports.project_id, 'test_reports', 'view')
     OR is_company_admin_for_project(auth.uid(), test_reports.project_id)
     OR is_project_manager_for_project(auth.uid(), test_reports.project_id)
  ))
);
