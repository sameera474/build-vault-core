-- Fix infinite recursion in RLS policies by creating security definer functions
-- These functions bypass RLS and prevent circular dependencies

-- Function to check if user is a member of a specific project
CREATE OR REPLACE FUNCTION public.is_project_member(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM project_members
    WHERE user_id = _user_id 
    AND project_id = _project_id
  );
$$;

-- Function to check if user is company admin for a project
CREATE OR REPLACE FUNCTION public.is_company_admin_for_project(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles p
    JOIN projects pr ON pr.company_id = p.company_id
    WHERE p.user_id = _user_id 
    AND pr.id = _project_id
    AND p.role IN ('admin', 'company_admin')
  );
$$;

-- Function to check if user is project manager for a project
CREATE OR REPLACE FUNCTION public.is_project_manager_for_project(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles p
    JOIN project_members pm ON pm.user_id = p.user_id
    WHERE p.user_id = _user_id 
    AND pm.project_id = _project_id
    AND p.role = 'project_manager'
  );
$$;

-- Function to get all accessible project IDs for a user
CREATE OR REPLACE FUNCTION public.user_accessible_project_ids(_user_id uuid)
RETURNS TABLE(project_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH user_info AS (
    SELECT p.company_id, p.role, p.is_super_admin
    FROM profiles p
    WHERE p.user_id = _user_id
  )
  SELECT DISTINCT pr.id as project_id
  FROM projects pr
  CROSS JOIN user_info ui
  LEFT JOIN project_members pm ON pm.project_id = pr.id AND pm.user_id = _user_id
  WHERE
    ui.is_super_admin = true
    OR (ui.role IN ('company_admin', 'admin') AND pr.company_id = ui.company_id)
    OR pm.user_id IS NOT NULL;
$$;

-- Now recreate the policies using these functions to avoid recursion

-- Fix projects SELECT policy
DROP POLICY IF EXISTS "projects_select_access" ON projects;

CREATE POLICY "projects_select_access" 
ON projects 
FOR SELECT 
USING (
  is_super_admin(auth.uid())
  OR
  projects.id IN (SELECT project_id FROM user_accessible_project_ids(auth.uid()))
);

-- Fix test_reports SELECT policy
DROP POLICY IF EXISTS "test_reports_select_access" ON test_reports;

CREATE POLICY "test_reports_select_access" 
ON test_reports 
FOR SELECT 
USING (
  is_super_admin(auth.uid())
  OR
  is_company_admin_for_project(auth.uid(), test_reports.project_id)
  OR
  is_project_manager_for_project(auth.uid(), test_reports.project_id)
  OR
  is_project_member(auth.uid(), test_reports.project_id)
  OR
  has_project_permission(auth.uid(), test_reports.project_id, 'test_reports', 'view')
);

-- Fix test_reports INSERT policy
DROP POLICY IF EXISTS "test_reports_insert" ON test_reports;

CREATE POLICY "test_reports_insert" 
ON test_reports 
FOR INSERT 
WITH CHECK (
  is_super_admin(auth.uid())
  OR
  is_company_admin_for_project(auth.uid(), test_reports.project_id)
  OR
  is_project_member(auth.uid(), test_reports.project_id)
  OR
  has_project_permission(auth.uid(), test_reports.project_id, 'test_reports', 'create')
);

-- Fix test_reports UPDATE policy
DROP POLICY IF EXISTS "test_reports_update" ON test_reports;

CREATE POLICY "test_reports_update" 
ON test_reports 
FOR UPDATE 
USING (
  is_super_admin(auth.uid())
  OR
  is_company_admin_for_project(auth.uid(), test_reports.project_id)
  OR
  test_reports.created_by = auth.uid()
  OR
  (
    is_project_member(auth.uid(), test_reports.project_id)
    AND has_project_permission(auth.uid(), test_reports.project_id, 'test_reports', 'edit')
  )
);

-- Fix project_members policies
DROP POLICY IF EXISTS "project_members_select" ON project_members;
DROP POLICY IF EXISTS "project_members_modify" ON project_members;

CREATE POLICY "project_members_select" 
ON project_members 
FOR SELECT 
USING (
  is_super_admin(auth.uid())
  OR
  is_company_admin_for_project(auth.uid(), project_members.project_id)
  OR
  is_project_manager_for_project(auth.uid(), project_members.project_id)
  OR
  project_members.user_id = auth.uid()
);

CREATE POLICY "project_members_modify" 
ON project_members 
FOR ALL 
USING (
  is_super_admin(auth.uid())
  OR
  is_company_admin_for_project(auth.uid(), project_members.project_id)
);

-- Fix project_roads SELECT policy
DROP POLICY IF EXISTS "project_roads_select" ON project_roads;

CREATE POLICY "project_roads_select" 
ON project_roads 
FOR SELECT 
USING (
  is_super_admin(auth.uid())
  OR
  is_project_member(auth.uid(), project_roads.project_id)
  OR
  is_company_admin_for_project(auth.uid(), project_roads.project_id)
);

-- Fix chainage_points policies
DROP POLICY IF EXISTS "chainage_points_select" ON chainage_points;
DROP POLICY IF EXISTS "chainage_points_insert" ON chainage_points;

CREATE POLICY "chainage_points_select" 
ON chainage_points 
FOR SELECT 
USING (
  is_super_admin(auth.uid())
  OR
  (chainage_points.project_id IS NOT NULL AND is_project_member(auth.uid(), chainage_points.project_id))
  OR
  (chainage_points.project_id IS NOT NULL AND is_company_admin_for_project(auth.uid(), chainage_points.project_id))
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() AND p.company_id = chainage_points.company_id
  )
);

CREATE POLICY "chainage_points_insert" 
ON chainage_points 
FOR INSERT 
WITH CHECK (
  is_super_admin(auth.uid())
  OR
  (chainage_points.project_id IS NOT NULL AND is_project_member(auth.uid(), chainage_points.project_id))
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() AND p.company_id = chainage_points.company_id
  )
);

-- Fix laboratory_inventory SELECT policy
DROP POLICY IF EXISTS "laboratory_inventory_select" ON laboratory_inventory;

CREATE POLICY "laboratory_inventory_select" 
ON laboratory_inventory 
FOR SELECT 
USING (
  is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() AND p.company_id = laboratory_inventory.company_id
  )
  OR
  (
    laboratory_inventory.project_id IS NOT NULL
    AND is_project_member(auth.uid(), laboratory_inventory.project_id)
  )
);

-- Fix construction_layers SELECT policy
DROP POLICY IF EXISTS "construction_layers_select" ON construction_layers;

CREATE POLICY "construction_layers_select" 
ON construction_layers 
FOR SELECT 
USING (
  is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() AND p.company_id = construction_layers.company_id
  )
);

-- Fix templates SELECT policy
DROP POLICY IF EXISTS "templates_select" ON templates;

CREATE POLICY "templates_select" 
ON templates 
FOR SELECT 
USING (
  is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() AND p.company_id = templates.company_id
  )
);

-- Fix test_report_templates SELECT policy
DROP POLICY IF EXISTS "test_report_templates_select" ON test_report_templates;

CREATE POLICY "test_report_templates_select" 
ON test_report_templates 
FOR SELECT 
USING (
  is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() AND p.company_id = test_report_templates.company_id
  )
);