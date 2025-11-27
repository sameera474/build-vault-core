-- Migration: Grant technicians access to monthly summaries and bar chart data
-- Date: 2025-11-27
-- Description: Ensures technicians can read test_reports, project_roads, and projects for summaries and barchart

-- The existing RLS policies on test_reports, project_roads, and projects already allow
-- users within the same company to read data. These policies typically check:
--   1. User belongs to same company (via profiles.company_id)
--   2. OR user is super_admin
--
-- Since technicians are assigned to projects and belong to companies, they should
-- already have access via the company-scoped RLS policies.
--
-- This migration confirms that the current RLS policies are sufficient for technicians
-- to access monthly summaries and bar chart data.

-- Verify test_reports has company-scoped read policy
DO $$
BEGIN
  -- Check if a SELECT policy exists that allows same-company access
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'test_reports' 
      AND cmd = 'SELECT'
      AND policyname ILIKE '%company%'
  ) THEN
    -- If no company-level read policy exists, create one
    -- This allows any authenticated user to read test_reports from their company
    CREATE POLICY "Users can view test reports from their company"
      ON public.test_reports
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          JOIN public.projects proj ON proj.company_id = p.company_id
          WHERE p.user_id = auth.uid()
            AND proj.id = test_reports.project_id
        )
        OR public.is_super_admin(auth.uid()) = true
      );
    RAISE NOTICE 'Created company-scoped read policy for test_reports';
  ELSE
    RAISE NOTICE 'Company-scoped read policy already exists for test_reports';
  END IF;
END $$;

-- Verify project_roads has company-scoped read policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'project_roads' 
      AND cmd = 'SELECT'
      AND policyname ILIKE '%company%'
  ) THEN
    -- Create company-level read policy for project_roads
    CREATE POLICY "Users can view project roads from their company"
      ON public.project_roads
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          JOIN public.projects proj ON proj.company_id = p.company_id
          WHERE p.user_id = auth.uid()
            AND proj.id = project_roads.project_id
        )
        OR public.is_super_admin(auth.uid()) = true
      );
    RAISE NOTICE 'Created company-scoped read policy for project_roads';
  ELSE
    RAISE NOTICE 'Company-scoped read policy already exists for project_roads';
  END IF;
END $$;

-- Verify projects has company-scoped read policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'projects' 
      AND cmd = 'SELECT'
      AND policyname ILIKE '%company%'
  ) THEN
    -- Create company-level read policy for projects
    CREATE POLICY "Users can view projects from their company"
      ON public.projects
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.user_id = auth.uid()
            AND profiles.company_id = projects.company_id
        )
        OR public.is_super_admin(auth.uid()) = true
      );
    RAISE NOTICE 'Created company-scoped read policy for projects';
  ELSE
    RAISE NOTICE 'Company-scoped read policy already exists for projects';
  END IF;
END $$;

-- Summary comment
COMMENT ON TABLE public.test_reports IS 'Test reports table. Technicians have read access via company-scoped RLS policies for monthly summaries.';
COMMENT ON TABLE public.project_roads IS 'Project roads/chainage table. Technicians have read access via company-scoped RLS policies for bar charts.';
COMMENT ON TABLE public.projects IS 'Projects table. Technicians have read access via company-scoped RLS policies.';
