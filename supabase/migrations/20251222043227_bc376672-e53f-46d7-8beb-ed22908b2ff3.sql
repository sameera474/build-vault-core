
-- =============================================================================
-- FIX PROJECT & REPORT ACCESS CONTROL
-- Only allow access to projects/reports for users assigned via project_members
-- Admin role retains company-wide access for management purposes
-- =============================================================================

-- 1. Update user_accessible_projects function to respect project_members
CREATE OR REPLACE FUNCTION public.user_accessible_projects()
RETURNS SETOF projects
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
  v_is_super_admin BOOLEAN;
  v_role TEXT;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT p.company_id, p.is_super_admin, p.tenant_role
  INTO v_company_id, v_is_super_admin, v_role
  FROM public.profiles p
  WHERE p.user_id = v_user_id;

  -- Super admin: all projects
  IF v_is_super_admin THEN
    RETURN QUERY
    SELECT proj.*
    FROM public.projects proj
    ORDER BY proj.name;
  -- Admin: all company projects (for management)
  ELSIF v_role IN ('admin', 'company_admin') THEN
    RETURN QUERY
    SELECT proj.*
    FROM public.projects proj
    WHERE proj.company_id = v_company_id
    ORDER BY proj.name;
  -- All other roles: only assigned projects via project_members
  ELSE
    RETURN QUERY
    SELECT proj.*
    FROM public.projects proj
    INNER JOIN public.project_members pm ON pm.project_id = proj.id
    WHERE pm.user_id = v_user_id
      AND proj.company_id = v_company_id
    ORDER BY proj.name;
  END IF;
END;
$$;

-- 2. Update user_accessible_project_ids to match the same logic
CREATE OR REPLACE FUNCTION public.user_accessible_project_ids(_user_id uuid)
RETURNS TABLE(project_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH user_info AS (
    SELECT p.company_id, p.tenant_role as role, p.is_super_admin
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
    -- admin: all company projects
    OR (ui.role IN ('company_admin', 'admin') AND pr.company_id = ui.company_id)
    -- all other roles: only via project_members assignment
    OR (pm.user_id IS NOT NULL AND pr.company_id = ui.company_id);
$$;

-- 3. Update user_can_access_project to match
CREATE OR REPLACE FUNCTION public.user_can_access_project(user_uuid uuid, project_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH user_info AS (
    SELECT p.company_id, p.tenant_role as role, p.is_super_admin
    FROM public.profiles p
    WHERE p.user_id = user_uuid
  )
  SELECT EXISTS (
    SELECT 1 FROM user_info ui, public.projects pr
    WHERE pr.id = project_uuid
    AND (
      ui.is_super_admin = true
      OR (ui.role IN ('company_admin', 'admin') AND pr.company_id = ui.company_id)
      OR (
        pr.company_id = ui.company_id 
        AND EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = project_uuid AND pm.user_id = user_uuid
        )
      )
    )
  );
$$;

-- 4. Update user_can_modify_report to respect project membership
CREATE OR REPLACE FUNCTION public.user_can_modify_report(user_uuid uuid, project_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH user_info AS (
    SELECT p.company_id, p.tenant_role as role, p.is_super_admin
    FROM public.profiles p
    WHERE p.user_id = user_uuid
  )
  SELECT EXISTS (
    SELECT 1 FROM user_info ui, public.projects pr
    WHERE pr.id = project_uuid
    AND (
      ui.is_super_admin = true
      OR (ui.role IN ('company_admin', 'admin') AND pr.company_id = ui.company_id)
      OR (
        pr.company_id = ui.company_id 
        AND ui.role IN ('technician', 'supervisor', 'project_manager', 'quality_manager')
        AND EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = project_uuid AND pm.user_id = user_uuid
        )
      )
    )
  );
$$;

-- 5. Update RLS policies on projects table to use project_members
DROP POLICY IF EXISTS "Users can view projects from their company" ON public.projects;
CREATE POLICY "Users can view their assigned projects"
ON public.projects
FOR SELECT
USING (
  is_super_admin(auth.uid()) = true
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
      AND p.company_id = projects.company_id
      AND p.tenant_role IN ('admin', 'company_admin')
  )
  OR EXISTS (
    SELECT 1 FROM project_members pm
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE pm.project_id = projects.id
      AND pm.user_id = auth.uid()
      AND p.company_id = projects.company_id
  )
);

-- 6. Update RLS policies on test_reports to respect project assignment
DROP POLICY IF EXISTS "Users can view test reports from their company" ON public.test_reports;
CREATE POLICY "Users can view test reports from assigned projects"
ON public.test_reports
FOR SELECT
USING (
  is_super_admin(auth.uid()) = true
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
      AND p.company_id = test_reports.company_id
      AND p.tenant_role IN ('admin', 'company_admin')
  )
  OR EXISTS (
    SELECT 1 FROM project_members pm
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE pm.project_id = test_reports.project_id
      AND pm.user_id = auth.uid()
      AND p.company_id = test_reports.company_id
  )
);

DROP POLICY IF EXISTS "Users can insert test reports for their company" ON public.test_reports;
CREATE POLICY "Users can insert test reports for assigned projects"
ON public.test_reports
FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid()) = true
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
      AND p.company_id = test_reports.company_id
      AND p.tenant_role IN ('admin', 'company_admin')
  )
  OR EXISTS (
    SELECT 1 FROM project_members pm
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE pm.project_id = test_reports.project_id
      AND pm.user_id = auth.uid()
      AND p.company_id = test_reports.company_id
  )
);

DROP POLICY IF EXISTS "Users can update test reports from their company" ON public.test_reports;
CREATE POLICY "Users can update test reports from assigned projects"
ON public.test_reports
FOR UPDATE
USING (
  is_super_admin(auth.uid()) = true
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
      AND p.company_id = test_reports.company_id
      AND p.tenant_role IN ('admin', 'company_admin')
  )
  OR EXISTS (
    SELECT 1 FROM project_members pm
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE pm.project_id = test_reports.project_id
      AND pm.user_id = auth.uid()
      AND p.company_id = test_reports.company_id
  )
)
WITH CHECK (
  is_super_admin(auth.uid()) = true
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
      AND p.company_id = test_reports.company_id
      AND p.tenant_role IN ('admin', 'company_admin')
  )
  OR EXISTS (
    SELECT 1 FROM project_members pm
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE pm.project_id = test_reports.project_id
      AND pm.user_id = auth.uid()
      AND p.company_id = test_reports.company_id
  )
);

DROP POLICY IF EXISTS "Users can delete test reports from their company" ON public.test_reports;
CREATE POLICY "Users can delete test reports from assigned projects"
ON public.test_reports
FOR DELETE
USING (
  is_super_admin(auth.uid()) = true
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
      AND p.company_id = test_reports.company_id
      AND p.tenant_role IN ('admin', 'company_admin')
  )
  OR EXISTS (
    SELECT 1 FROM project_members pm
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE pm.project_id = test_reports.project_id
      AND pm.user_id = auth.uid()
      AND p.company_id = test_reports.company_id
  )
);
