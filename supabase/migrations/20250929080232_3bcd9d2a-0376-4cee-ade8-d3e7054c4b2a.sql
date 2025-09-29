-- Fix the return type mismatch in user_accessible_projects function

-- First drop the function with the wrong return type
DROP FUNCTION IF EXISTS public.user_accessible_projects();

-- Create the corrected function with proper UUID types
CREATE OR REPLACE FUNCTION public.user_accessible_projects()
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  company_id UUID,
  status TEXT,
  location TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID,
  contract_number TEXT,
  project_prefix TEXT,
  region_code TEXT,
  lab_code TEXT,
  client_name TEXT,
  client_logo TEXT,
  contractor_name TEXT,
  contractor_logo TEXT,
  consultant_name TEXT,
  consultant_logo TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH user_info AS (
    SELECT p.user_id, p.company_id, p.role
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
  )
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
  CROSS JOIN user_info ui
  LEFT JOIN public.project_members pm ON pm.project_id = pr.id AND pm.user_id = ui.user_id
  WHERE
    ui.role = 'super_admin'
    OR (ui.role IN ('company_admin', 'admin') AND pr.company_id = ui.company_id)
    OR (ui.role IN ('staff','project_manager') AND pm.user_id IS NOT NULL);
$$;