/**
 * RBAC (Role-Based Access Control) Configuration
 * Central source of truth for roles, redirects, menu visibility, and permissions
 */

export type AppRole =
  | "super_admin"
  | "admin"
  | "project_manager"
  | "quality_manager"
  | "technician"
  | "supervisor"
  | "consultant_engineer"
  | "consultant_technician";

/**
 * Role-based redirect map
 * Defines where each role lands after successful login
 */
export const roleRedirect: Record<AppRole, string> = {
  super_admin: "/super-admin",
  admin: "/dashboard/admin",
  project_manager: "/dashboard/pm",
  quality_manager: "/dashboard/qm",
  technician: "/dashboard/tech",
  supervisor: "/dashboard/supervisor",
  consultant_engineer: "/dashboard/consultant",
  consultant_technician: "/dashboard/consultant",
};

/**
 * Role-based menu visibility map
 * Defines which menu items (routes) each role can see
 */
export const roleMenuMap: Record<AppRole, string[]> = {
  super_admin: [
    "Dashboard",
    "Super Admin",
    "Audit Logs",
    "Companies",
    "Demo Users",
    "Fix Demo Users",
    "Test Reports",
    "Analytics",
    "Monthly Summaries",
    "Chainage Charts",
    "Laboratory Inventory",
    "Approvals",
    "Team",
    "Permissions",
    "Projects",
    "Automation",
    "Mobile",
    "Export",
    "Templates",
    "Documents",
    "Subscription",
  ],
  admin: [
    "Dashboard",
    "Test Reports",
    "Analytics",
    "Monthly Summaries",
    "Chainage Charts",
    "Laboratory Inventory",
    "Approvals",
    "Team",
    "Permissions",
    "Projects",
    "Automation",
    "Mobile",
    "Export",
    "Templates",
  ],
  project_manager: [
    "Dashboard",
    "Test Reports",
    "Analytics",
    "Monthly Summaries",
    "Chainage Charts",
    "Laboratory Inventory",
    "Approvals",
    "Team",
    "Projects",
    "Automation",
    "Mobile",
    "Export",
    "Templates",
  ],
  quality_manager: [
    "Dashboard",
    "Test Reports",
    "Analytics",
    "Monthly Summaries",
    "Chainage Charts",
    "Laboratory Inventory",
    "Approvals",
    "Team",
    "Projects",
    "Automation",
    "Mobile",
    "Export",
    "Templates",
  ],
  technician: [
    "Dashboard",
    "Test Reports",
    "Laboratory Inventory",
    "Mobile",
  ],
  supervisor: [
    "Dashboard",
    "Approvals",
    "Test Reports",
    "Laboratory Inventory",
    "Team",
    "Projects",
    "Analytics",
    "Monthly Summaries",
    "Chainage Charts",
    "Export",
  ],
  consultant_engineer: [
    "Dashboard",
    "Test Reports",
    "Analytics",
    "Chainage Charts",
    "Team",
  ],
  consultant_technician: [
    "Dashboard",
    "Test Reports",
    "Chainage Charts",
    "Team",
  ],
};

/**
 * Permission definitions
 */
export type Permission =
  // System-level permissions (super_admin only)
  | "view_system_analytics"
  | "manage_all_companies"
  | "manage_all_users"
  | "view_all_reports"
  | "impersonate_user"
  // Company-level permissions
  | "manage_company_users"
  | "manage_projects"
  | "manage_assigned_projects"
  | "assign_team_to_project"
  // Report permissions
  | "create_reports"
  | "edit_own_reports"
  | "view_company_reports"
  | "review_reports"
  | "approve_reports"
  | "review_reports_readonly"
  | "review_technical_readonly"
  | "final_approval_if_required"
  // Quality & template permissions
  | "review_quality"
  | "manage_templates"
  // Analytics & export
  | "view_analytics"
  | "export_data"
  | "export_own_data";

/**
 * Role-based permission map
 * Defines what capabilities each role has
 */
export const rolePermissionMap: Record<AppRole, Permission[]> = {
  super_admin: [
    "view_system_analytics",
    "manage_all_companies",
    "manage_all_users",
    "view_all_reports",
    "impersonate_user",
    "manage_company_users",
    "manage_projects",
    "create_reports",
    "view_company_reports",
    "approve_reports",
    "manage_templates",
    "export_data",
    "view_analytics",
  ],
  admin: [
    "manage_company_users",
    "manage_projects",
    "create_reports",
    "view_company_reports",
    "approve_reports",
    "manage_templates",
    "export_data",
    "view_analytics",
  ],
  project_manager: [
    "manage_projects",
    "manage_assigned_projects",
    "assign_team_to_project",
    "review_reports",
    "approve_reports",
    "view_company_reports",
    "create_reports",
    "view_analytics",
    "export_data",
    "manage_company_users",
  ],
  quality_manager: [
    "review_quality",
    "approve_reports",
    "manage_templates",
    "view_company_reports",
    "view_analytics",
    "export_data",
  ],
  technician: [
    "create_reports",
    "edit_own_reports",
    "view_company_reports",
    "view_analytics",
    "export_own_data",
  ],
  supervisor: ["approve_reports", "view_company_reports", "view_analytics"],
  consultant_engineer: [
    "review_reports_readonly",
    "final_approval_if_required",
    "view_company_reports",
    "view_analytics",
  ],
  consultant_technician: [
    "review_technical_readonly",
    "view_company_reports",
    "view_analytics",
  ],
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  role: string | null | undefined,
  permission: Permission
): boolean {
  if (!role) return false;
  const permissions = rolePermissionMap[role as AppRole];
  return permissions ? permissions.includes(permission) : false;
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
  role: string | null | undefined,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(
  role: string | null | undefined,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Get the redirect path for a role
 */
export function getRoleRedirect(role: string | null | undefined): string {
  if (!role) return "/dashboard";
  return roleRedirect[role as AppRole] ?? "/dashboard";
}

/**
 * Check if a role can see a specific menu item
 */
export function canSeeMenuItem(
  role: string | null | undefined,
  menuItem: string
): boolean {
  if (!role) return false;
  const allowedMenus = roleMenuMap[role as AppRole];
  return allowedMenus ? allowedMenus.includes(menuItem) : false;
}

/**
 * Check if user owns a resource
 */
export function isOwn(
  resourceCreatorId: string | null | undefined,
  userId: string | null | undefined
): boolean {
  if (!resourceCreatorId || !userId) return false;
  return resourceCreatorId === userId;
}
