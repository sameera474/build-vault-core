import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { UserRole } from '@/types/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface RequireRoleProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export function RequireRole({ 
  allowedRoles, 
  children, 
  fallback,
  redirectTo = '/unauthorized'
}: RequireRoleProps) {
  const { userRole } = useRoleAccess();

  if (!userRole) {
    return <Navigate to="/signin" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to access this feature. Required roles: {allowedRoles.join(', ')}
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}