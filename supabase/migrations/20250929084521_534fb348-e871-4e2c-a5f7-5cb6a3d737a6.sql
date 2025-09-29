-- Update RLS policies for proper role-based access control on test_reports

-- First, let's drop existing test_reports policies and recreate them with proper RBAC
DROP POLICY IF EXISTS "Users can create test reports for their company" ON public.test_reports;
DROP POLICY IF EXISTS "Users can delete their company test reports" ON public.test_reports;
DROP POLICY IF EXISTS "Users can update their company test reports" ON public.test_reports;
DROP POLICY IF EXISTS "Users can view their company test reports" ON public.test_reports;
DROP POLICY IF EXISTS "reports_delete" ON public.test_reports;
DROP POLICY IF EXISTS "reports_insert" ON public.test_reports;
DROP POLICY IF EXISTS "reports_select" ON public.test_reports;
DROP POLICY IF EXISTS "reports_update" ON public.test_reports;

-- Create security definer functions for role checking
CREATE OR REPLACE FUNCTION public.user_can_access_project(user_uuid uuid, project_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH user_info AS (
    SELECT p.company_id, p.role, p.is_super_admin
    FROM public.profiles p
    WHERE p.user_id = user_uuid
  )
  SELECT EXISTS (
    SELECT 1 FROM user_info ui, public.projects pr
    WHERE pr.id = project_uuid
    AND (
      ui.is_super_admin = true
      OR (ui.role IN ('company_admin', 'admin') AND pr.company_id = ui.company_id)
      OR (ui.role IN ('staff', 'project_manager') AND EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = project_uuid AND pm.user_id = user_uuid
      ))
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.user_can_modify_report(user_uuid uuid, project_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH user_info AS (
    SELECT p.company_id, p.role, p.is_super_admin
    FROM public.profiles p
    WHERE p.user_id = user_uuid
  )
  SELECT EXISTS (
    SELECT 1 FROM user_info ui, public.projects pr
    WHERE pr.id = project_uuid
    AND (
      ui.is_super_admin = true
      OR (ui.role IN ('company_admin', 'admin') AND pr.company_id = ui.company_id)
      OR (ui.role = 'staff' AND EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = project_uuid AND pm.user_id = user_uuid
      ))
    )
  );
$$;

-- Test Reports SELECT policy - role-based access
CREATE POLICY "test_reports_select_rbac" ON public.test_reports
  FOR SELECT
  TO authenticated
  USING (
    public.user_can_access_project(auth.uid(), project_id)
  );

-- Test Reports INSERT policy - only staff and admins can create
CREATE POLICY "test_reports_insert_rbac" ON public.test_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_can_modify_report(auth.uid(), project_id)
  );

-- Test Reports UPDATE policy - only staff and admins can edit (project managers can't)
CREATE POLICY "test_reports_update_rbac" ON public.test_reports
  FOR UPDATE
  TO authenticated
  USING (
    public.user_can_modify_report(auth.uid(), project_id)
  );

-- Test Reports DELETE policy - only admins can delete
CREATE POLICY "test_reports_delete_rbac" ON public.test_reports
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p, public.projects pr
      WHERE p.user_id = auth.uid()
      AND pr.id = test_reports.project_id
      AND (
        p.is_super_admin = true
        OR (p.role IN ('company_admin', 'admin') AND pr.company_id = p.company_id)
      )
    )
  );