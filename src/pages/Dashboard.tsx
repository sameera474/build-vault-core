import { BarChart3, FileText, Users, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const stats = [
  {
    title: 'Test Reports',
    value: '0',
    description: 'Total reports created',
    icon: FileText,
  },
  {
    title: 'Active Projects',
    value: '0',
    description: 'Projects in progress',
    icon: BarChart3,
  },
  {
    title: 'Team Members',
    value: '1',
    description: 'Users in your organization',
    icon: Users,
  },
  {
    title: 'Compliance Rate',
    value: '100%',
    description: 'Tests meeting standards',
    icon: CheckCircle,
  },
];

export default function Dashboard() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome back, {profile?.name || 'User'}!
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your testing operations.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coming Soon Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Testing Main Features</CardTitle>
            <CardDescription>
              Advanced testing management tools are coming soon in Phase 1.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Test Reports & Templates</li>
              <li>• Monthly Summaries</li>
              <li>• Chainage Bar Charts</li>
              <li>• Approval Workflows</li>
              <li>• Excel-like Editor</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Your Organization</CardTitle>
            <CardDescription>
              Company information and settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Role:</span>{' '}
                <span className="text-muted-foreground capitalize">{profile?.role}</span>
              </div>
              <div>
                <span className="font-medium">Company ID:</span>{' '}
                <span className="text-muted-foreground font-mono text-xs">
                  {profile?.company_id}
                </span>
              </div>
              <div>
                <span className="font-medium">Member since:</span>{' '}
                <span className="text-muted-foreground">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}