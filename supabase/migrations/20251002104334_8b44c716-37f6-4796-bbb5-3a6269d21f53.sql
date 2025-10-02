-- Fix security linter warnings by dropping SECURITY DEFINER views
-- These views bypass RLS and pose security risks

-- Drop security definer views (we have equivalent functions already)
DROP VIEW IF EXISTS public.companies_for_registration CASCADE;
DROP VIEW IF EXISTS public.me CASCADE;
DROP VIEW IF EXISTS public.my_projects CASCADE;

-- Create safer alternatives as regular views (not SECURITY DEFINER)

-- Replacement for companies_for_registration: simple query on companies table
-- Users can query companies table directly with RLS
CREATE OR REPLACE VIEW public.companies_for_registration AS
SELECT id, name, description, city, country, website
FROM public.companies
WHERE is_active = true;

-- Replacement for 'me' view: use the security definer function instead
-- Frontend should call: SELECT * FROM current_user_info()

-- Replacement for 'my_projects' view: use the security definer function instead  
-- Frontend should call: SELECT * FROM user_accessible_projects()

-- Add RLS to the new view
ALTER VIEW public.companies_for_registration SET (security_invoker = true);

COMMENT ON VIEW public.companies_for_registration IS 'Public view of active companies for registration. Uses security_invoker to respect RLS.';

-- Note: The leaked password protection warning must be fixed in Supabase Auth settings
-- Go to: Authentication > Policies > Password Strength and enable leaked password protection