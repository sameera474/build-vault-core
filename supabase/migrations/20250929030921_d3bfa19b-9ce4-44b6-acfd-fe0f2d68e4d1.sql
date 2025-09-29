-- Update the handle_new_user function to handle company selection vs creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  company_uuid uuid;
  company_name_val text;
  selected_company_id text;
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
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin'),
    COALESCE(NEW.raw_user_meta_data->>'job_title', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    true
  );
  
  RETURN NEW;
END;
$$;

-- Create a view for company selection during registration
CREATE OR REPLACE VIEW public.companies_for_registration AS
SELECT 
  id,
  name,
  description,
  website,
  city,
  country
FROM public.companies
WHERE is_active = true
ORDER BY name;