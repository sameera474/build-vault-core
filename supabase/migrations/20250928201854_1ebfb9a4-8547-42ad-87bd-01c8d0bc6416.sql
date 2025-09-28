-- Update the handle_new_user function to create a company record when registering
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  company_uuid uuid;
  company_name_val text;
BEGIN
  -- Get company name from user metadata
  company_name_val := COALESCE(NEW.raw_user_meta_data->>'company_name', 'Default Company');
  
  -- Create company if company_name is provided, otherwise generate a new one
  IF NEW.raw_user_meta_data->>'company_name' IS NOT NULL THEN
    INSERT INTO public.companies (name)
    VALUES (company_name_val)
    RETURNING id INTO company_uuid;
  ELSE
    -- Generate new company ID for existing behavior
    company_uuid := gen_random_uuid();
  END IF;

  -- Insert user profile
  INSERT INTO public.profiles (user_id, company_id, name, role)
  VALUES (
    NEW.id,
    company_uuid,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'admin'
  );
  
  RETURN NEW;
END;
$$;