import { useState, useEffect } from 'react';
import { ApprovalWorkflow } from '@/components/ApprovalWorkflow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface TestReport {
  id: string;
  report_number: string;
  test_type: string;
  test_date: string;
  compliance_status: string;
  technician_name: string;
  material_type: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export default function Approvals() {
  const [reports, setReports] = useState<TestReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchReports = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('test_reports')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to load test reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [profile?.company_id]);

  const getStatusCounts = () => {
    const pending = reports.filter(r => r.compliance_status === 'pending').length;
    const approved = reports.filter(r => r.compliance_status === 'approved').length;
    const rejected = reports.filter(r => r.compliance_status === 'rejected').length;
    return { pending, approved, rejected };
  };

  const { pending, approved, rejected } = getStatusCounts();

  const getRecentActivity = () => {
    return reports
      .filter(r => r.compliance_status !== 'pending')
      .slice(0, 5)
      .map(report => ({
        ...report,
        activity_date: report.updated_at || report.created_at
      }))
      .sort((a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime());
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Approval Workflows</h1>
          <p className="text-muted-foreground">Review and approve test reports</p>
        </div>
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Approval Workflows</h1>
        <p className="text-muted-foreground">Review and approve test reports</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{reports.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="workflow" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflow">Approval Workflow</TabsTrigger>
          <TabsTrigger value="history">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="workflow">
          <ApprovalWorkflow reports={reports} onApprovalUpdate={fetchReports} />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Recently approved or rejected reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getRecentActivity().length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No recent approval activity
                  </p>
                ) : (
                  getRecentActivity().map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {report.compliance_status === 'approved' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium">{report.report_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {report.test_type} • {new Date(report.test_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={report.compliance_status === 'approved' ? 'secondary' : 'destructive'}
                          className={report.compliance_status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {report.compliance_status === 'approved' ? 'Approved' : 'Rejected'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(report.activity_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}