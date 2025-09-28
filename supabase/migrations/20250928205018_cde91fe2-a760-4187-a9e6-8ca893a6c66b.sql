-- Create role permissions system
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  permission text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(role, permission)
);

-- Insert role permissions
INSERT INTO role_permissions (role, permission) VALUES 
  -- Super Admin permissions
  ('super_admin', 'view_all_companies'),
  ('super_admin', 'manage_users'),
  ('super_admin', 'view_system_analytics'),
  ('super_admin', 'manage_system_settings'),
  ('super_admin', 'view_all_reports'),
  ('super_admin', 'manage_subscriptions'),
  
  -- Admin permissions
  ('admin', 'manage_company_users'),
  ('admin', 'view_company_reports'),
  ('admin', 'manage_projects'),
  ('admin', 'view_analytics'),
  ('admin', 'export_data'),
  
  -- Project Manager permissions
  ('project_manager', 'view_company_reports'),
  ('project_manager', 'manage_projects'),
  ('project_manager', 'view_analytics'),
  ('project_manager', 'approve_reports'),
  
  -- Quality Manager permissions
  ('quality_manager', 'view_company_reports'),
  ('quality_manager', 'approve_reports'),
  ('quality_manager', 'manage_templates'),
  ('quality_manager', 'view_analytics'),
  
  -- Technician permissions
  ('technician', 'create_reports'),
  ('technician', 'view_own_reports'),
  ('technician', 'edit_own_reports'),
  
  -- Supervisor permissions
  ('supervisor', 'view_company_reports'),
  ('supervisor', 'approve_reports'),
  ('supervisor', 'manage_team_reports');

-- Enable RLS on role_permissions
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Create policy for role_permissions
CREATE POLICY "Anyone can view role permissions" 
ON role_permissions 
FOR SELECT 
USING (true);

-- Update the existing super admin user (your account)
UPDATE profiles 
SET is_super_admin = true, 
    name = 'Sameera Wagaarachchige - Super Admin'
WHERE user_id = '116a951b-9012-42c7-88a0-a41791c4bdcc';