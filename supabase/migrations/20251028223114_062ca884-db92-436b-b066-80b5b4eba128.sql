-- Make company_id nullable for super admin accounts
-- Super admins should not be tied to any specific company

-- First, update existing super admin accounts to have NULL company_id
UPDATE public.profiles
SET company_id = NULL
WHERE is_super_admin = true;

-- Add a constraint to ensure super admins don't have company_id
-- and non-super admins must have company_id
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_company_id_fkey;

-- Re-add the foreign key as nullable
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_company_id_fkey 
  FOREIGN KEY (company_id) 
  REFERENCES public.companies(id) 
  ON DELETE SET NULL;

-- Add check constraint: super admins must have NULL company_id, others must have company_id
ALTER TABLE public.profiles
ADD CONSTRAINT check_super_admin_company 
  CHECK (
    (is_super_admin = true AND company_id IS NULL) OR
    (is_super_admin = false AND company_id IS NOT NULL) OR
    (is_super_admin IS NULL AND company_id IS NOT NULL)
  );