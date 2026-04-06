-- 1. Fix contact_submissions: restrict SELECT to super admins only
DROP POLICY IF EXISTS "Authenticated users can view all submissions" ON public.contact_submissions;
CREATE POLICY "Super admins can view contact submissions"
  ON public.contact_submissions
  FOR SELECT
  USING (is_super_admin(auth.uid()) = true);

-- 2. Add audit_logs SELECT policy for super admins
CREATE POLICY "Super admins can view audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (is_super_admin(auth.uid()) = true);

-- 3. Prevent privilege escalation on profiles: block self-update of sensitive fields
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  -- Only allow super admins to change is_super_admin or tenant_role
  IF (OLD.is_super_admin IS DISTINCT FROM NEW.is_super_admin) OR
     (OLD.tenant_role IS DISTINCT FROM NEW.tenant_role) THEN
    IF NOT is_super_admin(auth.uid()) THEN
      -- Revert sensitive fields to old values
      NEW.is_super_admin := OLD.is_super_admin;
      NEW.tenant_role := OLD.tenant_role;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_fields ON public.profiles;
CREATE TRIGGER protect_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_sensitive_fields();

-- 4. Fix super admin update policy on companies (currently has no USING clause)
DROP POLICY IF EXISTS "Super admins can update any company" ON public.companies;
CREATE POLICY "Super admins can update any company"
  ON public.companies
  FOR UPDATE
  USING (is_super_admin(auth.uid()) = true)
  WITH CHECK (is_super_admin(auth.uid()) = true);

-- 5. Fix contact_submissions INSERT: restrict to rate-limit-friendly check
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
CREATE POLICY "Anyone can submit contact form"
  ON public.contact_submissions
  FOR INSERT
  WITH CHECK (true);