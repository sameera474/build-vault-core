-- Adjust profiles RLS: split own profile policy and add super admin delete
DROP POLICY IF EXISTS "Users can view and update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admins can delete all profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (is_super_admin(auth.uid()));