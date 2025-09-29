import { Badge } from '@/components/ui/badge';
import { Shield, User, UserCog, Eye } from 'lucide-react';
import { UserRole } from '@/hooks/usePermissions';

interface RoleBadgeProps {
  role: UserRole | null;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  if (!role) return null;

  const roleConfig = {
    super_admin: {
      label: 'Super Admin',
      icon: Shield,
      variant: 'default' as const,
      className: 'bg-purple-600 hover:bg-purple-700',
    },
    company_admin: {
      label: 'Company Admin',
      icon: Shield,
      variant: 'default' as const,
      className: 'bg-blue-600 hover:bg-blue-700',
    },
    admin: {
      label: 'Admin',
      icon: UserCog,
      variant: 'default' as const,
      className: 'bg-blue-500 hover:bg-blue-600',
    },
    staff: {
      label: 'Staff',
      icon: User,
      variant: 'secondary' as const,
      className: '',
    },
    project_manager: {
      label: 'Project Manager',
      icon: Eye,
      variant: 'outline' as const,
      className: '',
    },
  };

  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className} ${className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
