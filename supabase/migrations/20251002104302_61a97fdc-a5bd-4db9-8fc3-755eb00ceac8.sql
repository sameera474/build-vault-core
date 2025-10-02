-- Phase 1: Create app_role enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM (
    'super_admin',
    'admin', 
    'project_manager',
    'quality_manager',
    'technician',
    'supervisor',
    'consultant_engineer',
    'consultant_technician'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Phase 2: Create user_roles table (security best practice - roles must be in separate table)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Phase 3: Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 
  CASE profiles.role
    WHEN 'company_admin' THEN 'admin'::app_role
    WHEN 'staff' THEN 'technician'::app_role
    ELSE profiles.role::app_role
  END
FROM public.profiles
WHERE profiles.role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Phase 4: Create security definer functions (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'project_manager' THEN 3
      WHEN 'quality_manager' THEN 4
      WHEN 'supervisor' THEN 5
      WHEN 'consultant_engineer' THEN 6
      WHEN 'consultant_technician' THEN 7
      WHEN 'technician' THEN 8
    END
  LIMIT 1;
$$;

-- Phase 5: RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles in their company"
ON public.user_roles
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin')
  AND user_id IN (
    SELECT p2.user_id 
    FROM public.profiles p1, public.profiles p2
    WHERE p1.user_id = auth.uid() AND p2.company_id = p1.company_id
  )
);

CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

-- Phase 6: Drop redundant tables
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.project_roles CASCADE;

-- Phase 7: Drop redundant function
DROP FUNCTION IF EXISTS public.current_user_role() CASCADE;

-- Phase 8: Add comments
COMMENT ON TABLE public.user_roles IS 'CRITICAL SECURITY: Roles MUST be stored in separate table. Never store roles on profiles table to prevent privilege escalation.';
COMMENT ON FUNCTION public.has_role IS 'Security definer function to check user roles without RLS recursion';
COMMENT ON FUNCTION public.get_user_role IS 'Returns user primary role based on hierarchy';