import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  FileText,
  Users,
  CheckCircle,
  Plus,
  TrendingUp,
  Clock,
  AlertCircle,
  FolderOpen,
  Activity,
  Calendar,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getRoleRedirect } from '@/lib/rbac';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { QuickActions } from '@/components/dashboard/QuickAction';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';

interface DashboardStats {
  projectCount: number;
  testReportCount: number;
  teamMemberCount: number;
  complianceRate: number;
  pendingApprovals: number;
  reportsThisWeek: number;
  reportsThisMonth: number;
}

interface Project {
  id: string;
  name: string;
  status: string;
  created_at: string;
  _count?: { test_reports: number };
}

interface TestReport {
  id: string;
  report_number: string;
  test_type: string;
  material: string;
  status: string;
  test_date: string;
  project_id: string;
  created_at: string;
}

export default function Dashboard() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    projectCount: 0,
    testReportCount: 0,
    teamMemberCount: 1,
    complianceRate: 100,
    pendingApprovals: 0,
    reportsThisWeek: 0,
    reportsThisMonth: 0,
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentReports, setRecentReports] = useState<TestReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && profile?.tenant_role) {
      const roleRedirect = getRoleRedirect(profile.tenant_role);
      if (roleRedirect !== '/dashboard') {
        navigate(roleRedirect, { replace: true });
      }
    }
  }, [profile?.tenant_role, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    if (!profile) return;

    try {
      const isSuperAdmin = profile.is_super_admin;
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Build queries with proper filtering
      let projectQuery = supabase.from('projects').select('*', { count: 'exact' });
      let reportsQuery = supabase.from('test_reports').select('*', { count: 'exact' });
      let teamQuery = supabase.from('profiles').select('*', { count: 'exact' });
      let weekReportsQuery = supabase.from('test_reports').select('*', { count: 'exact' }).gte('created_at', weekAgo.toISOString());
      let monthReportsQuery = supabase.from('test_reports').select('*', { count: 'exact' }).gte('created_at', monthAgo.toISOString());
      let pendingQuery = supabase.from('test_reports').select('*', { count: 'exact' }).eq('status', 'pending');

      if (!isSuperAdmin && profile.company_id) {
        projectQuery = projectQuery.eq('company_id', profile.company_id);
        reportsQuery = reportsQuery.eq('company_id', profile.company_id);
        teamQuery = teamQuery.eq('company_id', profile.company_id);
        weekReportsQuery = weekReportsQuery.eq('company_id', profile.company_id);
        monthReportsQuery = monthReportsQuery.eq('company_id', profile.company_id);
        pendingQuery = pendingQuery.eq('company_id', profile.company_id);
      }

      const [
        { count: projectCount },
        { count: testReportCount },
        { count: teamMemberCount },
        { count: reportsThisWeek },
        { count: reportsThisMonth },
        { count: pendingApprovals },
        { data: complianceData },
        { data: projects },
        { data: reports },
      ] = await Promise.all([
        projectQuery,
        reportsQuery,
        teamQuery,
        weekReportsQuery,
        monthReportsQuery,
        pendingQuery,
        reportsQuery.select('status'),
        projectQuery.select('*').order('created_at', { ascending: false }).limit(5),
        reportsQuery.select('*').order('created_at', { ascending: false }).limit(10),
      ]);

      let complianceRate = 100;
      if (complianceData && complianceData.length > 0) {
        const approvedTests = complianceData.filter(
          (r) => r.status === 'approved'
        ).length;
        complianceRate = Math.round((approvedTests / complianceData.length) * 100);
      }

      setStats({
        projectCount: projectCount || 0,
        testReportCount: testReportCount || 0,
        teamMemberCount: teamMemberCount || 1,
        complianceRate,
        pendingApprovals: pendingApprovals || 0,
        reportsThisWeek: reportsThisWeek || 0,
        reportsThisMonth: reportsThisMonth || 0,
      });

      setRecentProjects(projects || []);
      setRecentReports(reports || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Create Test Report',
      description: 'Add new material test',
      icon: Plus,
      onClick: () => navigate('/test-reports/new'),
    },
    {
      title: 'View Analytics',
      description: 'See detailed insights',
      icon: BarChart3,
      onClick: () => navigate('/analytics'),
    },
    {
      title: 'Manage Projects',
      description: 'View all projects',
      icon: FolderOpen,
      onClick: () => navigate('/projects'),
    },
    {
      title: 'Team Overview',
      description: 'Manage team members',
      icon: Users,
      onClick: () => navigate('/team'),
    },
  ];

  const activities = recentReports.slice(0, 8).map((report) => ({
    id: report.id,
    title: `${report.test_type || report.material || 'Test'} Report Created`,
    description: `Report #${report.report_number || report.id.slice(0, 8)}`,
    time: report.created_at,
    icon: FileText,
    status:
      report.status === 'approved'
        ? 'success'
        : report.status === 'rejected'
        ? 'error'
        : 'info',
  }));

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Header */}
      <DashboardHeader
        role={profile?.tenant_role || 'User'}
        userName={profile?.name || 'User'}
        description="Here's an overview of your construction testing operations and team performance."
      />

      {/* Quick Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Test Reports"
          value={stats.testReportCount}
          change="+15.2%"
          trend="up"
          icon={FileText}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-600"
          delay={0}
        />
        <StatCard
          title="Active Projects"
          value={stats.projectCount}
          change="+2 this month"
          trend="up"
          icon={FolderOpen}
          iconBg="bg-purple-500/10"
          iconColor="text-purple-600"
          delay={100}
        />
        <StatCard
          title="Compliance Rate"
          value={`${stats.complianceRate}%`}
          change="+2.3%"
          trend="up"
          icon={CheckCircle}
          iconBg="bg-green-500/10"
          iconColor="text-green-600"
          delay={200}
        />
        <StatCard
          title="Team Members"
          value={stats.teamMemberCount}
          change="Active"
          trend="neutral"
          icon={Users}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-600"
          delay={300}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border/50 hover:shadow-lg transition-all animate-fade-in" style={{ animationDelay: '400ms' }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold mt-1">{stats.reportsThisWeek}</p>
                <p className="text-xs text-muted-foreground mt-1">reports submitted</p>
              </div>
              <div className="rounded-xl bg-blue-500/10 p-3">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:shadow-lg transition-all animate-fade-in" style={{ animationDelay: '450ms' }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                <p className="text-2xl font-bold mt-1">{stats.pendingApprovals}</p>
                <p className="text-xs text-muted-foreground mt-1">awaiting review</p>
              </div>
              <div className="rounded-xl bg-yellow-500/10 p-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:shadow-lg transition-all animate-fade-in" style={{ animationDelay: '500ms' }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold mt-1">{stats.reportsThisMonth}</p>
                <p className="text-xs text-muted-foreground mt-1">total reports</p>
              </div>
              <div className="rounded-xl bg-purple-500/10 p-3">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Activity Timeline */}
      <div className="grid gap-6 lg:grid-cols-2">
        <QuickActions actions={quickActions} />
        <ActivityTimeline activities={activities} />
      </div>

      {/* Recent Projects & Reports */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Projects */}
        <Card className="border-border/50 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>Your latest active projects</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No projects yet</p>
                <Button size="sm" onClick={() => navigate('/projects/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Project
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentProjects.map((project, index) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${(index + 6) * 50}ms` }}
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${
                        project.status === 'active'
                          ? 'border-green-500/50 text-green-600'
                          : 'border-muted text-muted-foreground'
                      }`}
                    >
                      {project.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card className="border-border/50 animate-fade-in" style={{ animationDelay: '700ms' }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Latest test submissions</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/test-reports')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {recentReports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No reports yet</p>
                <Button size="sm" onClick={() => navigate('/test-reports/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Report
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
                {recentReports.map((report, index) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${(index + 7) * 50}ms` }}
                    onClick={() => navigate(`/test-reports/${report.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {report.test_type || report.material || 'Test Report'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {report.report_number || `#${report.id.slice(0, 8)}`} •{' '}
                        {new Date(report.test_date || report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${
                        report.status === 'approved'
                          ? 'border-green-500/50 text-green-600 bg-green-500/5'
                          : report.status === 'rejected'
                          ? 'border-red-500/50 text-red-600 bg-red-500/5'
                          : 'border-yellow-500/50 text-yellow-600 bg-yellow-500/5'
                      }`}
                    >
                      {report.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/50 animate-fade-in" style={{ animationDelay: '800ms' }}>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Your testing metrics at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Test Completion Rate</span>
                  <span className="font-medium">{stats.complianceRate}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${stats.complianceRate}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Weekly Goal Progress</span>
                  <span className="font-medium">{Math.min((stats.reportsThisWeek / 20) * 100, 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((stats.reportsThisWeek / 20) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Target</span>
                  <span className="font-medium">{Math.min((stats.reportsThisMonth / 80) * 100, 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((stats.reportsThisMonth / 80) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="border-border/50 animate-fade-in" style={{ animationDelay: '900ms' }}>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Platform health</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm">Database</span>
              </div>
              <Badge variant="outline" className="border-green-500/50 text-green-600">
                Operational
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm">Storage</span>
              </div>
              <Badge variant="outline" className="border-green-500/50 text-green-600">
                Operational
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm">API</span>
              </div>
              <Badge variant="outline" className="border-green-500/50 text-green-600">
                Operational
              </Badge>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">Last updated: Just now</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
