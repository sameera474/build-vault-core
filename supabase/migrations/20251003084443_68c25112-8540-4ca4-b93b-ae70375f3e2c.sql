-- Allow super admins to view all companies
DROP POLICY IF EXISTS "Super admins can view all companies" ON public.companies;

CREATE POLICY "Super admins can view all companies"
ON public.companies
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));