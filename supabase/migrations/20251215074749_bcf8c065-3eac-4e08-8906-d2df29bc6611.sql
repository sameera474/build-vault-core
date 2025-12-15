-- Insert missing profile for janadarikumu@gmail.com
INSERT INTO public.profiles (user_id, email, name, tenant_role, company_id, is_super_admin)
SELECT 
  '6562ab64-6f99-4f90-b752-96a24605cd66',
  'janadarikumu@gmail.com',
  'Kumuduni Ranasinghe',
  'technician',
  'cf8e9777-1d1b-4c67-8845-668008a0401c', -- Same company as kumuranasinghe@gmail.com
  false
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE user_id = '6562ab64-6f99-4f90-b752-96a24605cd66'
);

-- Also insert user_role for this user
INSERT INTO public.user_roles (user_id, role)
SELECT 
  '6562ab64-6f99-4f90-b752-96a24605cd66',
  'technician'::app_role
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = '6562ab64-6f99-4f90-b752-96a24605cd66'
);