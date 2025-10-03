-- Fix companies RLS policies for super admin updates
DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;
DROP POLICY IF EXISTS "Super admins can update any company" ON public.companies;

-- Regular users can update their own company
CREATE POLICY "Users can update their own company"
ON public.companies
FOR UPDATE
TO authenticated
USING (id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- Super admins can update any company
CREATE POLICY "Super admins can update any company"
ON public.companies
FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));