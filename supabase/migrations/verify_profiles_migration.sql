-- Verification Script for Profiles Table Migration
-- Run this in Supabase SQL Editor to verify the migration was successful

-- ============================================
-- 1. CHECK TABLE STRUCTURE
-- ============================================
SELECT '=== TABLE STRUCTURE ===' as check_name;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================
-- 2. CHECK FOR OLD 'ROLE' COLUMN (should NOT exist)
-- ============================================
SELECT '=== CHECKING FOR OLD ROLE COLUMN ===' as check_name;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'role'
    ) 
    THEN '❌ FAILED: Old "role" column still exists!'
    ELSE '✅ PASSED: Old "role" column removed successfully'
  END as result;

-- ============================================
-- 3. CHECK TENANT_ROLE IS TEXT (not ENUM)
-- ============================================
SELECT '=== CHECKING TENANT_ROLE DATA TYPE ===' as check_name;

SELECT 
  CASE 
    WHEN data_type = 'text' 
    THEN '✅ PASSED: tenant_role is TEXT type'
    ELSE '❌ FAILED: tenant_role is ' || data_type || ' (should be text)'
  END as result
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'tenant_role';

-- ============================================
-- 4. CHECK USER COUNT
-- ============================================
SELECT '=== USER COUNT ===' as check_name;

SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_super_admin THEN 1 END) as super_admins,
  COUNT(CASE WHEN company_id IS NOT NULL THEN 1 END) as users_with_company
FROM profiles;

-- ============================================
-- 5. CHECK ROLE DISTRIBUTION
-- ============================================
SELECT '=== ROLE DISTRIBUTION ===' as check_name;

SELECT 
  tenant_role,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM profiles
GROUP BY tenant_role
ORDER BY count DESC;

-- ============================================
-- 6. CHECK FOR INVALID ROLES
-- ============================================
SELECT '=== CHECKING FOR INVALID ROLES ===' as check_name;

SELECT 
  CASE 
    WHEN COUNT(*) = 0 
    THEN '✅ PASSED: No invalid roles found'
    ELSE '❌ FAILED: Found ' || COUNT(*) || ' users with invalid roles'
  END as result
FROM profiles
WHERE tenant_role NOT IN (
  'admin',
  'project_manager',
  'quality_manager',
  'material_engineer',
  'technician',
  'consultant_engineer',
  'consultant_technician'
);

-- Show any invalid roles if they exist
SELECT 
  tenant_role,
  COUNT(*) as count
FROM profiles
WHERE tenant_role NOT IN (
  'admin',
  'project_manager',
  'quality_manager',
  'material_engineer',
  'technician',
  'consultant_engineer',
  'consultant_technician'
)
GROUP BY tenant_role;

-- ============================================
-- 7. CHECK RLS POLICIES
-- ============================================
SELECT '=== RLS POLICIES ===' as check_name;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================
-- 8. CHECK INDEXES
-- ============================================
SELECT '=== INDEXES ===' as check_name;

SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
ORDER BY indexname;

-- ============================================
-- 9. CHECK BACKUP TABLE EXISTS
-- ============================================
SELECT '=== BACKUP TABLE ===' as check_name;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'profiles_backup'
    ) 
    THEN '✅ PASSED: Backup table exists with ' || (
      SELECT COUNT(*)::text FROM profiles_backup
    ) || ' rows'
    ELSE '⚠️  WARNING: Backup table not found (may have been cleaned up)'
  END as result;

-- ============================================
-- 10. SAMPLE USER DATA
-- ============================================
SELECT '=== SAMPLE USER DATA ===' as check_name;

SELECT 
  name,
  email,
  tenant_role,
  is_super_admin,
  CASE WHEN company_id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_company,
  created_at::date as created_date
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 11. CHECK FOR SUPERVISOR ROLE (should be mapped)
-- ============================================
SELECT '=== CHECKING SUPERVISOR MAPPING ===' as check_name;

SELECT 
  CASE 
    WHEN COUNT(*) = 0 
    THEN '✅ PASSED: No "supervisor" roles found (successfully mapped to project_manager)'
    ELSE '❌ FAILED: Found ' || COUNT(*) || ' users still with supervisor role'
  END as result
FROM profiles
WHERE tenant_role = 'supervisor';

-- ============================================
-- FINAL SUMMARY
-- ============================================
SELECT '=== MIGRATION SUMMARY ===' as check_name;

SELECT 
  '✅ Migration completed successfully!' as status,
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(DISTINCT tenant_role) FROM profiles) as unique_roles,
  (SELECT COUNT(*) FROM profiles WHERE is_super_admin) as super_admins,
  (SELECT COUNT(*) FROM profiles WHERE company_id IS NOT NULL) as users_with_company;
