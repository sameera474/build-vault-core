-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view company profiles" ON public.profiles;

-- Create a security definer function to get user's company
CREATE OR REPLACE FUNCTION public.get_current_user_company()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id 
  FROM public.profiles 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Recreate the policy using the function
CREATE POLICY "Users can view company profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  company_id = get_current_user_company()
);