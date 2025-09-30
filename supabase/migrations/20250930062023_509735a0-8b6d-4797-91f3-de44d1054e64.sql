-- Add some test projects for the company
INSERT INTO projects (
  name,
  description,
  company_id,
  location,
  status,
  created_by,
  project_prefix,
  region_code,
  lab_code,
  contract_number
) VALUES 
(
  'Highway Construction Project A1',
  'Major highway construction with material testing requirements',
  '5da2f35a-e1db-4899-b855-7e50cf6d654c'::uuid,
  'Johannesburg, South Africa',
  'active',
  '116a951b-9012-42c7-88a0-a41791c4bdcc'::uuid,
  'HWY',
  'JHB',
  'LAB1',
  'HC-2024-001'
),
(
  'Bridge Foundation Testing',
  'Foundation material testing for new bridge construction',
  '5da2f35a-e1db-4899-b855-7e50cf6d654c'::uuid,
  'Cape Town, South Africa',
  'active',
  '116a951b-9012-42c7-88a0-a41791c4bdcc'::uuid,
  'BRG',
  'CPT',
  'LAB2',
  'BF-2024-002'
),
(
  'Airport Runway Extension',
  'Runway extension project requiring extensive material testing',
  '5da2f35a-e1db-4899-b855-7e50cf6d654c'::uuid,
  'Durban, South Africa',
  'active',
  '116a951b-9012-42c7-88a0-a41791c4bdcc'::uuid,
  'APT',
  'DBN',
  'LAB3',
  'AR-2024-003'
);