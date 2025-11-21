-- Create security definer function to check if user can create project for company
CREATE OR REPLACE FUNCTION public.can_create_project_for_company(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = _user_id 
    AND (is_super_admin = true OR company_id = _company_id)
  );
$$;

-- Drop existing policy
DROP POLICY IF EXISTS "projects_insert" ON public.projects;

-- Create new policy using the function
CREATE POLICY "projects_insert"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
  can_create_project_for_company(auth.uid(), company_id)
);