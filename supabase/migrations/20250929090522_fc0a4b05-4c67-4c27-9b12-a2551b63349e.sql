-- Ensure projects table has proper RLS policies for company scoping

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "projects_modify_admins" ON public.projects;
DROP POLICY IF EXISTS "projects_select" ON public.projects;
DROP POLICY IF EXISTS "tenant delete projects" ON public.projects;
DROP POLICY IF EXISTS "tenant insert projects" ON public.projects;
DROP POLICY IF EXISTS "tenant read projects" ON public.projects;
DROP POLICY IF EXISTS "tenant update projects" ON public.projects;

-- Ensure company_id column exists and is not null
ALTER TABLE public.projects 
  ALTER COLUMN company_id SET NOT NULL;

-- Create helper function for current user's company (if not exists)
CREATE OR REPLACE FUNCTION public.current_user_company()
RETURNS uuid 
LANGUAGE sql 
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Create helper function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql 
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid 
    AND is_super_admin = true
  );
$$;

-- SELECT policy: users can read their company's projects, super admins can read all
CREATE POLICY "tenant read projects"
ON public.projects FOR SELECT
USING (
  company_id = current_user_company() 
  OR is_super_admin(auth.uid())
);

-- INSERT policy: users can only insert for their company, super admins can insert for any company
CREATE POLICY "tenant insert projects"
ON public.projects FOR INSERT
WITH CHECK (
  company_id = current_user_company()
  OR is_super_admin(auth.uid())
);

-- UPDATE policy: users can only update their company's projects, super admins can update any
CREATE POLICY "tenant update projects"
ON public.projects FOR UPDATE
USING (
  company_id = current_user_company()
  OR is_super_admin(auth.uid())
);

-- DELETE policy: users can only delete their company's projects, super admins can delete any
CREATE POLICY "tenant delete projects"
ON public.projects FOR DELETE
USING (
  company_id = current_user_company()
  OR is_super_admin(auth.uid())
);

-- Create index for efficient company-based queries
CREATE INDEX IF NOT EXISTS idx_projects_company ON public.projects(company_id);