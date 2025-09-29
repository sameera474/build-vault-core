-- Check for any existing security definer views and fix them
-- First, let's drop the view entirely and recreate without any security definer
DROP VIEW IF EXISTS public.companies_for_registration CASCADE;
DROP VIEW IF EXISTS public.company_users CASCADE;

-- Ensure there are no lingering security definer views
-- Re-create the companies view as a simple view
CREATE VIEW public.companies_for_registration AS
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

-- Remove any conflicting RLS policies that might cause issues
DROP POLICY IF EXISTS "Anyone can view companies for registration" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can view active companies" ON public.companies;

-- Create a single, clear policy for company access
CREATE POLICY "Public can view active companies for registration" 
ON public.companies 
FOR SELECT 
USING (is_active = true);

-- Ensure unauthenticated users can also see companies for registration
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;