-- Fix security definer function by adding proper search path
CREATE OR REPLACE FUNCTION public.current_user_company()
RETURNS uuid 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
$$;