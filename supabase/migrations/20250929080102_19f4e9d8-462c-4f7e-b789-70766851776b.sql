-- ===== RBAC + RLS Implementation for Test Reports =====

-- 1. Create project_members table for project assignments
CREATE TABLE IF NOT EXISTS public.project_members (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('company_admin','staff','project_manager')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  PRIMARY KEY (project_id, user_id)
);

-- Enable RLS on project_members
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- 2. Update profiles table to have proper role constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('super_admin','company_admin','staff','project_manager','admin'));

-- 3. Add created_by to test_reports if missing
ALTER TABLE public.test_reports ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Backfill created_by for existing records (set to current user for now)
UPDATE public.test_reports SET created_by = (
  SELECT user_id FROM public.profiles WHERE company_id = test_reports.company_id LIMIT 1
) WHERE created_by IS NULL;

-- Make created_by NOT NULL going forward
ALTER TABLE public.test_reports ALTER COLUMN created_by SET NOT NULL;

-- Add status constraint to test_reports
ALTER TABLE public.test_reports DROP CONSTRAINT IF EXISTS test_reports_status_check;
ALTER TABLE public.test_reports ADD CONSTRAINT test_reports_status_check 
  CHECK (status IN ('draft','submitted','approved','rejected'));

-- 4. Create helper views for easier policy writing
CREATE OR REPLACE VIEW public.me AS
SELECT 
  u.id as user_id,
  p.company_id,
  p.role
FROM auth.users u
JOIN public.profiles p ON p.user_id = u.id
WHERE u.id = auth.uid();

-- Projects accessible to current user
CREATE OR REPLACE VIEW public.my_projects AS
SELECT DISTINCT pr.*
FROM public.projects pr
JOIN public.me me ON TRUE
LEFT JOIN public.project_members pm ON pm.project_id = pr.id AND pm.user_id = me.user_id
WHERE
  me.role = 'super_admin'
  OR (me.role IN ('company_admin', 'admin') AND pr.company_id = me.company_id)
  OR (me.role IN ('staff','project_manager') AND pm.user_id IS NOT NULL);

-- 5. RLS Policies for profiles
DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
CREATE POLICY "profiles_self_read" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "profiles_company_read" ON public.profiles;
CREATE POLICY "profiles_company_read" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.user_id = auth.uid()
        AND me.company_id = profiles.company_id
        AND me.role IN ('company_admin', 'admin')
    )
  );

DROP POLICY IF EXISTS "profiles_super_admin_read" ON public.profiles;
CREATE POLICY "profiles_super_admin_read" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles me WHERE me.user_id = auth.uid() AND me.role = 'super_admin')
  );

-- 6. RLS Policies for projects
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
      WHERE me.user_id = auth.uid()
        AND (me.role = 'super_admin' OR (me.role IN ('company_admin', 'admin') AND me.company_id = projects.company_id))
    )
  );

-- 7. RLS Policies for project_members
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
        AND (me.role = 'super_admin' OR me.role IN ('company_admin', 'admin'))
        AND pr.id = project_members.project_id
    )
  );

-- 8. RLS Policies for test_reports
DROP POLICY IF EXISTS "reports_select" ON public.test_reports;
CREATE POLICY "reports_select" ON public.test_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.my_projects mp WHERE mp.id = test_reports.project_id)
    OR EXISTS (SELECT 1 FROM public.profiles me WHERE me.user_id = auth.uid() AND me.role = 'super_admin')
  );

DROP POLICY IF EXISTS "reports_insert" ON public.test_reports;
CREATE POLICY "reports_insert" ON public.test_reports
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles me WHERE me.user_id = auth.uid() AND me.role = 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.profiles me
      JOIN public.projects pr ON pr.id = test_reports.project_id
      WHERE me.user_id = auth.uid()
        AND me.company_id = pr.company_id
        AND (
          me.role IN ('company_admin', 'admin')
          OR (me.role = 'staff' AND EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = pr.id AND pm.user_id = me.user_id))
        )
    )
  );

DROP POLICY IF EXISTS "reports_update" ON public.test_reports;
CREATE POLICY "reports_update" ON public.test_reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles me WHERE me.user_id = auth.uid() AND me.role = 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.profiles me
      JOIN public.projects pr ON pr.id = test_reports.project_id
      WHERE me.user_id = auth.uid()
        AND me.company_id = pr.company_id
        AND (
          me.role IN ('company_admin', 'admin')
          OR (me.role = 'staff' AND EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = pr.id AND pm.user_id = me.user_id))
        )
    )
  )
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "reports_delete" ON public.test_reports;
CREATE POLICY "reports_delete" ON public.test_reports
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles me WHERE me.user_id = auth.uid() AND me.role = 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.profiles me
      JOIN public.projects pr ON pr.id = test_reports.project_id
      WHERE me.user_id = auth.uid()
        AND me.company_id = pr.company_id
        AND me.role IN ('company_admin', 'admin')
    )
  );

-- 9. Create approval guard trigger function
CREATE OR REPLACE FUNCTION public.can_approve_reports() 
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;