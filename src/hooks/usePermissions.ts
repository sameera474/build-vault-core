import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Type for user roles
export type UserRole = 'super_admin' | 'company_admin' | 'admin' | 'staff' | 'project_manager';

interface Permission {
  id: string;
  role: string;
  permission: string;
  created_at: string;
}

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
  role: UserRole | null;
}

export function useTestReportPermissions(): TestReportPermissions {
  const { profile } = useAuth();
  
  return useMemo(() => {
    const role = profile?.role as UserRole || null;
    
    // Super admin can do everything
    if (role === 'super_admin') {
      return {
        canCreateReport: true,
        canEditReport: true,
        canDeleteReport: true,
        canApproveReport: true,
        canRejectReport: true,
        canSubmitReport: true,
        canViewReports: true,
        isViewOnly: false,
        role,
      };
    }
    
    // Company admin and admin have full access within their company
    if (role === 'company_admin' || role === 'admin') {
      return {
        canCreateReport: true,
        canEditReport: true,
        canDeleteReport: true,
        canApproveReport: true,
        canRejectReport: true,
        canSubmitReport: true,
        canViewReports: true,
        isViewOnly: false,
        role,
      };
    }
    
    // Staff can create/edit/submit but not approve/reject
    if (role === 'staff') {
      return {
        canCreateReport: true,
        canEditReport: true,
        canDeleteReport: false,
        canApproveReport: false,
        canRejectReport: false,
        canSubmitReport: true,
        canViewReports: true,
        isViewOnly: false,
        role,
      };
    }
    
    // Project manager is view-only
    if (role === 'project_manager') {
      return {
        canCreateReport: false,
        canEditReport: false,
        canDeleteReport: false,
        canApproveReport: false,
        canRejectReport: false,
        canSubmitReport: false,
        canViewReports: true,
        isViewOnly: true,
        role,
      };
    }
    
    // Default: no permissions
    return {
      canCreateReport: false,
      canEditReport: false,
      canDeleteReport: false,
      canApproveReport: false,
      canRejectReport: false,
      canSubmitReport: false,
      canViewReports: false,
      isViewOnly: true,
      role,
    };
  }, [profile?.role]);
}

// Original hook for backward compatibility
export function usePermissions() {
  const { profile } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role) {
      fetchPermissions(profile.role);
    } else {
      setLoading(false);
    }
  }, [profile?.role]);

  const fetchPermissions = async (role: string) => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission')
        .eq('role', role);

      if (error) throw error;

      const userPermissions = data?.map(p => p.permission) || [];
      setPermissions(userPermissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    // Super admin always has all permissions
    if ((profile as any)?.is_super_admin) {
      return true;
    }
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionList: string[]): boolean => {
    // Super admin always has all permissions
    if ((profile as any)?.is_super_admin) {
      return true;
    }
    return permissionList.some(permission => permissions.includes(permission));
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    loading,
    isAdmin: (profile as any)?.is_super_admin || false,
    isSuperAdmin: (profile as any)?.is_super_admin || false,
    userRole: profile?.role || '',
  };
}
