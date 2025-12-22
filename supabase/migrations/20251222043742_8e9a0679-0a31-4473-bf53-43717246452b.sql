
-- =============================================================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- Use security definer functions instead of direct table references
-- =============================================================================

-- 1. Create a helper function to check if user can access a project (avoids recursion)
CREATE OR REPLACE FUNCTION public.can_user_access_project(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = _user_id
    AND (
      p.is_super_admin = true
      OR EXISTS (
        SELECT 1 FROM projects pr
        WHERE pr.id = _project_id
        AND pr.company_id = p.company_id
        AND p.tenant_role IN ('admin', 'company_admin')
      )
      OR EXISTS (
        SELECT 1 FROM project_members pm
        JOIN projects pr ON pr.id = pm.project_id
        WHERE pm.project_id = _project_id
        AND pm.user_id = _user_id
        AND pr.company_id = p.company_id
      )
    )
  );
$$;

-- 2. Drop and recreate projects RLS policy using the function
DROP POLICY IF EXISTS "Users can view their assigned projects" ON public.projects;
CREATE POLICY "Users can view their assigned projects"
ON public.projects
FOR SELECT
USING (can_user_access_project(auth.uid(), id));

-- 3. Create helper function for test_reports access
CREATE OR REPLACE FUNCTION public.can_user_access_report(_user_id uuid, _project_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = _user_id
    AND (
      p.is_super_admin = true
      OR (p.company_id = _company_id AND p.tenant_role IN ('admin', 'company_admin'))
      OR EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = _project_id
        AND pm.user_id = _user_id
        AND p.company_id = _company_id
      )
    )
  );
$$;

-- 4. Update test_reports RLS policies
DROP POLICY IF EXISTS "Users can view test reports from assigned projects" ON public.test_reports;
CREATE POLICY "Users can view test reports from assigned projects"
ON public.test_reports
FOR SELECT
USING (can_user_access_report(auth.uid(), project_id, company_id));

DROP POLICY IF EXISTS "Users can insert test reports for assigned projects" ON public.test_reports;
CREATE POLICY "Users can insert test reports for assigned projects"
ON public.test_reports
FOR INSERT
WITH CHECK (can_user_access_report(auth.uid(), project_id, company_id));

DROP POLICY IF EXISTS "Users can update test reports from assigned projects" ON public.test_reports;
CREATE POLICY "Users can update test reports from assigned projects"
ON public.test_reports
FOR UPDATE
USING (can_user_access_report(auth.uid(), project_id, company_id))
WITH CHECK (can_user_access_report(auth.uid(), project_id, company_id));

DROP POLICY IF EXISTS "Users can delete test reports from assigned projects" ON public.test_reports;
CREATE POLICY "Users can delete test reports from assigned projects"
ON public.test_reports
FOR DELETE
USING (can_user_access_report(auth.uid(), project_id, company_id));
