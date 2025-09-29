-- Fix infinite recursion in profiles RLS policies
-- Drop ALL existing policies on profiles table to start fresh
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
DROP POLICY IF EXISTS "profiles read self" ON public.profiles;

-- Create simple, non-recursive RLS policies for profiles
-- Allow users to access their own profile
CREATE POLICY "profiles_self_access" ON public.profiles
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow super admins to read all profiles (using security definer function to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid 
    AND is_super_admin = true
  );
$$;

-- Super admin read policy using security definer function
CREATE POLICY "profiles_super_admin_read" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR public.is_super_admin(auth.uid())
  );

-- Company members can read profiles in their company (using security definer function)
CREATE OR REPLACE FUNCTION public.get_user_company(user_uuid uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles 
  WHERE user_id = user_uuid;
$$;

CREATE POLICY "profiles_company_read" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR company_id = public.get_user_company(auth.uid())
  );