import { Badge } from '@/components/ui/badge';
import { Shield, Crown, Users, Eye } from 'lucide-react';
import { UserRole } from '@/types/auth';

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return {
          label: 'Super Admin',
          icon: Crown,
          variant: 'destructive' as const,
          className: 'bg-purple-600 text-white'
        };
      case 'company_admin':
      case 'admin':
        return {
          label: 'Company Admin',
          icon: Shield,
          variant: 'default' as const,
          className: 'bg-blue-600 text-white'
        };
      case 'staff':
        return {
          label: 'Staff',
          icon: Users,
          variant: 'secondary' as const,
          className: 'bg-green-600 text-white'
        };
      case 'project_manager':
        return {
          label: 'Project Manager',
          icon: Eye,
          variant: 'outline' as const,
          className: 'bg-amber-600 text-white'
        };
      default:
        return {
          label: 'User',
          icon: Users,
          variant: 'secondary' as const,
          className: ''
        };
    }
  };

  const { label, icon: Icon, className: roleClassName } = getRoleConfig(role);

  return (
    <Badge className={`flex items-center gap-1 ${roleClassName} ${className || ''}`}>
      <Icon size={12} />
      {label}
    </Badge>
  );
}