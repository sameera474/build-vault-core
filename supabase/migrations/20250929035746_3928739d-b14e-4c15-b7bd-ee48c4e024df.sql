-- Helper function: get current user's company_id
CREATE OR REPLACE FUNCTION public.current_user_company()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their company projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects for their company" ON public.projects;
DROP POLICY IF EXISTS "Users can update their company projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their company projects" ON public.projects;

-- Enable RLS on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- SELECT policy: users can read their company's projects
CREATE POLICY "tenant read projects"
ON public.projects FOR SELECT
USING (company_id = public.current_user_company());

-- INSERT policy: users can create projects for their company
CREATE POLICY "tenant insert projects"
ON public.projects FOR INSERT
WITH CHECK (company_id = public.current_user_company());

-- UPDATE policy: users can update their company's projects
CREATE POLICY "tenant update projects"
ON public.projects FOR UPDATE
USING (company_id = public.current_user_company());

-- DELETE policy: users can delete their company's projects
CREATE POLICY "tenant delete projects"
ON public.projects FOR DELETE
USING (company_id = public.current_user_company());

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_projects_company ON public.projects(company_id);