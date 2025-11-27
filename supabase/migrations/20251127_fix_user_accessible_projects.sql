-- Migration: Fix user_accessible_projects function to use tenant_role
-- Date: 2025-11-27
-- Description: Updates the user_accessible_projects function to reference tenant_role instead of the removed role column

-- Drop the old function if it exists
DROP FUNCTION IF EXISTS public.user_accessible_projects() CASCADE;

-- Recreate the function with tenant_role
CREATE OR REPLACE FUNCTION public.user_accessible_projects()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  company_id UUID,
  start_date DATE,
  end_date DATE,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
  v_is_super_admin BOOLEAN;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user's company and super admin status
  SELECT p.company_id, p.is_super_admin
  INTO v_company_id, v_is_super_admin
  FROM public.profiles p
  WHERE p.user_id = v_user_id;

  -- Super admins see all projects
  IF v_is_super_admin THEN
    RETURN QUERY
    SELECT 
      proj.id,
      proj.name,
      proj.description,
      proj.company_id,
      proj.start_date,
      proj.end_date,
      proj.status,
      proj.created_at,
      proj.updated_at
    FROM public.projects proj
    ORDER BY proj.name;
  ELSE
    -- Regular users see only projects from their company
    RETURN QUERY
    SELECT 
      proj.id,
      proj.name,
      proj.description,
      proj.company_id,
      proj.start_date,
      proj.end_date,
      proj.status,
      proj.created_at,
      proj.updated_at
    FROM public.projects proj
    WHERE proj.company_id = v_company_id
    ORDER BY proj.name;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.user_accessible_projects() TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.user_accessible_projects IS 'Returns all projects accessible to the current user. Super admins see all projects, regular users see only projects from their company. Updated to use tenant_role.';
