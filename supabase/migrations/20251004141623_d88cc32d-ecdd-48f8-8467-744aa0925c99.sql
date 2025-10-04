-- Consolidate all demo users under Alpha Construction Ltd (cf8e9777-1d1b-4c67-8845-668008a0401c)
-- Valid tenant_role values are: technician, quality_manager, project_manager, admin

-- Update John Smith - Project Manager (already correct company)
UPDATE profiles 
SET 
  tenant_role = 'project_manager',
  department = 'Project Management',
  job_title = 'Project Manager',
  is_demo_user = true
WHERE email = 'john.manager@alpha.com';

-- Update Sarah Johnson - Quality Manager
UPDATE profiles 
SET 
  company_id = 'cf8e9777-1d1b-4c67-8845-668008a0401c',
  tenant_role = 'quality_manager',
  department = 'Quality Assurance',
  job_title = 'Quality Manager',
  is_demo_user = true
WHERE email = 'sarah.quality@alpha.com';

-- Update Mike Davis - Lab Technician  
UPDATE profiles 
SET 
  company_id = 'cf8e9777-1d1b-4c67-8845-668008a0401c',
  tenant_role = 'technician',
  department = 'Laboratory',
  job_title = 'Lab Technician',
  is_demo_user = true
WHERE email = 'mike.tech@beta.com';

-- Update Emily Chen - Admin
UPDATE profiles 
SET 
  company_id = 'cf8e9777-1d1b-4c67-8845-668008a0401c',
  tenant_role = 'admin',
  department = 'Administration',
  job_title = 'Administrator',
  is_demo_user = true
WHERE email = 'emily.admin@beta.com';

-- Update Robert Wilson - Site Supervisor (use technician as tenant_role since supervisor doesn't exist)
UPDATE profiles 
SET 
  company_id = 'cf8e9777-1d1b-4c67-8845-668008a0401c',
  tenant_role = 'technician',
  department = 'Site Operations',
  job_title = 'Site Supervisor',
  is_demo_user = true
WHERE email = 'robert.supervisor@gamma.com';

-- Update user_roles table for each demo user
-- John Smith
DELETE FROM user_roles WHERE user_id = (SELECT user_id FROM profiles WHERE email = 'john.manager@alpha.com');
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'project_manager'::app_role FROM profiles WHERE email = 'john.manager@alpha.com';

-- Sarah Johnson
DELETE FROM user_roles WHERE user_id = (SELECT user_id FROM profiles WHERE email = 'sarah.quality@alpha.com');
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'quality_manager'::app_role FROM profiles WHERE email = 'sarah.quality@alpha.com';

-- Mike Davis
DELETE FROM user_roles WHERE user_id = (SELECT user_id FROM profiles WHERE email = 'mike.tech@beta.com');
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'technician'::app_role FROM profiles WHERE email = 'mike.tech@beta.com';

-- Emily Chen
DELETE FROM user_roles WHERE user_id = (SELECT user_id FROM profiles WHERE email = 'emily.admin@beta.com');
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'admin'::app_role FROM profiles WHERE email = 'emily.admin@beta.com';

-- Robert Wilson
DELETE FROM user_roles WHERE user_id = (SELECT user_id FROM profiles WHERE email = 'robert.supervisor@gamma.com');
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'supervisor'::app_role FROM profiles WHERE email = 'robert.supervisor@gamma.com';