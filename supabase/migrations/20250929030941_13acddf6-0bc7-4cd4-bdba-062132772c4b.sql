-- Remove the problematic security definer view and create a regular view instead
DROP VIEW IF EXISTS public.companies_for_registration;

-- Create a regular view without security definer
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

-- Add RLS policy for the view access
CREATE POLICY "Anyone can view companies for registration" 
ON public.companies 
FOR SELECT 
USING (is_active = true);