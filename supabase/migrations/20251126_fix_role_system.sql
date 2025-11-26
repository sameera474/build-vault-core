-- Comprehensive fix for role system
-- This migration:
-- 1. Keeps tenant_role for company-level permissions (technician, manager, etc.)
-- 2. Uses is_super_admin for system-wide admin access
-- 3. Removes the problematic 'role' column that had check constraints

-- Step 1: Ensure is_super_admin exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- Step 2: Ensure tenant_role exists for company-level roles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tenant_role TEXT;

-- Step 3: Migrate any data from 'role' to 'tenant_role' if needed
-- Only update if tenant_role is null and role has a value
UPDATE public.profiles 
SET tenant_role = role 
WHERE tenant_role IS NULL AND role IS NOT NULL;

-- Step 4: Drop all constraints related to the 'role' column
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    -- Drop any check constraints on role
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.profiles'::regclass 
        AND conname LIKE '%role%'
        AND conname NOT LIKE '%tenant_role%'
    LOOP
        EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS %I CASCADE', constraint_name);
    END LOOP;
END $$;

-- Step 5: Now safely drop the role column
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS role CASCADE;

-- Step 6: Add comments to document the new structure
COMMENT ON COLUMN public.profiles.is_super_admin IS 'System-wide super admin flag. Only super admins can access cross-company features and manage all users.';
COMMENT ON COLUMN public.profiles.tenant_role IS 'Company-level role (e.g., technician, manager, admin). Controls permissions within the user''s company.';

-- Step 7: Create an index on tenant_role for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_role ON public.profiles(tenant_role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_super_admin ON public.profiles(is_super_admin) WHERE is_super_admin = true;
