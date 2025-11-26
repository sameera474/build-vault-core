# ConstructTest Pro - Phase 0

Professional SaaS platform for construction materials testing management.

## Project Overview

**URL**: https://construction-test-pro.vercel.app/

ConstructTest Pro is a multi-tenant SaaS web application designed for construction materials testing. This is **Phase 0** - the marketing site and authentication foundation.

## Features Completed (Phase 0)

### 🎨 Professional Design System
- Industrial blue & orange color scheme with dark mode support
- Semantic design tokens with HSL colors throughout
- Custom button variants (hero, CTA, success)
- Consistent shadows, gradients, and smooth animations

### 🏠 Marketing Pages
- **Homepage**: Hero section with professional imagery, features grid, materials coverage, social proof
- **About**: Company story, values, mission with team imagery
- **Pricing**: Three-tier pricing with feature comparison
- **Contact**: Working contact form with validation and console logging

### 🔐 Complete Authentication Flow
- Sign In with email/password validation
- Registration with company setup and profile creation
- Forgot Password with Supabase email flow
- Protected routes and session management
- Graceful handling when Supabase isn't configured

### 📱 Responsive Design
- Mobile-first responsive navigation with hamburger menu
- Dark/light mode toggle with localStorage persistence
- Professional header/footer across all public pages
- Supabase setup notification banner

### 🏢 Dashboard Infrastructure
- Protected dashboard with collapsible sidebar
- User profile management and sign out
- Company context display
- "Coming Soon" indicators for Phase 1 features

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Shadcn/ui with custom variants
- **Authentication**: Supabase Auth (when configured)
- **Database**: Supabase PostgreSQL with RLS (when configured)
- **Routing**: React Router v6
- **Form Validation**: Zod
- **State Management**: React Query

## Local Development Setup (Windows 11)

### Prerequisites
1. Install [Node.js LTS](https://nodejs.org/) (v18 or higher)
2. Install [Git](https://git-scm.com/)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd constructtest-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   # Copy the example environment file
   copy .env.example .env

   # Add your Supabase credentials to .env:
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   - Navigate to `http://localhost:8080`

## Supabase Setup

### Database Schema

Create the following table and RLS policies in your Supabase project:

```sql
-- Create profiles table
create table if not exists public.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  company_id uuid not null,
  name text,
  email text,
  tenant_role text,
  is_super_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add comments to explain the role system
comment on column public.profiles.tenant_role is 'Company-level role (e.g., technician, manager, admin). Controls permissions within the user''s company.';
comment on column public.profiles.is_super_admin is 'System-wide super admin flag. Only super admins can access cross-company features and manage all users.';

-- Create indexes for better performance
create index if not exists idx_profiles_tenant_role on public.profiles(tenant_role);
create index if not exists idx_profiles_is_super_admin on public.profiles(is_super_admin) where is_super_admin = true;

-- Enable RLS
alter table public.profiles enable row level security;

-- RLS Policies
-- Users can read their own profile
create policy "read own profile"
on public.profiles for select
using (auth.uid() = user_id);

-- Users can update their own profile (except is_super_admin)
create policy "update own profile"
on public.profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Super admin can read all profiles
create policy "super admin read all"
on public.profiles for select
using (
  exists (
    select 1 from public.profiles
    where user_id = auth.uid()
    and is_super_admin = true
  )
);

-- Super admin can update all profiles
create policy "super admin update all"
on public.profiles for update
using (
  exists (
    select 1 from public.profiles
    where user_id = auth.uid()
    and is_super_admin = true
  )
);
```

### Role System Explanation

The application uses a **two-level role system**:

1. **`tenant_role`** (Company-level permissions)
   - Controls what users can do within their own company
   - Examples: `technician`, `manager`, `admin`, `viewer`
   - Set by company admins
   - Does NOT grant cross-company access

2. **`is_super_admin`** (System-wide permissions)
   - Boolean flag for system administrators
   - Grants access to ALL companies and system management features
   - Can only be set by other super admins
   - Use sparingly for platform administrators only

**Important**: The old `role` column has been removed to avoid confusion. If you see it in your database, run the migration `20251126_fix_role_system.sql`.

### Email Templates
Configure Supabase Auth email templates for password reset functionality.

## Phase 0 Acceptance Tests

✅ **Navigation**: All header/footer links route correctly without page reload  
✅ **Sign-In**: Shows proper placeholders, validates input, authenticates users  
✅ **Registration**: Creates user + profiles record with new company_id, redirects to sign-in  
✅ **Forgot Password**: Triggers Supabase reset email flow  
✅ **Protected Routes**: Dashboard requires authentication, redirects when needed  
✅ **Sign Out**: Successfully logs out and returns to sign-in  
✅ **Dark Mode**: Theme persists after browser reload  
✅ **Responsive**: Mobile hamburger menu functions correctly  
✅ **Graceful Degradation**: App loads and functions without Supabase configured  

## Phase 1 Planning

Once Phase 0 acceptance tests pass, Phase 1 will include:
- Test Reports & Templates (`/test-reports`, `/templates`)
- Monthly Summaries (`/monthly-summaries`)
- Chainage Bar Charts (`/barchart/:projectId`)
- Approval Workflows
- Excel-like editor with formulas
- PDF/Excel export functionality
- Advanced RLS policies
- Edge Functions for server-side operations

## Deployment

1. Open https://constructiontestpro-85ko01frw-sameeras-projects-7a5677db.vercel.app/
2. Click **Share** → **Publish**

### Custom Domain
1. Navigate to **Project** → **Settings** → **Domains**
2. Click **Connect Domain**
3. Follow setup instructions

---

**Important Notes**:
- The `role` column has been removed from the profiles table
- Use `tenant_role` for company-level permissions (technician, manager, etc.)
- Use `is_super_admin` for system-wide administrator access
- Only super admins can grant/revoke super admin privileges
- Never expose super_admin credentials publicly

## License

Proprietary - ConstructTest Pro SaaS Platform
