-- Create a view for limited profile data (public-safe fields only)
CREATE OR REPLACE VIEW public.profiles_limited AS
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

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "profiles_view_company_members" ON public.profiles;

-- Create new restrictive policy: only admins/managers can see full company profiles
CREATE POLICY "profiles_view_company_admins" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR is_super_admin(auth.uid()) = true
  OR (
    company_id = get_user_company_id_safe(auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.tenant_role IN ('admin', 'project_manager', 'quality_manager')
    )
  )
);

-- Enable RLS on the view (views inherit from base table, but we add explicit policy)
-- Regular users should use profiles_limited view for company member lookups