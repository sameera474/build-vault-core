import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  AppRole, 
  Permission, 
  hasPermission as rbacHasPermission,
  hasAnyPermission as rbacHasAnyPermission,
  hasAllPermissions as rbacHasAllPermissions
} from '@/lib/rbac';

// Type for user roles (exported for backward compatibility)
export type UserRole = AppRole;

// New hook for test report permissions
interface TestReportPermissions {
  canCreateReport: boolean;
  canEditReport: boolean;
  canDeleteReport: boolean;
  canApproveReport: boolean;
  canRejectReport: boolean;
  canSubmitReport: boolean;
  canViewReports: boolean;
  isViewOnly: boolean;
  role: string | null;
}

export function useTestReportPermissions(): TestReportPermissions {
  const { profile } = useAuth();
  
  return useMemo(() => {
    const role = profile?.tenant_role ?? profile?.role ?? null;
    
    // Map RBAC permissions to test report permissions
    return {
      canCreateReport: rbacHasPermission(role, 'create_reports'),
      canEditReport: rbacHasAnyPermission(role, ['create_reports', 'edit_own_reports']),
      canDeleteReport: rbacHasAnyPermission(role, ['manage_all_companies', 'manage_projects']),
      canApproveReport: rbacHasPermission(role, 'approve_reports'),
      canRejectReport: rbacHasPermission(role, 'approve_reports'),
      canSubmitReport: rbacHasAnyPermission(role, ['create_reports', 'review_reports']),
      canViewReports: rbacHasAnyPermission(role, ['view_company_reports', 'view_all_reports']),
      isViewOnly: !rbacHasAnyPermission(role, ['create_reports', 'edit_own_reports', 'approve_reports']),
      role,
    };
  }, [profile?.tenant_role, profile?.role]);
}

// Main permissions hook using RBAC
export function usePermissions() {
  const { profile } = useAuth();
  const role = profile?.tenant_role ?? profile?.role ?? null;

  return useMemo(() => {
    const hasPermission = (permission: string): boolean => {
      return rbacHasPermission(role, permission as Permission);
    };

    const hasAnyPermission = (permissionList: string[]): boolean => {
      return rbacHasAnyPermission(role, permissionList as Permission[]);
    };

    const hasAllPermissions = (permissionList: string[]): boolean => {
      return rbacHasAllPermissions(role, permissionList as Permission[]);
    };

    return {
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      loading: false, // No longer async since we're using in-memory maps
      isAdmin: role === 'admin' || role === 'super_admin',
      isSuperAdmin: role === 'super_admin',
      userRole: role || '',
    };
  }, [role]);
}
