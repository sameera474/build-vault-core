-- Add DELETE policy for super admins on companies table
CREATE POLICY "Super admins can delete any company" 
ON public.companies 
FOR DELETE 
USING (is_super_admin(auth.uid()) = true);