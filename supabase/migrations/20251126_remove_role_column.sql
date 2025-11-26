-- Remove the role column from profiles table as it's not being used functionally
-- The application uses is_super_admin boolean field instead

-- First, add is_super_admin column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- Drop the check constraint on role column if it exists
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Drop any other constraints that might exist on the role column
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.profiles'::regclass 
        AND conname LIKE '%role%'
    LOOP
        EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS %I', constraint_name);
    END LOOP;
END $$;

-- Now drop the role column
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS role;

-- Update the README/comments to reflect the correct schema
COMMENT ON COLUMN public.profiles.is_super_admin IS 'Boolean flag indicating if user has super admin privileges. Only super admins can access system-wide management features.';
