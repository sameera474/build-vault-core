-- Update handle_new_user function to insert into user_roles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public 
AS $$
DECLARE
  company_uuid uuid;
  company_name_val text;
  selected_company_id text;
  user_role text;
BEGIN
  -- Check if user selected existing company
  selected_company_id := NEW.raw_user_meta_data->>'company_id';
  
  IF selected_company_id IS NOT NULL AND selected_company_id != '' THEN
    -- User selected existing company
    company_uuid := selected_company_id::uuid;
  ELSE
    -- Create new company
    company_name_val := COALESCE(NEW.raw_user_meta_data->>'company_name', 'New Company');
    
    INSERT INTO public.companies (name, description, country, is_active)
    VALUES (
      company_name_val,
      'Company created during user registration',
      'South Africa',
      true
    )
    RETURNING id INTO company_uuid;
  END IF;

  -- Get role from metadata (default to 'admin' for new signups)
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');

  -- Insert user profile
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
  -- Cast the role to app_role enum type
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;