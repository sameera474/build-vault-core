import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function TechnicianDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    testsToday: 0,
    passingTests: 0,
    pendingTests: 0,
    totalTests: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.user_id) return;

      try {
        const today = new Date().toISOString().split('T')[0];

        const { count: todayCount } = await supabase
          .from('test_reports')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', profile.user_id)
          .gte('test_date', today);

        const { data: allTests } = await supabase
          .from('test_reports')
          .select('compliance_status, status')
          .eq('created_by', profile.user_id);

        const passing = allTests?.filter(r => r.compliance_status === 'pass').length || 0;
        const pending = allTests?.filter(r => r.status === 'draft').length || 0;

        setStats({
          testsToday: todayCount || 0,
          passingTests: passing,
          pendingTests: pending,
          totalTests: allTests?.length || 0,
        });
      } catch (error) {
        console.error('Error fetching technician stats:', error);
      }
    };

    fetchStats();
  }, [profile?.user_id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Technician Dashboard</h1>
        <p className="text-muted-foreground">
          Your testing activity and performance summary
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests Today</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.testsToday}</div>
            <p className="text-xs text-muted-foreground">Completed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passing Tests</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.passingTests}</div>
            <p className="text-xs text-muted-foreground">Meeting standards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTests}</div>
            <p className="text-xs text-muted-foreground">Drafts to complete</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTests}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
