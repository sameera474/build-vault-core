-- Migration: Fix user_accessible_projects return type to match projects table
-- Date: 2025-11-27
-- Description: The function return type must exactly match the projects table column types

-- First, let's check the actual structure of projects table and recreate the function
DROP FUNCTION IF EXISTS public.user_accessible_projects() CASCADE;

-- Recreate function with correct return type matching projects table
CREATE OR REPLACE FUNCTION public.user_accessible_projects()
RETURNS SETOF public.projects
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
    SELECT proj.*
    FROM public.projects proj
    ORDER BY proj.name;
  ELSE
    -- Regular users see only projects from their company
    RETURN QUERY
    SELECT proj.*
    FROM public.projects proj
    WHERE proj.company_id = v_company_id
    ORDER BY proj.name;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.user_accessible_projects() TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.user_accessible_projects IS 'Returns all projects accessible to the current user. Returns SETOF projects to match table structure exactly.';
