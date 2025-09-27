-- Add demo data using current user's company
WITH user_company AS (
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
),
demo_projects(name, description, location, status) AS (
  VALUES
    ('Highway Bridge Construction', 'Major highway bridge infrastructure project', 'New York, NY', 'active'),
    ('Commercial Building Project', 'Multi-story commercial office building', 'Los Angeles, CA', 'active'),
    ('Residential Complex', 'Luxury residential apartment complex', 'Chicago, IL', 'active'),
    ('Industrial Warehouse', 'Large-scale industrial storage facility', 'Houston, TX', 'active'),
    ('Shopping Mall Renovation', 'Complete renovation of existing shopping center', 'Phoenix, AZ', 'active'),
    ('Airport Terminal Extension', 'New terminal wing construction', 'Miami, FL', 'active')
)
INSERT INTO public.projects (company_id, name, description, location, status, created_by, created_at)
SELECT 
  uc.company_id,
  dp.name,
  dp.description,
  dp.location,
  dp.status,
  auth.uid(),
  now() - (random() * interval '30 days')
FROM user_company uc, demo_projects dp
WHERE NOT EXISTS (
  SELECT 1 FROM public.projects p 
  WHERE p.name = dp.name AND p.company_id = uc.company_id
);

-- Demo test reports
WITH user_company AS (
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
),
company_projects AS (
  SELECT id as project_id FROM public.projects p, user_company uc WHERE p.company_id = uc.company_id
),
demo_reports AS (
  SELECT 
    row_number() OVER () as rn,
    cp.project_id,
    uc.company_id
  FROM company_projects cp, user_company uc
  CROSS JOIN generate_series(1, 10) -- 10 reports per project
)
INSERT INTO public.test_reports (
  company_id, project_id, report_number, test_type, material_type, test_date,
  technician_name, compliance_status, notes, created_by, created_at
)
SELECT
  dr.company_id,
  dr.project_id,
  'TR-' || LPAD(dr.rn::text, 4, '0'),
  CASE (dr.rn % 5)
    WHEN 1 THEN 'Concrete Compression'
    WHEN 2 THEN 'Steel Tensile'
    WHEN 3 THEN 'Soil Compaction'
    WHEN 4 THEN 'Asphalt Marshall'
    ELSE 'CBR Test'
  END,
  CASE (dr.rn % 4)
    WHEN 1 THEN 'Concrete'
    WHEN 2 THEN 'Steel'
    WHEN 3 THEN 'Soil'
    ELSE 'Asphalt'
  END,
  CURRENT_DATE - ((dr.rn % 30)::int),
  CASE (dr.rn % 6)
    WHEN 1 THEN 'Alex Thompson'
    WHEN 2 THEN 'Maria Garcia'
    WHEN 3 THEN 'James Wilson'
    WHEN 4 THEN 'Sophie Chen'
    WHEN 5 THEN 'Robert Taylor'
    ELSE 'Jessica Brown'
  END,
  CASE (dr.rn % 4)
    WHEN 1 THEN 'pass'
    WHEN 2 THEN 'pending'
    WHEN 3 THEN 'fail'
    ELSE 'review_required'
  END,
  'Demo test report for system testing purposes',
  auth.uid(),
  now() - ((dr.rn % 30)) * interval '1 day'
FROM demo_reports dr
WHERE NOT EXISTS (
  SELECT 1 FROM public.test_reports tr 
  WHERE tr.report_number = 'TR-' || LPAD(dr.rn::text, 4, '0')
);

-- Demo company subscriptions
WITH user_company AS (
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
),
available_plans AS (
  SELECT id as plan_id FROM public.subscription_plans WHERE is_active = true LIMIT 1
)
INSERT INTO public.company_subscriptions (company_id, plan_id, status, current_period_start, current_period_end)
SELECT
  uc.company_id,
  ap.plan_id,
  'active',
  CURRENT_DATE - interval '15 days',
  CURRENT_DATE + interval '15 days'
FROM user_company uc, available_plans ap
WHERE NOT EXISTS (
  SELECT 1 FROM public.company_subscriptions cs 
  WHERE cs.company_id = uc.company_id
);