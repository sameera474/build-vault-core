-- Add more demo companies
INSERT INTO public.companies (name, description, country, city, address, phone, website, is_active) VALUES
('Advanced Materials Testing Ltd', 'Specialized materials testing and quality assurance for construction projects', 'South Africa', 'Cape Town', '123 Industrial Park Road, Epping', '+27 21 534 1000', 'www.advancedmaterials.co.za', true),
('Quality Assurance Consultants', 'Professional quality control and testing services for infrastructure projects', 'South Africa', 'Johannesburg', '456 Business District, Sandton', '+27 11 234 5678', 'www.qaconsultants.co.za', true),
('Precision Testing Solutions', 'Comprehensive testing solutions for civil engineering and construction', 'South Africa', 'Durban', '789 Coastal Development Zone, Pinetown', '+27 31 789 0123', 'www.precisiontesting.co.za', true),
('Infrastructure Labs SA', 'Leading infrastructure testing and certification laboratory', 'South Africa', 'Pretoria', '321 Technology Hub, Hatfield', '+27 12 345 6789', 'www.infrastructurelabs.co.za', true),
('Construction Quality Control', 'Expert quality control services for major construction projects', 'South Africa', 'Port Elizabeth', '654 Industrial Avenue, Newton Park', '+27 41 456 7890', 'www.cqc.co.za', true);

-- Add projects for each new company
INSERT INTO public.projects (company_id, name, description, location, start_date, end_date, status, contract_number, contractor_name, client_name, consultant_name, project_prefix, region_code, lab_code) 
SELECT 
  c.id as company_id,
  CASE 
    WHEN c.name = 'Advanced Materials Testing Ltd' THEN 'Airport Runway Extension Project'
    WHEN c.name = 'Quality Assurance Consultants' THEN 'Shopping Mall Construction Phase 1'
    WHEN c.name = 'Precision Testing Solutions' THEN 'Coastal Road Development'
    WHEN c.name = 'Infrastructure Labs SA' THEN 'Metro Rail Extension Project'
    WHEN c.name = 'Construction Quality Control' THEN 'Industrial Complex Development'
  END as name,
  CASE 
    WHEN c.name = 'Advanced Materials Testing Ltd' THEN 'Major airport runway extension with advanced materials testing'
    WHEN c.name = 'Quality Assurance Consultants' THEN 'Large shopping complex with comprehensive quality testing'
    WHEN c.name = 'Precision Testing Solutions' THEN 'Coastal road development with specialized marine testing'
    WHEN c.name = 'Infrastructure Labs SA' THEN 'Metro rail extension requiring infrastructure certification'
    WHEN c.name = 'Construction Quality Control' THEN 'Industrial complex with quality control requirements'
  END as description,
  CASE 
    WHEN c.name = 'Advanced Materials Testing Ltd' THEN 'OR Tambo International Airport, Johannesburg'
    WHEN c.name = 'Quality Assurance Consultants' THEN 'Sandton City Extension, Johannesburg'
    WHEN c.name = 'Precision Testing Solutions' THEN 'Durban Coastal Highway, KwaZulu-Natal'
    WHEN c.name = 'Infrastructure Labs SA' THEN 'Gautrain Extension, Pretoria'
    WHEN c.name = 'Construction Quality Control' THEN 'Coega Industrial Development Zone, Port Elizabeth'
  END as location,
  CURRENT_DATE - interval '20 days' as start_date,
  CURRENT_DATE + interval '150 days' as end_date,
  'active' as status,
  CASE 
    WHEN c.name = 'Advanced Materials Testing Ltd' THEN 'AP-2024-001'
    WHEN c.name = 'Quality Assurance Consultants' THEN 'SM-2024-002'
    WHEN c.name = 'Precision Testing Solutions' THEN 'CR-2024-003'
    WHEN c.name = 'Infrastructure Labs SA' THEN 'MR-2024-004'
    WHEN c.name = 'Construction Quality Control' THEN 'IC-2024-005'
  END as contract_number,
  CASE 
    WHEN c.name = 'Advanced Materials Testing Ltd' THEN 'Airport Construction Specialists'
    WHEN c.name = 'Quality Assurance Consultants' THEN 'Commercial Builders Ltd'
    WHEN c.name = 'Precision Testing Solutions' THEN 'Coastal Engineering Works'
    WHEN c.name = 'Infrastructure Labs SA' THEN 'Rail Infrastructure Builders'
    WHEN c.name = 'Construction Quality Control' THEN 'Industrial Development Corp'
  END as contractor_name,
  CASE 
    WHEN c.name = 'Advanced Materials Testing Ltd' THEN 'Airports Company South Africa'
    WHEN c.name = 'Quality Assurance Consultants' THEN 'Liberty Properties'
    WHEN c.name = 'Precision Testing Solutions' THEN 'KwaZulu-Natal Department of Transport'
    WHEN c.name = 'Infrastructure Labs SA' THEN 'Gauteng Provincial Government'
    WHEN c.name = 'Construction Quality Control' THEN 'Coega Development Corporation'
  END as client_name,
  CASE 
    WHEN c.name = 'Advanced Materials Testing Ltd' THEN 'Aviation Engineering Consultants'
    WHEN c.name = 'Quality Assurance Consultants' THEN 'Commercial Design Associates'
    WHEN c.name = 'Precision Testing Solutions' THEN 'Coastal Engineering Consultants'
    WHEN c.name = 'Infrastructure Labs SA' THEN 'Rail Engineering Solutions'
    WHEN c.name = 'Construction Quality Control' THEN 'Industrial Design Partners'
  END as consultant_name,
  CASE 
    WHEN c.name = 'Advanced Materials Testing Ltd' THEN 'AIR'
    WHEN c.name = 'Quality Assurance Consultants' THEN 'SHM'
    WHEN c.name = 'Precision Testing Solutions' THEN 'CST'
    WHEN c.name = 'Infrastructure Labs SA' THEN 'MET'
    WHEN c.name = 'Construction Quality Control' THEN 'IND'
  END as project_prefix,
  CASE 
    WHEN c.name = 'Advanced Materials Testing Ltd' THEN 'JHB'
    WHEN c.name = 'Quality Assurance Consultants' THEN 'SAN'
    WHEN c.name = 'Precision Testing Solutions' THEN 'DBN'
    WHEN c.name = 'Infrastructure Labs SA' THEN 'PTA'
    WHEN c.name = 'Construction Quality Control' THEN 'PE'
  END as region_code,
  CASE 
    WHEN c.name = 'Advanced Materials Testing Ltd' THEN 'LAB4'
    WHEN c.name = 'Quality Assurance Consultants' THEN 'LAB5'
    WHEN c.name = 'Precision Testing Solutions' THEN 'LAB6'
    WHEN c.name = 'Infrastructure Labs SA' THEN 'LAB7'
    WHEN c.name = 'Construction Quality Control' THEN 'LAB8'
  END as lab_code
FROM public.companies c 
WHERE c.name IN ('Advanced Materials Testing Ltd', 'Quality Assurance Consultants', 'Precision Testing Solutions', 'Infrastructure Labs SA', 'Construction Quality Control');