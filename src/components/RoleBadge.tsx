import { Badge } from '@/components/ui/badge';
import { Shield, User, UserCog, Eye, Microscope, HardHat, FileCheck, ClipboardCheck } from 'lucide-react';
import { AppRole } from '@/lib/rbac';

interface RoleBadgeProps {
  role: string | null;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  if (!role) return null;

  const roleConfig: Record<string, {
    label: string;
    icon: any;
    variant: 'default' | 'secondary' | 'outline' | 'destructive';
    className: string;
  }> = {
    super_admin: {
      label: 'Super Admin',
      icon: Shield,
      variant: 'default',
      className: 'bg-purple-600 hover:bg-purple-700 text-white',
    },
    admin: {
      label: 'Admin',
      icon: UserCog,
      variant: 'default',
      className: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    project_manager: {
      label: 'Project Manager',
      icon: Eye,
      variant: 'default',
      className: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
    quality_manager: {
      label: 'Quality Manager',
      icon: FileCheck,
      variant: 'default',
      className: 'bg-green-600 hover:bg-green-700 text-white',
    },
    technician: {
      label: 'Lab Technician',
      icon: Microscope,
      variant: 'secondary',
      className: '',
    },
    supervisor: {
      label: 'Site Supervisor',
      icon: HardHat,
      variant: 'default',
      className: 'bg-orange-600 hover:bg-orange-700 text-white',
    },
    consultant_engineer: {
      label: 'Consultant Engineer',
      icon: ClipboardCheck,
      variant: 'outline',
      className: '',
    },
    consultant_technician: {
      label: 'Consultant Technician',
      icon: User,
      variant: 'outline',
      className: '',
    },
    // Legacy roles for backward compatibility
    company_admin: {
      label: 'Company Admin',
      icon: Shield,
      variant: 'default',
      className: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    staff: {
      label: 'Staff',
      icon: User,
      variant: 'secondary',
      className: '',
    },
  };

  const config = roleConfig[role];
  
  if (!config) {
    return (
      <Badge variant="secondary" className={className}>
        <User className="h-3 w-3 mr-1" />
        {role}
      </Badge>
    );
  }

  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className} ${className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
