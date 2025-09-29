-- Add demo projects for existing companies
INSERT INTO public.projects (company_id, name, description, location, start_date, end_date, status, contract_number, contractor_name, client_name, consultant_name, project_prefix, region_code, lab_code) 
SELECT 
  c.id as company_id,
  'Highway Expansion Project' as name,
  'Major highway expansion with quality testing requirements' as description,
  'Cape Town, South Africa' as location,
  CURRENT_DATE - interval '30 days' as start_date,
  CURRENT_DATE + interval '120 days' as end_date,
  'active' as status,
  'HW-2024-001' as contract_number,
  'ABC Construction Ltd' as contractor_name,
  'Department of Transport' as client_name,
  'Engineering Consultants SA' as consultant_name,
  'HWY' as project_prefix,
  'CT' as region_code,
  'LAB1' as lab_code
FROM public.companies c 
WHERE c.is_active = true 
LIMIT 1;

INSERT INTO public.projects (company_id, name, description, location, start_date, end_date, status, contract_number, contractor_name, client_name, consultant_name, project_prefix, region_code, lab_code) 
SELECT 
  c.id as company_id,
  'Bridge Construction Phase 2' as name,
  'Second phase of bridge construction with material testing' as description,
  'Johannesburg, South Africa' as location,
  CURRENT_DATE - interval '15 days' as start_date,
  CURRENT_DATE + interval '90 days' as end_date,
  'active' as status,
  'BR-2024-002' as contract_number,
  'Bridge Masters Inc' as contractor_name,
  'City of Johannesburg' as client_name,
  'Structural Engineers Ltd' as consultant_name,
  'BRG' as project_prefix,
  'JHB' as region_code,
  'LAB2' as lab_code
FROM public.companies c 
WHERE c.is_active = true 
OFFSET 1 LIMIT 1;

INSERT INTO public.projects (company_id, name, description, location, start_date, end_date, status, contract_number, contractor_name, client_name, consultant_name, project_prefix, region_code, lab_code) 
SELECT 
  c.id as company_id,
  'Road Maintenance Project' as name,
  'Quarterly road maintenance and quality assessments' as description,
  'Durban, South Africa' as location,
  CURRENT_DATE - interval '10 days' as start_date,
  CURRENT_DATE + interval '60 days' as end_date,
  'active' as status,
  'RM-2024-003' as contract_number,
  'Road Works SA' as contractor_name,
  'eThekwini Municipality' as client_name,
  'Quality Assurance Consultants' as consultant_name,
  'RDM' as project_prefix,
  'DBN' as region_code,
  'LAB3' as lab_code
FROM public.companies c 
WHERE c.is_active = true 
LIMIT 1;