-- Fix team_invitations table step by step
-- First, drop the check constraint
ALTER TABLE team_invitations DROP CONSTRAINT IF EXISTS team_invitations_role_check;

-- Remove any default value temporarily
ALTER TABLE team_invitations ALTER COLUMN role DROP DEFAULT;

-- Update existing data to use valid tenant role values
UPDATE team_invitations 
SET role = 'technician' 
WHERE role NOT IN ('admin', 'project_manager', 'quality_manager', 'material_engineer', 'technician', 'consultant_engineer', 'consultant_technician');

-- Now change the column type to use the enum
ALTER TABLE team_invitations ALTER COLUMN role TYPE tenant_role USING role::tenant_role;

-- Set a default value
ALTER TABLE team_invitations ALTER COLUMN role SET DEFAULT 'technician'::tenant_role;