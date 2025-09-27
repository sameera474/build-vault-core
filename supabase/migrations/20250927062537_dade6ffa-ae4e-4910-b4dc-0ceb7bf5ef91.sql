-- Create missing companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on companies table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for companies
CREATE POLICY "Users can view their own company" 
ON public.companies 
FOR SELECT 
USING (id = (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own company" 
ON public.companies 
FOR UPDATE 
USING (id = (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

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
WHERE NOT EXISTS (SELECT 1 FROM public.companies WHERE name = demo_companies.name);

-- Insert subscription plans with correct structure
INSERT INTO public.subscription_plans (name, description, price_monthly, price_yearly, features, max_users, max_storage_gb, max_reports, is_active)
VALUES
  ('Free', 'Basic plan for small teams', 0, 0, '["Up to 5 users", "Basic reporting", "1GB storage"]'::jsonb, 5, 1, 10, true),
  ('Pro', 'Professional plan for growing teams', 49, 490, '["Up to 25 users", "Advanced reporting", "10GB storage", "API access"]'::jsonb, 25, 10, 100, true),
  ('Business', 'Enterprise plan for large organizations', 149, 1490, '["Unlimited users", "Premium reporting", "100GB storage", "Priority support", "Custom integrations"]'::jsonb, null, 100, null, true)
ON CONFLICT (id) DO NOTHING;