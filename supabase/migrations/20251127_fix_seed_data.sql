-- ============================================
-- FIXED SEED SCRIPT
-- Uses tenant_role (not role)
-- Compatible with new profiles table structure
-- ============================================

-- 0) Prereqs
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Companies table (if not exists)
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Projects table (if not exists)
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  location text,
  status text DEFAULT 'active',
  contract_number text,
  contractor_name text,
  client_name text,
  consultant_name text,
  project_prefix text,
  region_code text,
  lab_code text,
  created_by uuid REFERENCES public.profiles(user_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Subscription plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  price_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Company subscriptions
CREATE TABLE IF NOT EXISTS public.company_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status text CHECK (status IN ('active','cancelled','past_due')) NOT NULL,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5) Test reports table
CREATE TABLE IF NOT EXISTS public.test_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  report_number text NOT NULL,
  test_type text NOT NULL,
  material_type text NOT NULL,
  test_date date NOT NULL,
  technician_name text NOT NULL,
  compliance_status text CHECK (compliance_status IN ('pass','pending','fail','review_required')) NOT NULL,
  notes text,
  created_by uuid REFERENCES public.profiles(user_id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- SEED DATA
-- ============================================

-- Insert subscription plans
INSERT INTO public.subscription_plans (code, name, price_cents)
VALUES
  ('free', 'Free', 0),
  ('pro', 'Pro', 4900),
  ('business', 'Business', 14900)
ON CONFLICT (code) DO NOTHING;

-- Insert demo companies
WITH demo_companies(name) AS (
  VALUES
    ('Acme Infrastructure LLC'),
    ('West Coast Builders Inc.'),
    ('Midwest Materials Group'),
    ('Skyline Developments'),
    ('Lone Star Construction'),
    ('Great Lakes Engineering'),
    ('Pacific Edge Projects'),
    ('Heartland Constructors'),
    ('Urban Matrix Works'),
    ('Keystone Fabrication Co.')
)
INSERT INTO public.companies (name)
SELECT name FROM demo_companies
ON CONFLICT DO NOTHING;

-- ============================================
-- MAKE CURRENT USER SUPER ADMIN
-- FIXED: Uses tenant_role instead of role
-- ============================================

-- Set current session user as super admin
UPDATE public.profiles
SET is_super_admin = true, tenant_role = 'admin'
WHERE user_id = auth.uid();

-- Create profile if doesn't exist
INSERT INTO public.profiles (user_id, company_id, name, tenant_role, is_super_admin)
SELECT 
  auth.uid(),
  (SELECT id FROM public.companies ORDER BY created_at LIMIT 1),
  'Super Admin',
  'admin',
  true
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid());

-- Set specific email as super admin
UPDATE public.profiles
SET is_super_admin = true, tenant_role = 'admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'sameera474@gmail.com');

-- Create profile for specific email if doesn't exist
INSERT INTO public.profiles (user_id, company_id, name, tenant_role, is_super_admin)
SELECT 
  u.id,
  (SELECT id FROM public.companies ORDER BY created_at LIMIT 1),
  COALESCE(u.raw_user_meta_data->>'name', 'Sameera Wagaarachchige'),
  'admin',
  true
FROM auth.users u
WHERE u.email = 'sameera474@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = u.id);

-- ============================================
-- SEED DEMO PROFILES
-- FIXED: Uses tenant_role with valid values
-- ============================================

WITH users_ordered AS (
  SELECT
    id,
    COALESCE(raw_user_meta_data->>'name', split_part(email,'@',1)) AS fallback_name,
    created_at,
    ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM auth.users
),
companies_ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM public.companies
),
demo_names(name, tenant_role, created_at_txt, rn) AS (
  VALUES
    ('John Smith - Admin',          'admin',             '2024-01-15T10:00:00Z', 1),
    ('Sarah Johnson - Manager',     'project_manager',   '2024-02-10T10:00:00Z', 2),
    ('Mike Wilson - Technician',    'technician',        '2024-03-05T10:00:00Z', 3),
    ('Lisa Brown - Admin',          'admin',             '2024-03-20T10:00:00Z', 4),
    ('David Lee - Engineer',        'material_engineer', '2024-04-12T10:00:00Z', 5),
    ('Emma Davis - Quality',        'quality_manager',   '2024-05-08T10:00:00Z', 6),
    ('Chris Taylor - Manager',      'project_manager',   '2024-06-15T10:00:00Z', 7),
    ('Anna Martinez - Technician',  'technician',        '2024-07-22T10:00:00Z', 8),
    ('Tom Anderson - Consultant',   'consultant_engineer', '2024-08-18T10:00:00Z', 9),
    ('Kate White - Admin',          'admin',             '2024-09-10T10:00:00Z', 10)
),
pairs AS (
  SELECT
    u.id AS user_id,
    c.id AS company_id,
    COALESCE(d.name, u.fallback_name) AS name,
    COALESCE(d.tenant_role, 'technician') AS tenant_role,
    (d.created_at_txt)::timestamptz AS created_at
  FROM users_ordered u
  JOIN companies_ordered c ON c.rn = u.rn
  LEFT JOIN demo_names d ON d.rn = u.rn
  WHERE u.rn <= 10
)
INSERT INTO public.profiles (user_id, company_id, name, tenant_role, created_at)
SELECT user_id, company_id, name, tenant_role, created_at
FROM pairs
ON CONFLICT (user_id) DO UPDATE
SET company_id = EXCLUDED.company_id,
    name = EXCLUDED.name,
    tenant_role = EXCLUDED.tenant_role,
    created_at = LEAST(public.profiles.created_at, EXCLUDED.created_at);

-- ============================================
-- SEED PROJECTS
-- ============================================

WITH admins AS (
  SELECT p.user_id, p.company_id, p.created_at,
         ROW_NUMBER() OVER (ORDER BY p.created_at, p.user_id) AS rn
  FROM public.profiles p
  WHERE p.tenant_role = 'admin'
),
src AS (
  SELECT
    a.company_id,
    CASE
      WHEN (a.rn % 3) = 1 THEN 'Highway Bridge Construction'
      WHEN (a.rn % 3) = 2 THEN 'Commercial Building Project'
      ELSE 'Residential Complex'
    END AS name,
    CASE
      WHEN (a.rn % 3) = 1 THEN 'Major highway bridge infrastructure project'
      WHEN (a.rn % 3) = 2 THEN 'Multi-story commercial office building'
      ELSE 'Luxury residential apartment complex'
    END AS description,
    CASE
      WHEN (a.rn % 4) = 1 THEN 'New York, NY'
      WHEN (a.rn % 4) = 2 THEN 'Los Angeles, CA'
      WHEN (a.rn % 4) = 3 THEN 'Chicago, IL'
      ELSE 'Houston, TX'
    END AS location,
    'active'::text AS status,
    a.user_id AS created_by,
    a.created_at + INTERVAL '1 day' AS created_at
  FROM admins a
  LIMIT 6
)
INSERT INTO public.projects (company_id, name, description, location, status, created_by, created_at)
SELECT company_id, name, description, location, status, created_by, created_at
FROM src;

-- ============================================
-- SEED TEST REPORTS
-- ============================================

WITH admins AS (
  SELECT p.user_id, p.company_id
  FROM public.profiles p
  WHERE p.tenant_role = 'admin'
),
pairs AS (
  SELECT a.user_id, a.company_id, pr.id AS project_id,
         ROW_NUMBER() OVER (ORDER BY a.company_id, pr.id) AS rn
  FROM admins a
  JOIN public.projects pr ON pr.company_id = a.company_id
),
src AS (
  SELECT
    company_id,
    project_id,
    'TR-' || LPAD(rn::text, 4, '0') AS report_number,
    CASE (rn % 5)
      WHEN 1 THEN 'Concrete Compression'
      WHEN 2 THEN 'Steel Tensile'
      WHEN 3 THEN 'Soil Compaction'
      WHEN 4 THEN 'Asphalt Marshall'
      ELSE 'CBR Test'
    END AS test_type,
    CASE (rn % 4)
      WHEN 1 THEN 'Concrete'
      WHEN 2 THEN 'Steel'
      WHEN 3 THEN 'Soil'
      ELSE 'Asphalt'
    END AS material_type,
    (CURRENT_DATE - ((rn % 30))::int) AS test_date,
    CASE (rn % 6)
      WHEN 1 THEN 'Alex Thompson'
      WHEN 2 THEN 'Maria Garcia'
      WHEN 3 THEN 'James Wilson'
      WHEN 4 THEN 'Sophie Chen'
      WHEN 5 THEN 'Robert Taylor'
      ELSE 'Jessica Brown'
    END AS technician_name,
    CASE (rn % 4)
      WHEN 1 THEN 'pass'
      WHEN 2 THEN 'pending'
      WHEN 3 THEN 'fail'
      ELSE 'review_required'
    END AS compliance_status,
    'Demo test report for system testing purposes' AS notes,
    user_id AS created_by,
    now() - ((rn % 30)) * INTERVAL '1 day' AS created_at
  FROM pairs
  LIMIT 50
)
INSERT INTO public.test_reports (
  company_id, project_id, report_number, test_type, material_type, test_date,
  technician_name, compliance_status, notes, created_by, created_at
)
SELECT company_id, project_id, report_number, test_type, material_type, test_date,
       technician_name, compliance_status, notes, created_by, created_at
FROM src;

-- ============================================
-- SEED SUBSCRIPTIONS
-- ============================================

WITH c AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) rn
  FROM public.companies
),
pick_plan AS (
  SELECT id AS plan_id
  FROM public.subscription_plans
)
INSERT INTO public.company_subscriptions (company_id, plan_id, status, current_period_start, current_period_end)
SELECT
  c.id,
  (SELECT plan_id FROM pick_plan ORDER BY random() LIMIT 1),
  CASE (c.rn % 5)
    WHEN 1 THEN 'active'
    WHEN 2 THEN 'active'
    WHEN 3 THEN 'active'
    WHEN 4 THEN 'cancelled'
    ELSE 'active'
  END AS status,
  CURRENT_DATE - INTERVAL '15 days',
  CURRENT_DATE + INTERVAL '15 days'
FROM c
ORDER BY c.rn
LIMIT 8;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Seed data inserted successfully!';
  RAISE NOTICE 'Companies: %', (SELECT COUNT(*) FROM public.companies);
  RAISE NOTICE 'Profiles: %', (SELECT COUNT(*) FROM public.profiles);
  RAISE NOTICE 'Projects: %', (SELECT COUNT(*) FROM public.projects);
  RAISE NOTICE 'Test Reports: %', (SELECT COUNT(*) FROM public.test_reports);
  RAISE NOTICE 'Subscriptions: %', (SELECT COUNT(*) FROM public.company_subscriptions);
END $$;
