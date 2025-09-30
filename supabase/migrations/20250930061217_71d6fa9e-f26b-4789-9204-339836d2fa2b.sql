-- Update existing profiles to belong to your company for testing
UPDATE profiles 
SET 
  company_id = '5da2f35a-e1db-4899-b855-7e50cf6d654c'::uuid,
  name = CASE user_id
    WHEN '6562ab64-6f99-4f90-b752-96a24605cd66' THEN 'John Admin - Quality Manager'
    WHEN 'aabd96b8-9692-440d-b56e-2e01ce545303' THEN 'Sarah Staff - Lab Technician'  
    WHEN '62f1ebda-d06c-4323-9a37-2cb5ceb0d672' THEN 'Mike Manager - Project Coordinator'
    ELSE name
  END,
  role = CASE user_id
    WHEN '6562ab64-6f99-4f90-b752-96a24605cd66' THEN 'admin'
    WHEN 'aabd96b8-9692-440d-b56e-2e01ce545303' THEN 'staff'
    WHEN '62f1ebda-d06c-4323-9a37-2cb5ceb0d672' THEN 'project_manager'
    ELSE role
  END,
  job_title = CASE user_id
    WHEN '6562ab64-6f99-4f90-b752-96a24605cd66' THEN 'Quality Manager'
    WHEN 'aabd96b8-9692-440d-b56e-2e01ce545303' THEN 'Lab Technician'
    WHEN '62f1ebda-d06c-4323-9a37-2cb5ceb0d672' THEN 'Project Coordinator'
    ELSE job_title
  END,
  department = CASE user_id
    WHEN '6562ab64-6f99-4f90-b752-96a24605cd66' THEN 'Quality Assurance'
    WHEN 'aabd96b8-9692-440d-b56e-2e01ce545303' THEN 'Laboratory'
    WHEN '62f1ebda-d06c-4323-9a37-2cb5ceb0d672' THEN 'Project Management'
    ELSE department
  END
WHERE user_id IN (
  '6562ab64-6f99-4f90-b752-96a24605cd66'::uuid,
  'aabd96b8-9692-440d-b56e-2e01ce545303'::uuid,
  '62f1ebda-d06c-4323-9a37-2cb5ceb0d672'::uuid
);