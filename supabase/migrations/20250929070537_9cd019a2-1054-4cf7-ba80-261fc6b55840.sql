-- Fix security warnings by setting search_path for functions

CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_email text;
BEGIN
  -- fetch email from auth.users; this requires security definer
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id;
  NEW.email := COALESCE(v_email, NEW.email);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_company()
RETURNS uuid 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid()
$$;