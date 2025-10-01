import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function ProjectManagerDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    activeProjects: 0,
    pendingApprovals: 0,
    completedTests: 0,
    complianceRate: 100,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.company_id) return;

      try {
        const { count: projectCount } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', profile.company_id)
          .eq('status', 'active');

        const { count: pendingCount } = await supabase
          .from('test_reports')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', profile.company_id)
          .eq('status', 'submitted');

        const { count: completedCount } = await supabase
          .from('test_reports')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', profile.company_id)
          .eq('status', 'approved');

        const { data: complianceData } = await supabase
          .from('test_reports')
          .select('compliance_status')
          .eq('company_id', profile.company_id);

        let complianceRate = 100;
        if (complianceData && complianceData.length > 0) {
          const passed = complianceData.filter(r => r.compliance_status === 'pass').length;
          complianceRate = Math.round((passed / complianceData.length) * 100);
        }

        setStats({
          activeProjects: projectCount || 0,
          pendingApprovals: pendingCount || 0,
          completedTests: completedCount || 0,
          complianceRate,
        });
      } catch (error) {
        console.error('Error fetching PM stats:', error);
      }
    };

    fetchStats();
  }, [profile?.company_id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Project Manager Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor project progress, approvals, and team performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">Projects in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">Reports awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tests</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTests}</div>
            <p className="text-xs text-muted-foreground">Approved reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.complianceRate}%</div>
            <p className="text-xs text-muted-foreground">Tests passing standards</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
