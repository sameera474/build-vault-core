-- Fix RLS policies for test_reports to allow proper access across roles
-- Drop the overly restrictive SELECT policy
DROP POLICY IF EXISTS "test_reports_strict_project_access" ON test_reports;

-- Create improved SELECT policy that properly handles all roles
CREATE POLICY "test_reports_select_access" 
ON test_reports 
FOR SELECT 
USING (
  -- Super admins can see everything
  is_super_admin(auth.uid())
  OR
  -- Company admins and admins can see all reports in their company
  EXISTS (
    SELECT 1 
    FROM profiles p
    JOIN projects pr ON pr.company_id = p.company_id
    WHERE p.user_id = auth.uid() 
    AND pr.id = test_reports.project_id
    AND p.role IN ('admin', 'company_admin')
  )
  OR
  -- Project managers can see reports in their assigned projects
  EXISTS (
    SELECT 1 
    FROM profiles p
    JOIN project_members pm ON pm.user_id = p.user_id
    WHERE p.user_id = auth.uid() 
    AND pm.project_id = test_reports.project_id
    AND p.role = 'project_manager'
  )
  OR
  -- Staff/technicians can see reports in their assigned projects
  EXISTS (
    SELECT 1 
    FROM project_members pm
    WHERE pm.user_id = auth.uid() 
    AND pm.project_id = test_reports.project_id
  )
  OR
  -- Users with explicit view permissions
  has_project_permission(auth.uid(), test_reports.project_id, 'test_reports', 'view')
);

-- Also fix the projects SELECT policies to ensure proper visibility
DROP POLICY IF EXISTS "tenant read projects" ON projects;

CREATE POLICY "projects_select_access" 
ON projects 
FOR SELECT 
USING (
  -- Super admins see all
  is_super_admin(auth.uid())
  OR
  -- Company admins/admins see their company's projects
  EXISTS (
    SELECT 1 
    FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.company_id = projects.company_id
    AND p.role IN ('admin', 'company_admin')
  )
  OR
  -- Project members (including project managers) see assigned projects
  EXISTS (
    SELECT 1 
    FROM project_members pm
    WHERE pm.user_id = auth.uid()
    AND pm.project_id = projects.id
  )
);

-- Ensure project_members can be viewed by company admins and project members
DROP POLICY IF EXISTS "project_members_modify_admins" ON project_members;

CREATE POLICY "project_members_select" 
ON project_members 
FOR SELECT 
USING (
  is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 
    FROM profiles p
    JOIN projects pr ON pr.company_id = p.company_id
    WHERE p.user_id = auth.uid()
    AND pr.id = project_members.project_id
    AND p.role IN ('admin', 'company_admin', 'project_manager')
  )
  OR
  project_members.user_id = auth.uid()
);

CREATE POLICY "project_members_modify" 
ON project_members 
FOR ALL 
USING (
  is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 
    FROM profiles p
    JOIN projects pr ON pr.company_id = p.company_id
    WHERE p.user_id = auth.uid()
    AND pr.id = project_members.project_id
    AND p.role IN ('admin', 'company_admin')
  )
);