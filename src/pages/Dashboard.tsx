import { useEffect, useState } from 'react';
import { BarChart3, FileText, Users, CheckCircle, Upload, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/FileUpload';
import { useAuth } from '@/contexts/AuthContext';
import { TeamManagement } from '@/components/TeamManagement';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  projectCount: number;
  testReportCount: number;
  teamMemberCount: number;
  complianceRate: number;
}

interface Project {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

interface TestReport {
  id: string;
  report_number: string;
  test_type: string;
  compliance_status: string;
  test_date: string;
  project_id: string;
}

export default function Dashboard() {
  const { profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    projectCount: 0,
    testReportCount: 0,
    teamMemberCount: 1,
    complianceRate: 100,
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentReports, setRecentReports] = useState<TestReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile?.company_id) return;

      try {
        // Fetch projects count
        const { count: projectCount } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', profile.company_id);

        // Fetch test reports count
        const { count: testReportCount } = await supabase
          .from('test_reports')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', profile.company_id);

        // Fetch team members count (users in same company)
        const { count: teamMemberCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', profile.company_id);

        // Calculate compliance rate
        const { data: complianceData } = await supabase
          .from('test_reports')
          .select('compliance_status')
          .eq('company_id', profile.company_id);

        let complianceRate = 100;
        if (complianceData && complianceData.length > 0) {
          const passedTests = complianceData.filter(r => r.compliance_status === 'pass').length;
          complianceRate = Math.round((passedTests / complianceData.length) * 100);
        }

        // Fetch recent projects
        const { data: projects } = await supabase
          .from('projects')
          .select('id, name, status, created_at')
          .eq('company_id', profile.company_id)
          .order('created_at', { ascending: false })
          .limit(5);

        // Fetch recent test reports
        const { data: reports } = await supabase
          .from('test_reports')
          .select('id, report_number, test_type, compliance_status, test_date, project_id')
          .eq('company_id', profile.company_id)
          .order('created_at', { ascending: false })
          .limit(5);

        setStats({
          projectCount: projectCount || 0,
          testReportCount: testReportCount || 0,
          teamMemberCount: teamMemberCount || 1,
          complianceRate,
        });

        setRecentProjects(projects || []);
        setRecentReports(reports || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (profile?.company_id) {
      fetchDashboardData();
    }
  }, [profile?.company_id]);

  const createSampleData = async () => {
    if (!profile?.company_id) return;

    try {
      // Create a sample project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          company_id: profile.company_id,
          name: 'Sample Construction Project',
          description: 'A sample project for testing',
          location: '123 Construction Ave',
          status: 'active',
          created_by: profile.user_id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Create sample test reports
      const testReports = [
        {
          company_id: profile.company_id,
          project_id: project.id,
          report_number: 'TR-001',
          test_type: 'Concrete Compression',
          material_type: 'Concrete',
          test_date: new Date().toISOString().split('T')[0],
          technician_name: 'John Doe',
          compliance_status: 'pass',
          results: { strength: '25 MPa', age: '28 days' },
          created_by: profile.user_id,
        },
        {
          company_id: profile.company_id,
          project_id: project.id,
          report_number: 'TR-002',
          test_type: 'Steel Tensile',
          material_type: 'Steel',
          test_date: new Date().toISOString().split('T')[0],
          technician_name: 'Jane Smith',
          compliance_status: 'pass',
          results: { yield_strength: '400 MPa', ultimate_strength: '520 MPa' },
          created_by: profile.user_id,
        },
      ];

      const { error: reportsError } = await supabase
        .from('test_reports')
        .insert(testReports);

      if (reportsError) throw reportsError;

      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error creating sample data:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {profile?.name || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your testing operations.
          </p>
        </div>
        {stats.projectCount === 0 && (
          <Button onClick={createSampleData} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Sample Data
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.testReportCount}</div>
            <p className="text-xs text-muted-foreground">Total reports created</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projectCount}</div>
            <p className="text-xs text-muted-foreground">Projects in progress</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamMemberCount}</div>
            <p className="text-xs text-muted-foreground">Users in your organization</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.complianceRate}%</div>
            <p className="text-xs text-muted-foreground">Tests meeting standards</p>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon & File Upload Section */}
      <div className="grid gap-6 md:grid-cols-3">
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

        {/* File Upload Component */}
        <FileUpload 
          bucket="documents" 
          accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls" 
          maxSize={10}
        />
      </div>

      {/* Avatar Upload Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <FileUpload 
          bucket="avatars" 
          accept="image/*" 
          maxSize={2}
        />
        
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              File Storage Features
            </CardTitle>
            <CardDescription>
              Your file storage capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✅ Document uploads (private)</li>
              <li>✅ Avatar/image uploads (public)</li>
              <li>✅ Secure file access</li>
              <li>✅ File management</li>
              <li>⏳ Batch operations (coming soon)</li>
              <li>⏳ File sharing (coming soon)</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Team Management Section */}
      <TeamManagement />
    </div>
  );
}