-- ============================================
-- USER PERMISSION AND DATA VISIBILITY MODEL
-- ============================================

-- 1. Create granular permissions matrix table
CREATE TABLE IF NOT EXISTS public.user_project_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  module_name text NOT NULL, -- e.g., 'bug_reports', 'test_reports', 'client_feedback'
  can_view boolean DEFAULT false,
  can_create boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  can_approve boolean DEFAULT false,
  granted_by uuid NOT NULL,
  granted_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, project_id, module_name)
);

-- 2. Create audit log table for all user actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  action text NOT NULL, -- e.g., 'create_report', 'update_bug', 'grant_permission'
  resource_type text NOT NULL, -- e.g., 'test_report', 'bug', 'permission'
  resource_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Enable RLS on new tables
ALTER TABLE public.user_project_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for user_project_permissions

-- Super admins can view all permissions
CREATE POLICY "Super admins can view all permissions"
ON public.user_project_permissions
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Company admins can view permissions within their company
CREATE POLICY "Company admins can view company permissions"
ON public.user_project_permissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('admin', 'company_admin')
    AND p.company_id IN (
      SELECT pr.company_id FROM projects pr WHERE pr.id = user_project_permissions.project_id
    )
  )
);

-- Users can view their own permissions
CREATE POLICY "Users can view own permissions"
ON public.user_project_permissions
FOR SELECT
USING (user_id = auth.uid());

-- Company admins can grant permissions within their company
CREATE POLICY "Company admins can manage company permissions"
ON public.user_project_permissions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('admin', 'company_admin')
    AND p.company_id IN (
      SELECT pr.company_id FROM projects pr WHERE pr.id = user_project_permissions.project_id
    )
  )
);

-- Super admins can manage all permissions
CREATE POLICY "Super admins can manage all permissions"
ON public.user_project_permissions
FOR ALL
USING (is_super_admin(auth.uid()));

-- 5. RLS Policies for audit_logs

-- Super admins can view all audit logs
CREATE POLICY "Super admins can view all audit logs"
ON public.audit_logs
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Company admins can view their company's audit logs
CREATE POLICY "Company admins can view company audit logs"
ON public.audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('admin', 'company_admin')
    AND p.company_id = audit_logs.company_id
  )
);

-- Everyone can insert audit logs (system logging)
CREATE POLICY "Anyone authenticated can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- 6. Create helper function to check granular permissions
CREATE OR REPLACE FUNCTION public.has_project_permission(
  _user_id uuid,
  _project_id uuid,
  _module_name text,
  _permission_type text -- 'view', 'create', 'edit', 'delete', 'approve'
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_perm boolean;
BEGIN
  -- Super admins have all permissions
  IF is_super_admin(_user_id) THEN
    RETURN true;
  END IF;

  -- Check if user is company admin for this project's company
  IF EXISTS (
    SELECT 1 FROM profiles p
    JOIN projects pr ON pr.company_id = p.company_id
    WHERE p.user_id = _user_id 
    AND pr.id = _project_id
    AND p.role IN ('admin', 'company_admin')
  ) THEN
    RETURN true;
  END IF;

  -- Check granular permission
  EXECUTE format(
    'SELECT COALESCE(can_%I, false) FROM user_project_permissions 
     WHERE user_id = $1 AND project_id = $2 AND module_name = $3 
     AND (expires_at IS NULL OR expires_at > now())',
    _permission_type
  ) INTO has_perm USING _user_id, _project_id, _module_name;

  RETURN COALESCE(has_perm, false);
END;
$$;

-- 7. Create function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action text,
  _resource_type text,
  _resource_id uuid DEFAULT NULL,
  _details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
  user_company_id uuid;
  user_project_id uuid;
BEGIN
  -- Get user's company
  SELECT company_id INTO user_company_id
  FROM profiles WHERE user_id = auth.uid();

  -- Insert audit log
  INSERT INTO audit_logs (
    user_id, company_id, action, resource_type, resource_id, details
  )
  VALUES (
    auth.uid(), user_company_id, _action, _resource_type, _resource_id, _details
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;

-- 8. Update test_reports RLS for strict project isolation
DROP POLICY IF EXISTS "test_reports_company_access" ON public.test_reports;

CREATE POLICY "test_reports_strict_project_access"
ON public.test_reports
FOR SELECT
USING (
  -- Super admins see all
  is_super_admin(auth.uid())
  OR
  -- Company admins see their company's reports
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN projects pr ON pr.company_id = p.company_id
    WHERE p.user_id = auth.uid() 
    AND pr.id = test_reports.project_id
    AND p.role IN ('admin', 'company_admin')
  )
  OR
  -- Project members see only their project's reports
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.user_id = auth.uid() 
    AND pm.project_id = test_reports.project_id
  )
  OR
  -- Users with specific permission see reports
  has_project_permission(auth.uid(), test_reports.project_id, 'test_reports', 'view')
);

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_project_permissions_user ON user_project_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_project_permissions_project ON user_project_permissions(project_id);
CREATE INDEX IF NOT EXISTS idx_user_project_permissions_module ON user_project_permissions(module_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_project ON audit_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- 10. Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_project_permissions_updated_at
BEFORE UPDATE ON user_project_permissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();