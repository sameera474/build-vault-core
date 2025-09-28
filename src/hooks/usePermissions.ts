import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Permission {
  id: string;
  role: string;
  permission: string;
  created_at: string;
}

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