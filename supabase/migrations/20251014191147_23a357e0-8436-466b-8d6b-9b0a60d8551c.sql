-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate improved handle_new_user function with better company handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  company_uuid uuid;
  company_name_val text;
  selected_company_id text;
  user_role text;
BEGIN
  -- Get role from metadata (default to 'admin' for new signups)
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');

  -- Check if user selected existing company
  selected_company_id := NEW.raw_user_meta_data->>'company_id';
  
  IF selected_company_id IS NOT NULL AND selected_company_id != '' THEN
    -- User selected existing company - use it directly
    company_uuid := selected_company_id::uuid;
    
    -- Verify the company exists and is active
    IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = company_uuid AND is_active = true) THEN
      RAISE EXCEPTION 'Selected company does not exist or is not active';
    END IF;
  ELSE
    -- Create new company with provided details
    company_name_val := COALESCE(NEW.raw_user_meta_data->>'company_name', 'New Company');
    
    INSERT INTO public.companies (
      name, 
      description, 
      website,
      city,
      country,
      is_active
    )
    VALUES (
      company_name_val,
      COALESCE(NEW.raw_user_meta_data->>'company_description', 'Company created during user registration'),
      COALESCE(NEW.raw_user_meta_data->>'company_website', NULL),
      COALESCE(NEW.raw_user_meta_data->>'company_city', NULL),
      'South Africa',
      true
    )
    RETURNING id INTO company_uuid;
  END IF;

  -- Insert user profile with the correct company_id
  INSERT INTO public.profiles (
    user_id, 
    company_id, 
    name, 
    role,
    job_title,
    phone,
    department,
    is_active
  )
  VALUES (
    NEW.id,
    company_uuid,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    user_role,
    COALESCE(NEW.raw_user_meta_data->>'job_title', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    true
  );

  -- Insert into user_roles table for RBAC system
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies to ensure company data visibility
-- Drop and recreate profiles policies for better company data sharing
DROP POLICY IF EXISTS "Users can view company profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Allow users to view all profiles in their company
CREATE POLICY "Users can view profiles in their company"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
  OR user_id = auth.uid()
);

-- Ensure test_reports are visible across the company
DROP POLICY IF EXISTS "test_reports_select_rbac" ON public.test_reports;

CREATE POLICY "test_reports_select_rbac"
ON public.test_reports
FOR SELECT
TO authenticated
USING (
  -- Super admin can see all
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_super_admin = true)
  OR
  -- Users can see reports from their company's projects
  project_id IN (
    SELECT p.id FROM public.projects p
    INNER JOIN public.profiles prof ON prof.company_id = p.company_id
    WHERE prof.user_id = auth.uid()
  )
  OR
  -- Users can see reports from projects they're members of
  project_id IN (
    SELECT pm.project_id FROM public.project_members pm
    WHERE pm.user_id = auth.uid()
  )
);