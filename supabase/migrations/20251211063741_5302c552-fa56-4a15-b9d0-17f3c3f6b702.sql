-- Fix all functions that reference the old 'role' column to use 'tenant_role' instead

-- 1. Fix can_approve_reports trigger function
CREATE OR REPLACE FUNCTION can_approve_reports()
RETURNS TRIGGER AS $$
DECLARE 
  me_role TEXT;
  me_company UUID;
  report_company UUID;
BEGIN
  -- Get current user's role and company (using tenant_role now)
  SELECT tenant_role, company_id INTO me_role, me_company
  FROM public.profiles WHERE user_id = auth.uid();

  -- Get report's company
  SELECT company_id INTO report_company
  FROM public.projects WHERE id = NEW.project_id;

  -- Only super_admin or company_admin from same company can set approved/rejected
  IF (NEW.status IN ('approved','rejected')) THEN
    IF NOT (
      me_role = 'super_admin'
      OR (me_role IN ('company_admin', 'admin') AND me_company = report_company)
    ) THEN
      RAISE EXCEPTION 'Not authorized to approve/reject reports';
    END IF;
  END IF;

  -- staff can change draft <-> submitted only when member of project
  IF (NEW.status IN ('draft','submitted') AND me_role = 'staff') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.project_members pm 
      WHERE pm.project_id = NEW.project_id AND pm.user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Not authorized to update this report';
    END IF;
  END IF;

  -- project_manager cannot update
  IF (me_role = 'project_manager') THEN
    RAISE EXCEPTION 'Project managers have view-only access';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Fix has_project_permission function
CREATE OR REPLACE FUNCTION has_project_permission(
  _user_id UUID,
  _project_id UUID,
  _module_name TEXT,
  _permission_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  has_perm boolean;
BEGIN
  IF is_super_admin(_user_id) THEN
    RETURN true;
  END IF;

  -- Check for admin role using tenant_role
  IF EXISTS (
    SELECT 1 FROM profiles p
    JOIN projects pr ON pr.company_id = p.company_id
    WHERE p.user_id = _user_id 
    AND pr.id = _project_id
    AND p.tenant_role IN ('admin', 'company_admin')
  ) THEN
    RETURN true;
  END IF;

  EXECUTE format(
    'SELECT COALESCE(can_%I, false) FROM user_project_permissions 
     WHERE user_id = $1 AND project_id = $2 AND module_name = $3 
     AND (expires_at IS NULL OR expires_at > now())',
    _permission_type
  ) INTO has_perm USING _user_id, _project_id, _module_name;

  RETURN COALESCE(has_perm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Fix current_user_info function
CREATE OR REPLACE FUNCTION current_user_info()
RETURNS TABLE(user_id UUID, company_id UUID, role TEXT) AS $$
  SELECT p.user_id, p.company_id, p.tenant_role as role
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 4. Fix is_company_admin_for_project function
CREATE OR REPLACE FUNCTION is_company_admin_for_project(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles p
    JOIN projects pr ON pr.company_id = p.company_id
    WHERE p.user_id = _user_id 
    AND pr.id = _project_id
    AND p.tenant_role IN ('admin', 'company_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 5. Fix is_project_manager_for_project function
CREATE OR REPLACE FUNCTION is_project_manager_for_project(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles p
    JOIN project_members pm ON pm.user_id = p.user_id
    WHERE p.user_id = _user_id 
    AND pm.project_id = _project_id
    AND p.tenant_role = 'project_manager'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 6. Fix user_accessible_project_ids function
CREATE OR REPLACE FUNCTION user_accessible_project_ids(_user_id UUID)
RETURNS TABLE(project_id UUID) AS $$
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
    -- company-level visibility for admins and PMs
    OR (ui.role IN ('company_admin', 'admin', 'project_manager') AND pr.company_id = ui.company_id)
    -- any explicit assignment still works for other roles
    OR pm.user_id IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 7. Fix user_can_access_project function
CREATE OR REPLACE FUNCTION user_can_access_project(user_uuid UUID, project_uuid UUID)
RETURNS BOOLEAN AS $$
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
      OR (ui.role IN ('staff', 'project_manager', 'technician', 'supervisor', 'quality_manager') AND EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = project_uuid AND pm.user_id = user_uuid
      ))
    )
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 8. Fix user_can_modify_report function
CREATE OR REPLACE FUNCTION user_can_modify_report(user_uuid UUID, project_uuid UUID)
RETURNS BOOLEAN AS $$
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
      OR (ui.role IN ('staff', 'technician', 'supervisor') AND EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = project_uuid AND pm.user_id = user_uuid
      ))
    )
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;