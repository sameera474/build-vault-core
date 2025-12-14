-- Drop the existing check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tenant_role_check;

-- Add a new check constraint with all valid roles
ALTER TABLE public.profiles ADD CONSTRAINT profiles_tenant_role_check 
CHECK (tenant_role IN (
  'super_admin',
  'admin',
  'project_manager',
  'quality_manager',
  'technician',
  'supervisor',
  'consultant_engineer',
  'consultant_technician',
  'client_admin'
));