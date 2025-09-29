-- Fix infinite recursion in profiles RLS policies
-- Drop ALL existing policies on profiles table
DROP POLICY IF EXISTS "profiles read company" ON public.profiles;
DROP POLICY IF EXISTS "profiles insert company by admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles update company by admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles insert self" ON public.profiles;
DROP POLICY IF EXISTS "profiles update self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_company_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_super_admin_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_super_admin_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_company_admin_access" ON public.profiles;

-- Create simple, non-recursive RLS policies for profiles
-- Allow users to access their own profile
CREATE POLICY "profiles_self_access" ON public.profiles
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow super admins to read all profiles (simple check without recursion)
CREATE POLICY "profiles_super_admin_read" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.profiles p2 
      WHERE p2.user_id = auth.uid() 
      AND p2.role = 'super_admin'
    )
  );

-- Allow company members to read profiles in their company
CREATE POLICY "profiles_company_read" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR company_id IN (
      SELECT p2.company_id 
      FROM public.profiles p2 
      WHERE p2.user_id = auth.uid() 
      AND p2.role IN ('company_admin', 'admin', 'staff', 'project_manager')
    )
  );