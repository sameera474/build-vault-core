
-- Update the can_approve_reports function to allow quality_manager and project_manager to approve
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
  -- Get current user's role and company (using tenant_role)
  SELECT tenant_role, company_id INTO me_role, me_company
  FROM public.profiles WHERE user_id = auth.uid();

  -- Get report's company via project
  SELECT company_id INTO report_company
  FROM public.projects WHERE id = NEW.project_id;

  -- Allow super_admin, admin, quality_manager, project_manager, and supervisor to approve/reject
  IF (NEW.status IN ('approved','rejected')) THEN
    IF NOT (
      me_role = 'super_admin'
      OR (me_role IN ('admin', 'quality_manager', 'project_manager', 'supervisor') AND me_company = report_company)
    ) THEN
      RAISE EXCEPTION 'Not authorized to approve/reject reports';
    END IF;
  END IF;

  -- Staff/technician can only change draft <-> submitted when member of project or from same company
  IF (NEW.status IN ('draft','submitted') AND me_role IN ('staff', 'technician')) THEN
    IF NOT (
      me_company = report_company
      OR EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = NEW.project_id AND pm.user_id = auth.uid()
      )
    ) THEN
      RAISE EXCEPTION 'Not authorized to update this report';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
