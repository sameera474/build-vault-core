-- Step 1: Add the missing columns to companies table first
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS country text DEFAULT 'South Africa',
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Step 2: Create missing companies for profiles that reference non-existent companies
INSERT INTO public.companies (id, name, description, country, is_active)
SELECT DISTINCT 
  p.company_id,
  'Existing Company ' || SUBSTRING(p.company_id::text, 1, 8),
  'Company created to maintain data integrity',
  'South Africa',
  true
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.companies c WHERE c.id = p.company_id
);

-- Step 3: Add foreign key constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_company_id_fkey;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Step 4: Add more user details to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS job_title text,
ADD COLUMN IF NOT EXISTS employee_id text,
ADD COLUMN IF NOT EXISTS hire_date date,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Step 5: Add triggers for updated_at
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 6: Update RLS policies for companies
DROP POLICY IF EXISTS "Authenticated users can view all companies" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;

CREATE POLICY "Authenticated users can view active companies" 
ON public.companies 
FOR SELECT 
USING (auth.role() = 'authenticated'::text AND is_active = true);

CREATE POLICY "Users can create companies during registration" 
ON public.companies 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Users can update their own company" 
ON public.companies 
FOR UPDATE 
USING (id = ( SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Step 7: Insert sample companies for testing (only if they don't exist by checking first)
DO $$
BEGIN
  -- Alpha Construction Ltd
  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE name = 'Alpha Construction Ltd') THEN
    INSERT INTO public.companies (name, description, website, country, is_active)
    VALUES ('Alpha Construction Ltd', 'Leading construction company specializing in infrastructure projects', 'https://alphaconstruction.co.za', 'South Africa', true);
  END IF;
  
  -- Beta Engineering Corp
  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE name = 'Beta Engineering Corp') THEN
    INSERT INTO public.companies (name, description, website, country, is_active)
    VALUES ('Beta Engineering Corp', 'Engineering consultancy focused on civil and structural engineering', 'https://betaengineering.co.za', 'South Africa', true);
  END IF;
  
  -- Gamma Materials Inc
  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE name = 'Gamma Materials Inc') THEN
    INSERT INTO public.companies (name, description, website, country, is_active)
    VALUES ('Gamma Materials Inc', 'Supplier of high-quality construction materials and testing services', 'https://gammamaterials.co.za', 'South Africa', true);
  END IF;
  
  -- Delta Infrastructure
  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE name = 'Delta Infrastructure') THEN
    INSERT INTO public.companies (name, description, website, country, is_active)
    VALUES ('Delta Infrastructure', 'Road construction and maintenance specialists', 'https://deltainfra.co.za', 'South Africa', true);
  END IF;
  
  -- Epsilon Testing Labs
  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE name = 'Epsilon Testing Labs') THEN
    INSERT INTO public.companies (name, description, website, country, is_active)
    VALUES ('Epsilon Testing Labs', 'Certified materials testing and quality assurance laboratory', 'https://epsilonlabs.co.za', 'South Africa', true);
  END IF;
END $$;