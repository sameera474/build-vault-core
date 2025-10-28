-- Fix function search path mutable warning
-- Ensure all security definer functions have immutable search_path

-- Update has_project_permission to ensure search_path is properly set
CREATE OR REPLACE FUNCTION public.has_project_permission(
  _user_id uuid,
  _project_id uuid,
  _module_name text,
  _permission_type text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  has_perm boolean;
BEGIN
  IF is_super_admin(_user_id) THEN
    RETURN true;
  END IF;

  IF EXISTS (
    SELECT 1 FROM profiles p
    JOIN projects pr ON pr.company_id = p.company_id
    WHERE p.user_id = _user_id 
    AND pr.id = _project_id
    AND p.role IN ('admin', 'company_admin')
  ) THEN
    RETURN true;
  END IF;

  EXECUTE format(
    'SELECT COALESCE(can_%I, false) FROM user_project_permissions 
     WHERE user_id = $1 AND project_id = $2 AND module_name = $3 
     AND (expires_at IS NULL OR expires_at > now())',
    _permission_type
  ) INTO has_perm USING _user_id, _project_id, _module_name;

  RETURN COALESCE(has_perm, false);
END;
$$;

-- Update log_audit_event to ensure search_path is properly set
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action text,
  _resource_type text,
  _resource_id uuid DEFAULT NULL,
  _details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  log_id uuid;
  user_company_id uuid;
BEGIN
  SELECT company_id INTO user_company_id
  FROM profiles WHERE user_id = auth.uid();

  INSERT INTO audit_logs (
    user_id, company_id, action, resource_type, resource_id, details
  )
  VALUES (
    auth.uid(), user_company_id, _action, _resource_type, _resource_id, _details
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;