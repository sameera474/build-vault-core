-- Migration: Rebuild profiles table - VERSION 2 (WORKING)
-- Only references tenant_role since role column was already removed
-- Safe to run - backs up data first

-- Step 1: Create backup of existing profiles data
DROP TABLE IF EXISTS profiles_backup CASCADE;

CREATE TABLE profiles_backup AS 
SELECT 
  user_id,
  name,
  email,
  company_id,
  COALESCE(tenant_role::text, 'technician') as old_role,
  is_super_admin,
  avatar_url,
  phone,
  department,
  created_at,
  updated_at
FROM profiles;

-- Step 2: Drop the old profiles table and ENUM types
DROP TABLE IF EXISTS profiles CASCADE;

DO $$ 
BEGIN
    DROP TYPE IF EXISTS user_role CASCADE;
    DROP TYPE IF EXISTS tenant_role CASCADE;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Step 3: Create new profiles table with TEXT column
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  
  -- Single role column as TEXT with CHECK constraint
  tenant_role TEXT NOT NULL DEFAULT 'technician' CHECK (tenant_role IN (
    'admin',
    'project_manager',
    'quality_manager',
    'material_engineer',
    'technician',
    'consultant_engineer',
    'consultant_technician'
  )),
  
  -- Super admin flag
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  
  -- Additional profile info
  avatar_url TEXT,
  phone TEXT,
  department TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 4: Create indexes for performance
CREATE INDEX idx_profiles_company_id ON profiles(company_id);
CREATE INDEX idx_profiles_tenant_role ON profiles(tenant_role);
CREATE INDEX idx_profiles_is_super_admin ON profiles(is_super_admin);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Step 5: Restore data from backup with role mapping
INSERT INTO profiles (
  user_id,
  name,
  email,
  company_id,
  tenant_role,
  is_super_admin,
  avatar_url,
  phone,
  department,
  created_at,
  updated_at
)
SELECT 
  user_id,
  COALESCE(name, email),
  email,
  company_id,
  
  -- Map old roles to new allowed roles
  CASE
    -- Keep valid roles as-is
    WHEN old_role IN (
      'admin',
      'project_manager',
      'quality_manager',
      'material_engineer',
      'technician',
      'consultant_engineer',
      'consultant_technician'
    ) THEN old_role
    
    -- Map legacy 'supervisor' to 'project_manager'
    WHEN old_role = 'supervisor' THEN 'project_manager'
    
    -- Map any other unknown roles to 'technician'
    ELSE 'technician'
  END AS tenant_role,
  
  COALESCE(is_super_admin, false),
  avatar_url,
  phone,
  department,
  COALESCE(created_at, NOW()),
  COALESCE(updated_at, NOW())
FROM profiles_backup
ON CONFLICT (user_id) DO NOTHING;

-- Step 6: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Enable RLS and create policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view company profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update company profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert company profiles" ON profiles;
DROP POLICY IF EXISTS "Project managers can view company profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.is_super_admin = true
    )
  );

-- Super admins can update all profiles
CREATE POLICY "Super admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.is_super_admin = true
    )
  );

-- Super admins can insert profiles
CREATE POLICY "Super admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.is_super_admin = true
    )
  );

-- Super admins can delete profiles
CREATE POLICY "Super admins can delete profiles"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.is_super_admin = true
    )
  );

-- Admins can view company profiles
CREATE POLICY "Admins can view company profiles"
  ON profiles FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE user_id = auth.uid()
      AND tenant_role = 'admin'
    )
  );

-- Admins can update company profiles
CREATE POLICY "Admins can update company profiles"
  ON profiles FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE user_id = auth.uid()
      AND tenant_role = 'admin'
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE user_id = auth.uid()
      AND tenant_role = 'admin'
    )
  );

-- Admins can insert company profiles
CREATE POLICY "Admins can insert company profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE user_id = auth.uid()
      AND tenant_role = 'admin'
    )
  );

-- Project managers can view company profiles
CREATE POLICY "Project managers can view company profiles"
  ON profiles FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE user_id = auth.uid()
      AND tenant_role = 'project_manager'
    )
  );

-- Users can insert their own profile during signup
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Step 8: Create function for new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, tenant_role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'technician')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 9: Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON profiles TO anon;

-- Success!
COMMENT ON TABLE profiles IS 'Profiles table rebuilt successfully. Only tenant_role column (TEXT). Supervisor mapped to project_manager.';

-- Verification: Check role distribution after migration
DO $$
DECLARE
  role_stats TEXT;
  total_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM profiles;
  
  SELECT string_agg(tenant_role || ': ' || count::text, ', ')
  INTO role_stats
  FROM (
    SELECT tenant_role, COUNT(*) as count
    FROM profiles
    GROUP BY tenant_role
    ORDER BY tenant_role
  ) subq;
  
  RAISE NOTICE '✅ Migration completed! Total users: %, Role distribution: %', total_users, role_stats;
END $$;
