// Central permissions system for role-based access control

export type AppRole = 
  | 'super_admin'
  | 'admin'
  | 'project_manager'
  | 'quality_manager'
  | 'technician'
  | 'supervisor'
  | 'consultant_engineer'
  | 'consultant_technician';

export type Permission =
  | 'view_system_analytics'
  | 'manage_all_companies'
  | 'manage_all_users'
  | 'impersonate_user'
  | 'view_all_reports'
  | 'manage_company_users'
  | 'manage_projects'
  | 'create_reports'
  | 'view_company_reports'
  | 'approve_reports'
  | 'manage_templates'
  | 'export_data'
  | 'view_analytics'
  | 'manage_assigned_projects'
  | 'assign_team_to_project'
  | 'review_reports'
  | 'review_quality'
  | 'edit_own_reports'
  | 'export_own_data'
  | 'view_own_reports'
  | 'review_technical_readonly'
  | 'final_approval_if_required';

export interface RolePermissions {
  role: AppRole;
  permissions: Permission[];
  dashboardRoute: string;
}

// Role permissions mapping
export const rolePermissionsMap: Record<AppRole, Permission[]> = {
  super_admin: [
    'view_system_analytics',
    'manage_all_companies',
    'manage_all_users',
    'impersonate_user',
    'view_all_reports',
    'manage_company_users',
    'manage_projects',
    'create_reports',
    'view_company_reports',
    'approve_reports',
    'manage_templates',
    'export_data',
    'view_analytics',
  ],
  admin: [
    'manage_company_users',
    'manage_projects',
    'create_reports',
    'view_company_reports',
    'approve_reports',
    'manage_templates',
    'export_data',
    'view_analytics',
  ],
  project_manager: [
    'manage_assigned_projects',
    'assign_team_to_project',
    'review_reports',
    'approve_reports',
    'view_company_reports',
    'create_reports',
    'view_analytics',
    'export_data',
  ],
  quality_manager: [
    'review_quality',
    'approve_reports',
    'manage_templates',
    'view_company_reports',
    'view_analytics',
    'export_data',
  ],
  technician: [
    'create_reports',
    'edit_own_reports',
    'view_company_reports',
    'view_analytics',
    'export_own_data',
  ],
  supervisor: [
    'approve_reports',
    'view_company_reports',
    'view_analytics',
    'export_data',
  ],
  consultant_engineer: [
    'review_reports',
    'final_approval_if_required',
    'view_company_reports',
  ],
  consultant_technician: [
    'review_technical_readonly',
    'view_company_reports',
  ],
};

// Dashboard routes by role
export const roleDashboardMap: Record<AppRole, string> = {
  super_admin: '/super-admin',
  admin: '/dashboard/admin',
  project_manager: '/dashboard/pm',
  quality_manager: '/dashboard/qm',
  technician: '/dashboard/tech',
  supervisor: '/dashboard/supervisor',
  consultant_engineer: '/dashboard/consultant',
  consultant_technician: '/dashboard/consultant',
};

// Menu items by role
export interface MenuItem {
  title: string;
  url: string;
  icon: string;
  roles: AppRole[];
}

export const menuItemsByRole: Record<AppRole, string[]> = {
  super_admin: [
    'Dashboard',
    'Test Reports',
    'Analytics',
    'Monthly Summaries',
    'Chainage Charts',
    'Approvals',
    'Documents',
    'Team',
    'Projects',
    'Companies',
    'Users',
    'Super Admin',
    'Automation',
    'Mobile',
    'Export',
    'Templates',
  ],
  admin: [
    'Dashboard',
    'Test Reports',
    'Analytics',
    'Monthly Summaries',
    'Chainage Charts',
    'Approvals',
    'Documents',
    'Team',
    'Projects',
    'Automation',
    'Mobile',
    'Export',
    'Templates',
  ],
  project_manager: [
    'Dashboard',
    'Test Reports',
    'Analytics',
    'Monthly Summaries',
    'Chainage Charts',
    'Approvals',
    'Team',
    'Projects',
    'Automation',
    'Mobile',
    'Export',
    'Templates',
  ],
  quality_manager: [
    'Dashboard',
    'Test Reports',
    'Analytics',
    'Monthly Summaries',
    'Chainage Charts',
    'Approvals',
    'Team',
    'Projects',
    'Automation',
    'Mobile',
    'Export',
    'Templates',
  ],
  technician: [
    'Dashboard',
    'Test Reports',
    'Analytics',
    'Monthly Summaries',
    'Chainage Charts',
    'Approvals',
    'Mobile',
    'Export',
    'Templates',
  ],
  supervisor: [
    'Dashboard',
    'Approvals',
    'Test Reports',
    'Team',
    'Projects',
    'Analytics',
    'Monthly Summaries',
    'Chainage Charts',
    'Export',
  ],
  consultant_engineer: [
    'Dashboard',
    'Test Reports',
    'Analytics',
  ],
  consultant_technician: [
    'Dashboard',
    'Test Reports',
  ],
};

// Helper functions
export function hasPermission(userRole: AppRole | null, permission: Permission): boolean {
  if (!userRole) return false;
  return rolePermissionsMap[userRole]?.includes(permission) || false;
}

export function hasAnyPermission(userRole: AppRole | null, permissions: Permission[]): boolean {
  if (!userRole) return false;
  return permissions.some(p => hasPermission(userRole, p));
}

export function canAccessMenuItem(userRole: AppRole | null, menuItem: string): boolean {
  if (!userRole) return false;
  return menuItemsByRole[userRole]?.includes(menuItem) || false;
}

export function getDashboardRoute(userRole: AppRole | null): string {
  if (!userRole) return '/dashboard';
  return roleDashboardMap[userRole] || '/dashboard';
}

export function getRoleLabel(role: AppRole): string {
  const labels: Record<AppRole, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    project_manager: 'Project Manager',
    quality_manager: 'Quality Manager',
    technician: 'Lab Technician',
    supervisor: 'Site Supervisor',
    consultant_engineer: 'Consultant Engineer',
    consultant_technician: 'Consultant Technician',
  };
  return labels[role] || role;
}
