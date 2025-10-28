-- Comprehensive fix for project access and report creation for all roles
-- This ensures project managers, technicians, QAM, consultants, etc. can all work properly

-- 1. Fix projects policies - ensure all project members can see their projects
DROP POLICY IF EXISTS "projects_insert_admins" ON projects;
DROP POLICY IF EXISTS "projects_update_admins" ON projects;
DROP POLICY IF EXISTS "projects_delete_admins" ON projects;
DROP POLICY IF EXISTS "tenant insert projects" ON projects;
DROP POLICY IF EXISTS "tenant update projects" ON projects;
DROP POLICY IF EXISTS "tenant delete projects" ON projects;

-- Allow viewing projects for all team members
-- (projects_select_access was already created in previous migration, keep it)

-- Allow company admins to create projects
CREATE POLICY "projects_insert" 
ON projects 
FOR INSERT 
WITH CHECK (
  is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 
    FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.company_id = projects.company_id
    AND p.role IN ('admin', 'company_admin')
  )
);

-- Allow company admins and project managers to update projects
CREATE POLICY "projects_update" 
ON projects 
FOR UPDATE 
USING (
  is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 
    FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.company_id = projects.company_id
    AND p.role IN ('admin', 'company_admin')
  )
  OR
  EXISTS (
    SELECT 1 
    FROM profiles p
    JOIN project_members pm ON pm.user_id = p.user_id
    WHERE p.user_id = auth.uid()
    AND pm.project_id = projects.id
    AND p.role = 'project_manager'
  )
);

-- Allow company admins to delete projects
CREATE POLICY "projects_delete" 
ON projects 
FOR DELETE 
USING (
  is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 
    FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.company_id = projects.company_id
    AND p.role IN ('admin', 'company_admin')
  )
);

-- 2. Fix test_reports INSERT policy - allow all project members to create reports
DROP POLICY IF EXISTS "test_reports_insert_rbac" ON test_reports;

CREATE POLICY "test_reports_insert" 
ON test_reports 
FOR INSERT 
WITH CHECK (
  is_super_admin(auth.uid())
  OR
  -- Company admins can create reports
  EXISTS (
    SELECT 1 
    FROM profiles p
    JOIN projects pr ON pr.company_id = p.company_id
    WHERE p.user_id = auth.uid()
    AND pr.id = test_reports.project_id
    AND p.role IN ('admin', 'company_admin')
  )
  OR
  -- All project members (PM, QAM, technicians, consultants) can create reports
  EXISTS (
    SELECT 1 
    FROM project_members pm
    WHERE pm.user_id = auth.uid()
    AND pm.project_id = test_reports.project_id
  )
  OR
  -- Users with explicit create permission
  has_project_permission(auth.uid(), test_reports.project_id, 'test_reports', 'create')
);

-- 3. Fix test_reports UPDATE policy - allow report creators and managers to update
DROP POLICY IF EXISTS "test_reports_update_rbac" ON test_reports;

CREATE POLICY "test_reports_update" 
ON test_reports 
FOR UPDATE 
USING (
  is_super_admin(auth.uid())
  OR
  -- Company admins can update any report in their company
  EXISTS (
    SELECT 1 
    FROM profiles p
    JOIN projects pr ON pr.company_id = p.company_id
    WHERE p.user_id = auth.uid()
    AND pr.id = test_reports.project_id
    AND p.role IN ('admin', 'company_admin')
  )
  OR
  -- Report creator can update their own report
  test_reports.created_by = auth.uid()
  OR
  -- Project members with edit permission can update
  (
    EXISTS (
      SELECT 1 
      FROM project_members pm
      WHERE pm.user_id = auth.uid()
      AND pm.project_id = test_reports.project_id
    )
    AND has_project_permission(auth.uid(), test_reports.project_id, 'test_reports', 'edit')
  )
);

-- 4. Fix test_reports DELETE policy
DROP POLICY IF EXISTS "test_reports_delete_rbac" ON test_reports;

CREATE POLICY "test_reports_delete" 
ON test_reports 
FOR DELETE 
USING (
  is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 
    FROM profiles p
    JOIN projects pr ON pr.company_id = p.company_id
    WHERE p.user_id = auth.uid()
    AND pr.id = test_reports.project_id
    AND p.role IN ('admin', 'company_admin')
  )
  OR
  -- Report creator can delete their own report if it's still in draft
  (test_reports.created_by = auth.uid() AND test_reports.status = 'draft')
);

-- 5. Fix project_roads access for all project members
CREATE POLICY "project_roads_select" 
ON project_roads 
FOR SELECT 
USING (
  is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 
    FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.company_id = project_roads.company_id
  )
  OR
  EXISTS (
    SELECT 1 
    FROM project_members pm
    WHERE pm.user_id = auth.uid()
    AND pm.project_id = project_roads.project_id
  )
);

-- 6. Fix chainage_points access for all project members
CREATE POLICY "chainage_points_select" 
ON chainage_points 
FOR SELECT 
USING (
  is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 
    FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.company_id = chainage_points.company_id
  )
  OR
  EXISTS (
    SELECT 1 
    FROM project_members pm
    WHERE pm.user_id = auth.uid()
    AND pm.project_id = chainage_points.project_id
  )
);

CREATE POLICY "chainage_points_insert" 
ON chainage_points 
FOR INSERT 
WITH CHECK (
  is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 
    FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.company_id = chainage_points.company_id
  )
  OR
  EXISTS (
    SELECT 1 
    FROM project_members pm
    WHERE pm.user_id = auth.uid()
    AND pm.project_id = chainage_points.project_id
  )
);

-- 7. Fix laboratory_inventory access
CREATE POLICY "laboratory_inventory_select" 
ON laboratory_inventory 
FOR SELECT 
USING (
  is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 
    FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.company_id = laboratory_inventory.company_id
  )
  OR
  (
    laboratory_inventory.project_id IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM project_members pm
      WHERE pm.user_id = auth.uid()
      AND pm.project_id = laboratory_inventory.project_id
    )
  )
);

-- 8. Fix construction_layers access
CREATE POLICY "construction_layers_select" 
ON construction_layers 
FOR SELECT 
USING (
  is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 
    FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.company_id = construction_layers.company_id
  )
);

-- 9. Fix templates access for all company members
CREATE POLICY "templates_select" 
ON templates 
FOR SELECT 
USING (
  is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 
    FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.company_id = templates.company_id
  )
);

-- 10. Fix test_report_templates access
CREATE POLICY "test_report_templates_select" 
ON test_report_templates 
FOR SELECT 
USING (
  is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 
    FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.company_id = test_report_templates.company_id
  )
);