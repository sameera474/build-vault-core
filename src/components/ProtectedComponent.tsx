import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Shield } from 'lucide-react';

interface ProtectedComponentProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredPermissions?: string[];
  fallback?: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export function ProtectedComponent({ 
  children, 
  requiredPermission, 
  requiredPermissions,
  fallback,
  requireSuperAdmin = false
}: ProtectedComponentProps) {
  const { hasPermission, hasAnyPermission, isSuperAdmin, loading } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Check super admin requirement
  if (requireSuperAdmin && !isSuperAdmin) {
    return fallback || (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Shield className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Access restricted to super administrators
          </p>
        </div>
      </div>
    );
  }

  // Check single permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Shield className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            You don't have permission to access this feature
          </p>
        </div>
      </div>
    );
  }

  // Check multiple permissions (any)
  if (requiredPermissions && !hasAnyPermission(requiredPermissions)) {
    return fallback || (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Shield className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            You don't have permission to access this feature
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}