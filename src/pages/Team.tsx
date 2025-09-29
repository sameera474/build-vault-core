import { useAuth } from '@/contexts/AuthContext';
import { TeamManagement } from '@/components/TeamManagement';
import { SuperAdminTeamManagement } from '@/components/SuperAdminTeamManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

export default function Team() {
  const { profile } = useAuth();
  const { isSuperAdmin } = usePermissions();

  const roleFeatures = {
    admin: [
      'Full access to all features',
      'Manage team members and invitations',
      'Create and manage projects',
      'Approve test reports',
      'Access all company data'
    ],
    project_manager: [
      'Manage assigned projects',
      'Assign team members to projects',
      'Review and approve reports',
      'Track project progress',
      'Access project analytics'
    ],
    quality_manager: [
      'Oversee quality control processes',
      'Review test methodologies',
      'Approve quality standards',
      'Monitor compliance',
      'Generate quality reports'
    ],
    material_engineer: [
      'Create and manage test procedures',
      'Analyze material properties',
      'Review technical specifications',
      'Validate test results',
      'Technical report approval'
    ],
    technician: [
      'Perform material testing',
      'Create test reports',
      'Upload test data',
      'View assigned projects',
      'Follow test procedures'
    ],
    consultant_engineer: [
      'Review project specifications',
      'Provide technical consultation',
      'Final approval authority',
      'Quality assurance review',
      'Read-only access until approval'
    ],
    consultant_technician: [
      'Review technical procedures',
      'Validate test methods',
      'Provide technical input',
      'Read-only access until approval',
      'Support quality processes'
    ]
  };

  const currentUserRole = (profile as any)?.tenant_role || profile?.role || 'technician';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
        <p className="text-muted-foreground">
          Ownership & Roles (Multi-tenant) - Manage your team members, roles, and project assignments
        </p>
      </div>

      {/* Hierarchy Info */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Shield className="h-5 w-5" />
            Project Hierarchy & Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-blue-800">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Hierarchy:</h4>
              <p className="text-sm">Company → Admin → Projects</p>
              <p className="text-sm">Per project: Admin assigns Project Managers, Quality Manager, Material Engineer, Technicians, and Consultant reviewers.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Consultant Rules:</h4>
              <p className="text-sm">• Consultants are read-only until approval step</p>
              <p className="text-sm">• Finalization requires consultant approval if flagged</p>
              <p className="text-sm">• A PM can own multiple projects</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Role Permissions Overview */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role Permissions
            </CardTitle>
            <CardDescription>
              Detailed role capabilities in the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(roleFeatures).map(([role, features]) => (
              <div key={role} className="space-y-2">
                <h4 className="font-medium capitalize flex items-center gap-2">
                  {role.replace('_', ' ')}
                  {role.includes('consultant') && (
                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                  )}
                </h4>
                <ul className="space-y-1">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Current User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Role
            </CardTitle>
            <CardDescription>
              Your current permissions and access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium">{profile?.name || 'User'}</p>
                <p className="text-sm text-muted-foreground">
                  {currentUserRole.charAt(0).toUpperCase() + currentUserRole.slice(1).replace('_', ' ')}
                  {(profile as any)?.is_super_admin && (
                    <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                      Super Admin
                    </span>
                  )}
                </p>
              </div>
              <div className="pt-2">
                <h5 className="text-sm font-medium mb-2">Your Permissions:</h5>
                <ul className="space-y-1 max-h-32 overflow-y-auto">
                  {roleFeatures[currentUserRole as keyof typeof roleFeatures]?.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Account Activity
            </CardTitle>
            <CardDescription>
              Your account information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Account created</span>
                <span className="text-sm font-medium">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Company ID</span>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {profile?.company_id?.slice(0, 8)}...
                </span>
              </div>
              {(profile as any)?.is_super_admin && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Admin Level</span>
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                    SUPER ADMIN
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Management Component */}
      <div className="lg:col-span-2">
        <TeamManagement />
      </div>

      {/* Super Admin Section */}
      {isSuperAdmin && (
        <div className="lg:col-span-2">
          <SuperAdminTeamManagement />
        </div>
      )}
    </div>
  );
}