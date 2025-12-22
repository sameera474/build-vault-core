-- Drop the old restrictive check constraint
ALTER TABLE public.project_members 
DROP CONSTRAINT IF EXISTS project_members_role_check;

-- Add new check constraint that allows all valid roles
ALTER TABLE public.project_members 
ADD CONSTRAINT project_members_role_check 
CHECK (role IN (
  'company_admin', 
  'staff', 
  'project_manager', 
  'quality_manager', 
  'technician', 
  'supervisor',
  'consultant',
  'consultant_engineer',
  'consultant_technician',
  'materials_engineer',
  'admin',
  'client_admin'
));