-- Create security definer function to get user's company (avoids infinite recursion)
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view company and own profiles" ON public.profiles;

-- Recreate policy using the security definer function
CREATE POLICY "Users can view company and own profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  OR user_id = auth.uid()
);