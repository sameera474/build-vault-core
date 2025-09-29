-- Re-tighten RLS: tenant-only, no super admin bypass on client
-- Ensure helper function is defined securely
CREATE OR REPLACE FUNCTION public.current_user_company()
RETURNS uuid 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
$$;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Drop and recreate strict tenant policies
DROP POLICY IF EXISTS "tenant read projects" ON public.projects;
DROP POLICY IF EXISTS "tenant insert projects" ON public.projects;
DROP POLICY IF EXISTS "tenant update projects" ON public.projects;
DROP POLICY IF EXISTS "tenant delete projects" ON public.projects;

CREATE POLICY "tenant read projects"
ON public.projects FOR SELECT
USING (company_id = public.current_user_company());

CREATE POLICY "tenant insert projects"
ON public.projects FOR INSERT
WITH CHECK (company_id = public.current_user_company());

CREATE POLICY "tenant update projects"
ON public.projects FOR UPDATE
USING (company_id = public.current_user_company());

CREATE POLICY "tenant delete projects"
ON public.projects FOR DELETE
USING (company_id = public.current_user_company());

CREATE INDEX IF NOT EXISTS idx_projects_company ON public.projects(company_id);