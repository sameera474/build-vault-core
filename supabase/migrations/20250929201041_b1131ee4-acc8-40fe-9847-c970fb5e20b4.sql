-- ====================================================
-- RBAC + RLS for Test Reports (Fixed)
-- ====================================================

-- 1. Drop existing views if they exist
DROP VIEW IF EXISTS public.my_projects CASCADE;
DROP VIEW IF EXISTS public.me CASCADE;

-- 2. Create project_members table for role assignments
CREATE TABLE IF NOT EXISTS public.project_members (
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('company_admin','staff','project_manager')),
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- 3. Ensure test_reports has created_by column
ALTER TABLE public.test_reports 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- 4. Create helper views for permission checks

-- View: current user info
CREATE OR REPLACE VIEW public.me AS
SELECT 
  p.user_id,
  p.company_id,
  p.role
FROM public.profiles p
WHERE p.user_id = auth.uid();

-- View: projects accessible to current user
CREATE OR REPLACE VIEW public.my_projects AS
SELECT DISTINCT
  pr.id,
  pr.name,
  pr.description,
  pr.company_id,
  pr.status,
  pr.location,
  pr.start_date,
  pr.end_date,
  pr.created_at,
  pr.updated_at,
  pr.created_by,
  pr.contract_number,
  pr.project_prefix,
  pr.region_code,
  pr.lab_code,
  pr.client_name,
  pr.client_logo,
  pr.contractor_name,
  pr.contractor_logo,
  pr.consultant_name,
  pr.consultant_logo
FROM public.projects pr
CROSS JOIN public.me
LEFT JOIN public.project_members pm 
  ON pm.project_id = pr.id AND pm.user_id = me.user_id
WHERE
  me.role = 'super_admin'
  OR (me.role IN ('company_admin', 'admin') AND pr.company_id = me.company_id)
  OR (me.role IN ('staff','project_manager') AND pm.user_id IS NOT NULL);

-- 5. Helper functions for permission checks

-- Function: get user's company
CREATE OR REPLACE FUNCTION public.get_user_company(user_uuid uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles 
  WHERE user_id = user_uuid;
$$;

-- Function: check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid 
    AND is_super_admin = true
  );
$$;

-- Function: check if user can access project
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

-- Function: check if user can modify report
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

-- 6. RLS Policies for profiles

DROP POLICY IF EXISTS "profiles_self_access" ON public.profiles;
CREATE POLICY "profiles_self_access" ON public.profiles
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "profiles_company_read" ON public.profiles;
CREATE POLICY "profiles_company_read" ON public.profiles
FOR SELECT USING (
  user_id = auth.uid()
  OR company_id = get_user_company(auth.uid())
);

DROP POLICY IF EXISTS "profiles_super_admin_read" ON public.profiles;
CREATE POLICY "profiles_super_admin_read" ON public.profiles
FOR SELECT USING (
  user_id = auth.uid()
  OR is_super_admin(auth.uid())
);

-- 7. RLS Policies for projects

DROP POLICY IF EXISTS "projects_select" ON public.projects;
CREATE POLICY "projects_select" ON public.projects
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.my_projects mp WHERE mp.id = projects.id)
);

DROP POLICY IF EXISTS "projects_modify_admins" ON public.projects;
CREATE POLICY "projects_modify_admins" ON public.projects
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles me
    JOIN public.projects pr ON pr.id = projects.id
    WHERE me.user_id = auth.uid()
      AND (
        me.is_super_admin = true 
        OR (me.role IN ('company_admin', 'admin') AND pr.company_id = me.company_id)
      )
  )
);

-- 8. RLS Policies for project_members

DROP POLICY IF EXISTS "project_members_select" ON public.project_members;
CREATE POLICY "project_members_select" ON public.project_members
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.my_projects mp WHERE mp.id = project_members.project_id)
);

DROP POLICY IF EXISTS "project_members_modify_admins" ON public.project_members;
CREATE POLICY "project_members_modify_admins" ON public.project_members
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles me
    JOIN public.projects pr ON pr.company_id = me.company_id
    WHERE me.user_id = auth.uid()
      AND (me.is_super_admin = true OR me.role IN ('company_admin', 'admin'))
      AND pr.id = project_members.project_id
  )
);

-- 9. RLS Policies for test_reports

DROP POLICY IF EXISTS "test_reports_select_rbac" ON public.test_reports;
CREATE POLICY "test_reports_select_rbac" ON public.test_reports
FOR SELECT USING (
  user_can_access_project(auth.uid(), project_id)
);

DROP POLICY IF EXISTS "test_reports_insert_rbac" ON public.test_reports;
CREATE POLICY "test_reports_insert_rbac" ON public.test_reports
FOR INSERT WITH CHECK (
  user_can_modify_report(auth.uid(), project_id)
);

DROP POLICY IF EXISTS "test_reports_update_rbac" ON public.test_reports;
CREATE POLICY "test_reports_update_rbac" ON public.test_reports
FOR UPDATE USING (
  user_can_modify_report(auth.uid(), project_id)
);

DROP POLICY IF EXISTS "test_reports_delete_rbac" ON public.test_reports;
CREATE POLICY "test_reports_delete_rbac" ON public.test_reports
FOR DELETE USING (
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

-- 10. Trigger function to enforce approval permissions

CREATE OR REPLACE FUNCTION public.can_approve_reports()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE 
  me_role TEXT;
  me_company UUID;
  report_company UUID;
BEGIN
  -- Get current user's role and company
  SELECT role, company_id INTO me_role, me_company
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
$$;

DROP TRIGGER IF EXISTS trg_reports_guard ON public.test_reports;
CREATE TRIGGER trg_reports_guard
BEFORE UPDATE ON public.test_reports
FOR EACH ROW EXECUTE FUNCTION public.can_approve_reports();