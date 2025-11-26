# ConstructTest Pro - Database Schema Documentation

## Overview

This document describes the complete database schema for ConstructTest Pro, a multi-tenant SaaS platform for construction materials testing management.

## Architecture

### Multi-Tenancy
- **Strategy**: Shared database with tenant isolation using `company_id`
- **Security**: Row Level Security (RLS) policies on all tables
- **Super Admin**: Special `is_super_admin` flag for system-wide access

### Database: PostgreSQL (via Supabase)

---

## Core Tables

### 1. `auth.users` (Supabase Auth)
Managed by Supabase Auth system.

### 2. `public.profiles`
**Purpose**: Extended user information and role management

```sql
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  company_id UUID NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  tenant_role TEXT, -- Company-level role: user, technician, manager, admin
  is_super_admin BOOLEAN DEFAULT FALSE, -- System-wide admin flag
  job_title TEXT,
  department TEXT,
  employee_id TEXT,
  hire_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  is_demo_user BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `idx_profiles_company_id` ON `company_id`
- `idx_profiles_tenant_role` ON `tenant_role`
- `idx_profiles_is_super_admin` ON `is_super_admin` WHERE `is_super_admin = TRUE`

**RLS Policies**:
- Users can read their own profile
- Users can update their own profile (except `is_super_admin`)
- Super admins can read/update all profiles

---

### 3. `public.companies`
**Purpose**: Company/Organization information

```sql
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  industry TEXT,
  size TEXT, -- e.g., '1-10', '11-50', '51-200', '201+'
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  subscription_tier TEXT DEFAULT 'free', -- free, starter, professional, enterprise
  subscription_status TEXT DEFAULT 'active',
  trial_ends_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `idx_companies_subscription_status` ON `subscription_status`

**RLS Policies**:
- Users can read their own company
- Company admins can update their company
- Super admins can read/update all companies

---

### 4. `public.projects`
**Purpose**: Construction projects

```sql
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  client_name TEXT,
  project_manager_id UUID REFERENCES profiles(user_id),
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active', -- active, completed, on_hold, cancelled
  budget DECIMAL(15, 2),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
```

**Indexes**:
- `idx_projects_company_id` ON `company_id`
- `idx_projects_status` ON `status`

**RLS Policies**:
- Users can read projects in their company
- Managers and admins can create/update projects

---

### 5. `public.project_roads`
**Purpose**: Roads/sections within projects

```sql
CREATE TABLE public.project_roads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_chainage TEXT,
  end_chainage TEXT,
  length_km DECIMAL(10, 3),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `idx_project_roads_project_id` ON `project_id`
- `idx_project_roads_company_id` ON `company_id`

---

### 6. `public.test_reports`
**Purpose**: Material test reports

```sql
CREATE TABLE public.test_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  project_id UUID REFERENCES projects(id),
  road_name TEXT,
  chainage_from TEXT,
  chainage_to TEXT,
  material TEXT,
  custom_material TEXT,
  side TEXT, -- LHS, RHS, FULL
  test_type TEXT,
  test_date DATE,
  sample_id TEXT,
  test_data JSONB DEFAULT '{}',
  results JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft', -- draft, pending, approved, rejected
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `idx_test_reports_company_id` ON `company_id`
- `idx_test_reports_project_id` ON `project_id`
- `idx_test_reports_status` ON `status`
- `idx_test_reports_created_by` ON `created_by`

---

### 7. `public.report_templates`
**Purpose**: Reusable test report templates

```sql
CREATE TABLE public.report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  test_type TEXT,
  template_schema JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 8. `public.construction_layers`
**Purpose**: Construction layer definitions for chainage charts

```sql
CREATE TABLE public.construction_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, name)
);
```

---

### 9. `public.laboratory_inventory`
**Purpose**: Equipment and materials inventory

```sql
CREATE TABLE public.laboratory_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  equipment_id TEXT,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  purchase_date DATE,
  calibration_date DATE,
  next_calibration_date DATE,
  status TEXT DEFAULT 'active', -- active, maintenance, retired
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 10. `public.invitations`
**Purpose**: User invitation management

```sql
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 11. `public.audit_logs`
**Purpose**: System audit trail

```sql
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `idx_audit_logs_user_id` ON `user_id`
- `idx_audit_logs_created_at` ON `created_at`
- `idx_audit_logs_company_id` ON `company_id`

---

## Database Functions

### `create_project_with_company()`
Creates a project associated with the user's company.

### `get_companies()`
Returns list of all companies (super admin only).

---

## Row Level Security (RLS) Policies

### Standard Patterns:

1. **Own Record Access**
   ```sql
   CREATE POLICY "users_can_view_own_record"
   ON table_name FOR SELECT
   USING (auth.uid() = user_id);
   ```

2. **Company Isolation**
   ```sql
   CREATE POLICY "users_can_view_company_data"
   ON table_name FOR SELECT
   USING (
     company_id IN (
       SELECT company_id FROM profiles WHERE user_id = auth.uid()
     )
   );
   ```

3. **Super Admin Override**
   ```sql
   CREATE POLICY "super_admin_full_access"
   ON table_name FOR ALL
   USING (
     EXISTS (
       SELECT 1 FROM profiles
       WHERE user_id = auth.uid()
       AND is_super_admin = TRUE
     )
   );
   ```

---

## Tables to Remove (Unused/Duplicate)

Based on code analysis, consider removing:

❌ Any test tables from development
❌ Duplicate migration tables
❌ Unused permission tables (if using role-based only)
❌ Old schema versions

---

## Best Practices

### 1. Migrations
- Always use migrations for schema changes
- Never modify production schema manually
- Keep migrations small and focused
- Name migrations descriptively: `YYYYMMDD_description.sql`

### 2. Indexing
- Index foreign keys
- Index frequently queried columns
- Use partial indexes for boolean columns
- Monitor query performance

### 3. RLS Security
- Enable RLS on all public tables
- Test policies thoroughly
- Use service role key for admin operations only
- Never expose service role key to frontend

### 4. Data Types
- Use UUID for all IDs
- Use TIMESTAMPTZ for all timestamps
- Use JSONB for flexible schema fields
- Use proper numeric types (DECIMAL for money)

### 5. Relationships
- Use CASCADE carefully (consider your deletion strategy)
- Always add foreign key constraints
- Use meaningful constraint names

---

## Maintenance Tasks

### Regular Tasks:
- [ ] Review and optimize slow queries
- [ ] Monitor database size and growth
- [ ] Clean up old audit logs (>1 year)
- [ ] Vacuum and analyze tables
- [ ] Review RLS policy performance
- [ ] Update indexes based on query patterns

### Backup Strategy:
- Supabase automatic daily backups
- Point-in-Time Recovery enabled
- Regular backup testing

---

## Migration Consolidation

To clean up multiple migrations:

1. **Export current schema**: `pg_dump --schema-only`
2. **Create consolidated migration**: Single file with complete schema
3. **Test on staging**: Verify all functionality works
4. **Archive old migrations**: Move to `archive/` folder
5. **Document changes**: Update this file

---

## Schema Version

**Current Version**: 2.0
**Last Updated**: November 26, 2025
**Breaking Changes**: Removed `role` column, added `tenant_role` and `is_super_admin`

---

## Support

For database issues:
1. Check RLS policies
2. Verify company_id is set correctly
3. Check user has proper role
4. Review audit logs for errors
5. Contact super admin if needed
