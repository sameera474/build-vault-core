# Role-Based Navigation System

This document describes the menu structure visible to each user role in ConstructTest Pro.

## Navigation Structure

The sidebar is organized into logical groups:

### 1. Main
- **Dashboard** - Available to all users

### 2. Testing & Reports
- **Test Reports** - Create and view test reports
- **Templates** - Manage report templates
- **Approvals** - Approve/reject test reports

### 3. Analytics & Insights
- **Analytics** - Advanced analytics dashboard
- **Monthly Summaries** - Monthly performance summaries
- **Chainage Charts** - Layer works progress visualization

### 4. Project Management
- **Projects** - Manage construction projects
- **Documents** - Document management
- **Laboratory Inventory** - Equipment and materials inventory

### 5. Company Management
- **Team** - Manage company users
- **Permissions** - Configure user permissions

### 6. Tools
- **Export Data** - Export reports and data
- **Mobile** - Mobile app information

### 7. System Administration (Super Admin Only)
- **Super Admin Dashboard** - System-wide management
- **All Companies** - Manage all companies
- **System Users** - Manage all system users
- **Audit Logs** - View system audit logs
- **Automation** - System automation settings

---

## Role-Based Access Matrix

### User Role: `user` (Basic User)
**Access Level**: Minimal access, view-only

| Section | Menu Item | Access |
|---------|-----------|--------|
| Main | Dashboard | ✅ Yes |
| Testing & Reports | Test Reports | ❌ No |
| Testing & Reports | Templates | ❌ No |
| Testing & Reports | Approvals | ❌ No |
| Analytics & Insights | Analytics | ❌ No |
| Analytics & Insights | Monthly Summaries | ❌ No |
| Analytics & Insights | Chainage Charts | ❌ No |
| Project Management | Projects | ❌ No |
| Project Management | Documents | ❌ No |
| Project Management | Laboratory Inventory | ❌ No |
| Company Management | Team | ❌ No |
| Company Management | Permissions | ❌ No |
| Tools | Export Data | ❌ No |
| Tools | Mobile | ✅ Yes |

**Summary**: Basic users only see Dashboard and Mobile app info.

---

### User Role: `technician` (Lab Technician)
**Access Level**: Can create and view test reports

| Section | Menu Item | Access |
|---------|-----------|--------|
| Main | Dashboard | ✅ Yes |
| Testing & Reports | Test Reports | ✅ Yes |
| Testing & Reports | Templates | ❌ No |
| Testing & Reports | Approvals | ❌ No |
| Analytics & Insights | Analytics | ❌ No |
| Analytics & Insights | Monthly Summaries | ❌ No |
| Analytics & Insights | Chainage Charts | ❌ No |
| Project Management | Projects | ❌ No |
| Project Management | Documents | ❌ No |
| Project Management | Laboratory Inventory | ❌ No |
| Company Management | Team | ❌ No |
| Company Management | Permissions | ❌ No |
| Tools | Export Data | ❌ No |
| Tools | Mobile | ✅ Yes |

**Summary**: Technicians can create and manage test reports but cannot approve or access analytics.

---

### User Role: `manager` (Project Manager / Quality Manager)
**Access Level**: Full project and analytics access

| Section | Menu Item | Access |
|---------|-----------|--------|
| Main | Dashboard | ✅ Yes |
| Testing & Reports | Test Reports | ✅ Yes |
| Testing & Reports | Templates | ✅ Yes |
| Testing & Reports | Approvals | ✅ Yes |
| Analytics & Insights | Analytics | ✅ Yes |
| Analytics & Insights | Monthly Summaries | ✅ Yes |
| Analytics & Insights | Chainage Charts | ✅ Yes |
| Project Management | Projects | ✅ Yes |
| Project Management | Documents | ✅ Yes |
| Project Management | Laboratory Inventory | ❌ No |
| Company Management | Team | ❌ No |
| Company Management | Permissions | ❌ No |
| Tools | Export Data | ✅ Yes |
| Tools | Mobile | ✅ Yes |

**Summary**: Managers have full access to testing, analytics, and project management but cannot manage users or company settings.

---

### User Role: `admin` (Company Admin)
**Access Level**: Full company management access

| Section | Menu Item | Access |
|---------|-----------|--------|
| Main | Dashboard | ✅ Yes |
| Testing & Reports | Test Reports | ✅ Yes |
| Testing & Reports | Templates | ✅ Yes |
| Testing & Reports | Approvals | ✅ Yes |
| Analytics & Insights | Analytics | ✅ Yes |
| Analytics & Insights | Monthly Summaries | ✅ Yes |
| Analytics & Insights | Chainage Charts | ✅ Yes |
| Project Management | Projects | ✅ Yes |
| Project Management | Documents | ✅ Yes |
| Project Management | Laboratory Inventory | ✅ Yes |
| Company Management | Team | ✅ Yes |
| Company Management | Permissions | ✅ Yes |
| Tools | Export Data | ✅ Yes |
| Tools | Mobile | ✅ Yes |

**Summary**: Company admins have full access to all company features including user management and permissions.

---

### Super Admin: `is_super_admin = true`
**Access Level**: System-wide access across all companies

| Section | Menu Item | Access |
|---------|-----------|--------|
| Main | Dashboard | ✅ Yes |
| Testing & Reports | Test Reports | ✅ Yes |
| Testing & Reports | Templates | ✅ Yes |
| Testing & Reports | Approvals | ✅ Yes |
| Analytics & Insights | Analytics | ✅ Yes |
| Analytics & Insights | Monthly Summaries | ✅ Yes |
| Analytics & Insights | Chainage Charts | ✅ Yes |
| Project Management | Projects | ✅ Yes |
| Project Management | Documents | ✅ Yes |
| Project Management | Laboratory Inventory | ✅ Yes |
| Company Management | Team | ✅ Yes |
| Company Management | Permissions | ✅ Yes |
| Tools | Export Data | ✅ Yes |
| Tools | Mobile | ✅ Yes |
| **System Administration** | **Super Admin Dashboard** | ✅ Yes |
| **System Administration** | **All Companies** | ✅ Yes |
| **System Administration** | **System Users** | ✅ Yes |
| **System Administration** | **Audit Logs** | ✅ Yes |
| **System Administration** | **Automation** | ✅ Yes |

**Summary**: Super admins see **everything** including a special "System Administration" section for platform-wide management.

---

## Key Features

### 1. ✅ Clean Organization
- Menu items are grouped by function
- Similar features are placed together
- Clear section labels

### 2. ✅ Role-Based Access
- Uses `tenant_role` for company-level permissions (user, technician, manager, admin)
- Uses `is_super_admin` for system-wide access
- Automatic menu filtering based on user role

### 3. ✅ Progressive Permissions
- **User** → Basic access
- **Technician** → Can create reports
- **Manager** → Can approve and view analytics
- **Admin** → Can manage company and users
- **Super Admin** → Can manage entire system

### 4. ✅ No Clutter
- Users only see what they can access
- Unnecessary items are hidden
- Clean, focused interface

---

## How to Change User Roles

### For Company Admins:
1. Go to **Team** page
2. Select a user
3. Change their `tenant_role` (user, technician, manager, admin)

### For Super Admins:
1. Go to **Super Admin Dashboard**
2. Click **Users** tab
3. Change user's `tenant_role` (company role)
4. Toggle `is_super_admin` status (system-wide access)

---

## Technical Implementation

### Database Fields:
```sql
-- profiles table
tenant_role TEXT        -- Company-level role: user, technician, manager, admin
is_super_admin BOOLEAN  -- System-wide admin flag
```

### Navigation Logic:
```typescript
// Check if user should see menu item
if (isSuperAdmin) return true;  // Super admin sees everything
if (item.requireSuperAdmin) return false;  // Non-super admin can't see super admin items
if (item.roles?.includes(tenantRole)) return true;  // Role-based check
return false;
```

---

## Best Practices

1. **Least Privilege**: Start users with minimal access (user role)
2. **Progressive Access**: Promote users as needed (technician → manager → admin)
3. **Super Admin**: Only grant to trusted platform administrators
4. **Regular Audits**: Review user roles periodically
5. **Documentation**: Keep this document updated when adding new features

---

**Last Updated**: November 26, 2025
**Version**: 2.0 - Role-based system with tenant_role and is_super_admin
