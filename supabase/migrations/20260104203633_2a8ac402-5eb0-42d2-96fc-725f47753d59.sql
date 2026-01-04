-- Fix security definer view issue by recreating with SECURITY INVOKER (default)
DROP VIEW IF EXISTS public.profiles_limited;

CREATE VIEW public.profiles_limited 
WITH (security_invoker = true) AS
SELECT 
  user_id,
  name,
  avatar_url,
  tenant_role,
  department,
  company_id,
  created_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.profiles_limited TO authenticated;