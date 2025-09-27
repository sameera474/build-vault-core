import { useAuth } from '@/contexts/AuthContext';
import { TeamManagement } from '@/components/TeamManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, CheckCircle, Clock } from 'lucide-react';

export default function Team() {
  const { profile } = useAuth();

  const roleFeatures = {
    admin: [
      'Full access to all features',
      'Manage team members and invitations',
      'Create and manage projects',
      'Approve test reports',
      'Access all company data'
    ],
    user: [
      'Create and edit test reports',
      'View assigned projects',
      'Upload documents',
      'View monthly summaries',
      'Access chainage charts'
    ],
    viewer: [
      'View test reports',
      'View monthly summaries',
      'View chainage charts',
      'Download documents',
      'Read-only access'
    ]
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
        <p className="text-muted-foreground">
          Manage your team members, roles, and permissions
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Role Permissions Overview */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role Permissions
            </CardTitle>
            <CardDescription>
              Overview of what each role can do
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(roleFeatures).map(([role, features]) => (
              <div key={role} className="space-y-2">
                <h4 className="font-medium capitalize">{role}</h4>
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
              Your current permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium">{profile?.name || 'User'}</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Loading...'}
                </p>
              </div>
              <div className="pt-2">
                <h5 className="text-sm font-medium mb-2">Your Permissions:</h5>
                <ul className="space-y-1">
                  {profile?.role && roleFeatures[profile.role as keyof typeof roleFeatures]?.map((feature, index) => (
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
              Activity
            </CardTitle>
            <CardDescription>
              Recent team activity
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Management Component */}
      <div className="lg:col-span-2">
        <TeamManagement />
      </div>
    </div>
  );
}