-- Add DELETE policy for super admins on companies table
CREATE POLICY "Super admins can delete companies"
ON public.companies
FOR DELETE
TO authenticated
USING (is_super_admin(auth.uid()));