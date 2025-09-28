-- Ensure handle_new_user always creates a company row
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
  -- Determine company name
  company_name_val := COALESCE(NEW.raw_user_meta_data->>'company_name', 'New Company');

  -- Always create a company row
  INSERT INTO public.companies (name)
  VALUES (company_name_val)
  RETURNING id INTO company_uuid;

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