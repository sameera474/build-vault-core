import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, AlertTriangle, CheckCircle, Clock, FileText, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  totalReports: number;
  pendingApprovals: number;
  complianceRate: number;
  activeProjects: number;
  teamMembers: number;
  recentActivity: any[];
  complianceByMonth: any[];
  testTypeDistribution: any[];
  projectProgress: any[];
  complianceTrends: any[];
}

export function AdvancedAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const { profile } = useAuth();

  useEffect(() => {
    fetchAnalyticsData();
  }, [profile?.company_id, timeRange]);

  const fetchAnalyticsData = async () => {
    if (!profile?.company_id) return;

    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      // Fetch all required data in parallel
      const [
        reportsResponse,
        projectsResponse,
        profilesResponse,
        approvalsResponse
      ] = await Promise.all([
        supabase
          .from('test_reports')
          .select('*')
          .eq('company_id', profile.company_id)
          .gte('created_at', startDate.toISOString()),
        
        supabase
          .from('projects')
          .select('*')
          .eq('company_id', profile.company_id),
        
        supabase
          .from('profiles')
          .select('*')
          .eq('company_id', profile.company_id),
        
        supabase
          .from('test_reports')
          .select('*')
          .eq('company_id', profile.company_id)
          .eq('compliance_status', 'pending')
      ]);

      const reports = reportsResponse.data || [];
      const projects = projectsResponse.data || [];
      const profiles = profilesResponse.data || [];
      const pendingApprovals = approvalsResponse.data || [];

      // Calculate metrics
      const totalReports = reports.length;
      const activeProjects = projects.filter(p => p.status === 'active').length;
      const teamMembers = profiles.length;
      
      const passedReports = reports.filter(r => r.compliance_status === 'pass').length;
      const complianceRate = totalReports > 0 ? (passedReports / totalReports) * 100 : 0;

      // Group by test type
      const testTypeCount = reports.reduce((acc, report) => {
        acc[report.test_type] = (acc[report.test_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const testTypeDistribution = Object.entries(testTypeCount).map(([name, value]) => ({
        name,
        value,
        percentage: ((value / totalReports) * 100).toFixed(1)
      }));

      // Group by month for compliance trends
      const monthlyData = reports.reduce((acc, report) => {
        const month = new Date(report.created_at).toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        });
        
        if (!acc[month]) {
          acc[month] = { month, total: 0, passed: 0, failed: 0 };
        }
        
        acc[month].total++;
        if (report.compliance_status === 'pass') acc[month].passed++;
        if (report.compliance_status === 'fail') acc[month].failed++;
        
        return acc;
      }, {} as Record<string, any>);

      const complianceByMonth = Object.values(monthlyData).map((item: any) => ({
        ...item,
        rate: item.total > 0 ? ((item.passed / item.total) * 100).toFixed(1) : 0
      }));

      // Project progress
      const projectProgress = await Promise.all(
        projects.slice(0, 5).map(async (project) => {
          const { data: projectReports } = await supabase
            .from('test_reports')
            .select('compliance_status')
            .eq('project_id', project.id);

          const total = projectReports?.length || 0;
          const completed = projectReports?.filter(r => 
            r.compliance_status === 'pass' || r.compliance_status === 'fail'
          ).length || 0;

          return {
            name: project.name.substring(0, 20) + (project.name.length > 20 ? '...' : ''),
            progress: total > 0 ? Math.round((completed / total) * 100) : 0,
            total,
            completed
          };
        })
      );

      // Recent activity (last 10 reports)
      const recentActivity = reports
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map(report => ({
          id: report.id,
          type: 'test_report',
          title: `${report.test_type} - ${report.report_number}`,
          status: report.compliance_status,
          date: report.created_at,
          technician: report.technician_name
        }));

      setData({
        totalReports,
        pendingApprovals: pendingApprovals.length,
        complianceRate,
        activeProjects,
        teamMembers,
        recentActivity,
        complianceByMonth,
        testTypeDistribution,
        projectProgress,
        complianceTrends: complianceByMonth
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-600 bg-green-100';
      case 'fail': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Advanced Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your construction testing operations
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              Last {timeRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.complianceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {data.complianceRate >= 90 ? (
                <span className="text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Excellent
                </span>
              ) : data.complianceRate >= 75 ? (
                <span className="text-yellow-600">Good</span>
              ) : (
                <span className="text-red-600 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  Needs attention
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">
              {data.pendingApprovals > 5 ? (
                <span className="text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  High volume
                </span>
              ) : (
                <span className="text-green-600">Normal</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.teamMembers}</div>
            <p className="text-xs text-muted-foreground">
              Active users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Compliance Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Trends</CardTitle>
            <CardDescription>Monthly compliance rate over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.complianceByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Test Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Test Type Distribution</CardTitle>
            <CardDescription>Breakdown of test types performed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.testTypeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.testTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Project Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
            <CardDescription>Testing completion by project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.projectProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="progress" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest test reports and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {data.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.technician && `by ${activity.technician} • `}
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={getStatusColor(activity.status)}>
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}