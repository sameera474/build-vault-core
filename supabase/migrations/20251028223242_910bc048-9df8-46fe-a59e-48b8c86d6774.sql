-- Update handle_new_user function to properly handle super admins
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
  is_super_admin_flag boolean;
BEGIN
  -- Check if this is a super admin account
  is_super_admin_flag := COALESCE((NEW.raw_user_meta_data->>'is_super_admin')::boolean, false);
  
  -- Get role from metadata (default to 'admin' for new signups)
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');

  -- Super admins should NOT have a company
  IF is_super_admin_flag THEN
    company_uuid := NULL;
  ELSE
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
  END IF;

  -- Insert user profile with the correct company_id (NULL for super admins)
  INSERT INTO public.profiles (
    user_id, 
    company_id, 
    name, 
    role,
    job_title,
    phone,
    department,
    is_active,
    is_super_admin
  )
  VALUES (
    NEW.id,
    company_uuid,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    user_role,
    COALESCE(NEW.raw_user_meta_data->>'job_title', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    true,
    is_super_admin_flag
  );

  -- Insert into user_roles table for RBAC system
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;