-- Fix infinite recursion in profiles RLS policies
-- Drop problematic policies that cause recursion
DROP POLICY IF EXISTS "profiles read company" ON public.profiles;
DROP POLICY IF EXISTS "profiles insert company by admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles update company by admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles insert self" ON public.profiles;
DROP POLICY IF EXISTS "profiles update self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_company_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_super_admin_read" ON public.profiles;

-- Drop and recreate current_user_info function to be simpler and avoid recursion
DROP FUNCTION IF EXISTS public.current_user_info();

-- Create a simple, non-recursive function to get user info
CREATE OR REPLACE FUNCTION public.current_user_info()
RETURNS TABLE(user_id uuid, company_id uuid, role text)
LANGUAGE sql
STABLE
SECURITY definer
SET search_path = public
AS $$
  SELECT p.user_id, p.company_id, p.role
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
  LIMIT 1;
$$;

-- Create simple, non-recursive RLS policies for profiles
CREATE POLICY "profiles_self_access" ON public.profiles
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow super admins to read all profiles (non-recursive check)
CREATE POLICY "profiles_super_admin_access" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p2 
      WHERE p2.user_id = auth.uid() 
      AND p2.role = 'super_admin'
    )
  );

-- Allow company admins to read profiles in their company (non-recursive check)
CREATE POLICY "profiles_company_admin_access" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT p2.company_id 
      FROM public.profiles p2 
      WHERE p2.user_id = auth.uid() 
      AND p2.role IN ('company_admin', 'admin')
    )
  );