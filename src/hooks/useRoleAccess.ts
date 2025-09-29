import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

export function useRoleAccess() {
  const { profile } = useAuth();
  
  const userRole = profile?.role as UserRole;

  const permissions = {
    // View permissions
    canViewReports: Boolean(userRole),
    canViewAllReports: userRole === 'super_admin',
    canViewCompanyReports: ['super_admin', 'company_admin', 'admin'].includes(userRole),
    
    // Create/Edit permissions  
    canCreateReports: ['super_admin', 'company_admin', 'admin', 'staff'].includes(userRole),
    canEditReports: ['super_admin', 'company_admin', 'admin', 'staff'].includes(userRole),
    canDeleteReports: ['super_admin', 'company_admin', 'admin'].includes(userRole),
    
    // Approval permissions
    canApproveReports: ['super_admin', 'company_admin', 'admin'].includes(userRole),
    canRejectReports: ['super_admin', 'company_admin', 'admin'].includes(userRole),
    canSubmitReports: ['super_admin', 'company_admin', 'admin', 'staff'].includes(userRole),
    
    // Project management
    canCreateProjects: ['super_admin', 'company_admin', 'admin'].includes(userRole),
    canManageProjectMembers: ['super_admin', 'company_admin', 'admin'].includes(userRole),
    
    // Company management
    canManageCompany: ['super_admin', 'company_admin', 'admin'].includes(userRole),
    canViewAllCompanies: userRole === 'super_admin',
    
    // Special flags
    isViewOnly: userRole === 'project_manager',
    isStaff: userRole === 'staff',
    isAdmin: ['super_admin', 'company_admin', 'admin'].includes(userRole),
    isSuperAdmin: userRole === 'super_admin',
  };

  return {
    userRole,
    permissions,
    profile
  };
}