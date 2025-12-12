-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create an improved handle_new_user function that properly handles company creation/association
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_company_name text;
  v_existing_company_id uuid;
  v_role text;
BEGIN
  -- Check if user wants to join an existing company
  v_existing_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
  
  -- Check if user wants to create a new company
  v_company_name := NEW.raw_user_meta_data->>'company_name';
  
  -- Get the role from metadata, default to 'technician'
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'technician');
  
  -- Determine company_id
  IF v_existing_company_id IS NOT NULL THEN
    -- User selected an existing company
    v_company_id := v_existing_company_id;
  ELSIF v_company_name IS NOT NULL AND v_company_name != '' THEN
    -- User wants to create a new company
    INSERT INTO public.companies (
      name,
      description,
      website,
      city,
      is_active
    ) VALUES (
      v_company_name,
      COALESCE(NEW.raw_user_meta_data->>'company_description', ''),
      COALESCE(NEW.raw_user_meta_data->>'company_website', ''),
      COALESCE(NEW.raw_user_meta_data->>'company_city', ''),
      true
    )
    RETURNING id INTO v_company_id;
  END IF;
  
  -- Insert into profiles
  INSERT INTO public.profiles (
    user_id,
    email,
    name,
    tenant_role,
    company_id,
    phone,
    department,
    is_super_admin
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    v_role,
    v_company_id,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    false
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    company_id = COALESCE(EXCLUDED.company_id, profiles.company_id),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    department = COALESCE(EXCLUDED.department, profiles.department),
    updated_at = now();
  
  -- Insert user role into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();