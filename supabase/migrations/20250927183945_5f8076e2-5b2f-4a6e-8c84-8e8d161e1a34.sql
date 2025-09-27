-- Fix search path security issue for existing functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, company_id, name, role)
  VALUES (
    NEW.id,
    gen_random_uuid(), -- Generate new company ID for each user
    COALESCE(NEW.raw_user_meta_data->>'name', ''), -- Extract name from metadata
    'admin'
  );
  RETURN NEW;
END;
$$;