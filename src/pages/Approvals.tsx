import { useState, useEffect } from 'react';
import { ApprovalWorkflow } from '@/components/ApprovalWorkflow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, TrendingUp, Eye, Calendar, Building, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';

interface TestReport {
  id: string;
  report_number: string;
  test_type: string;
  test_date: string;
  compliance_status: string;
  technician_name: string;
  material_type: string;
  material: string;
  custom_material: string;
  road_name: string;
  chainage_from: string;
  chainage_to: string;
  notes: string;
  created_at: string;
  updated_at: string;
  status: string;
  data_json: any;
  results: any;
  projects?: {
    name: string;
  };
}

interface ReportsListProps {
  reports: TestReport[];
  title: string;
}

const ReportsList: React.FC<ReportsListProps> = ({ reports, title }) => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    road: '',
  });

  const filteredReports = reports.filter(report => {
    const matchesSearch = !filters.search || 
      report.report_number.toLowerCase().includes(filters.search.toLowerCase()) ||
      report.test_type.toLowerCase().includes(filters.search.toLowerCase()) ||
      report.technician_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      report.road_name?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesDateFrom = !filters.dateFrom || new Date(report.test_date) >= new Date(filters.dateFrom);
    const matchesDateTo = !filters.dateTo || new Date(report.test_date) <= new Date(filters.dateTo);
    const matchesRoad = !filters.road || report.road_name?.toLowerCase().includes(filters.road.toLowerCase());

    return matchesSearch && matchesDateFrom && matchesDateTo && matchesRoad;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          <Badge variant="outline">{filteredReports.length}</Badge>
        </CardTitle>
        <CardDescription>
          Filter and view test reports by various criteria
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Advanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
          <div>
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search reports..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="dateFrom">Date From</Label>
            <Input
              id="dateFrom"
              type="date"
              value={filters.dateFrom}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="dateTo">Date To</Label>
            <Input
              id="dateTo"
              type="date"
              value={filters.dateTo}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="road">Road Name</Label>
            <Input
              id="road"
              placeholder="Filter by road..."
              value={filters.road}
              onChange={(e) => setFilters(prev => ({ ...prev, road: e.target.value }))}
            />
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-3">
          {filteredReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No reports found matching your criteria
            </div>
          ) : (
            filteredReports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{report.report_number}</h4>
                      {getStatusBadge(report.compliance_status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Test Type:</span>
                        <p>{report.test_type}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date:</span>
                        <p>{new Date(report.test_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Road:</span>
                        <p>{report.road_name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Technician:</span>
                        <p>{report.technician_name || 'N/A'}</p>
                      </div>
                    </div>
                    {report.chainage_from && report.chainage_to && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Chainage: {report.chainage_from} - {report.chainage_to}
                      </div>
                    )}
                     {/* Final Results Display */}
                    <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Final Results</span>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(report.compliance_status)}
                          {report.compliance_status === 'pass' && (
                            <span className="text-green-600 font-bold text-sm">✓ PASS</span>
                          )}
                          {report.compliance_status === 'fail' && (
                            <span className="text-red-600 font-bold text-sm">✗ FAIL</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Show summary if available */}
                      {(report.data_json || report.results) && (
                        <div className="text-xs space-y-1">
                          {report.data_json && typeof report.data_json === 'object' ? 
                            Object.entries(report.data_json).slice(0, 2).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-muted-foreground">{key}:</span>
                                <span className="font-medium">{String(value)}</span>
                              </div>
                            )) : 
                            report.results && typeof report.results === 'object' ? 
                              Object.entries(report.results).slice(0, 2).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-muted-foreground">{key}:</span>
                                  <span className="font-medium">{String(value)}</span>
                                </div>
                              )) :
                              <span>Test data available - Click view for details</span>
                          }
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/test-reports/${report.id}/edit`)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

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
  const navigate = useNavigate();

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
          <TabsTrigger value="pending">Pending Reports</TabsTrigger>
          <TabsTrigger value="approved">Approved Reports</TabsTrigger>
          <TabsTrigger value="rejected">Rejected Reports</TabsTrigger>
          <TabsTrigger value="history">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="workflow">
          <ApprovalWorkflow reports={reports} onApprovalUpdate={fetchReports} />
        </TabsContent>

        <TabsContent value="pending">
          <ReportsList reports={reports.filter(r => r.compliance_status === 'pending')} title="Pending Reports" />
        </TabsContent>

        <TabsContent value="approved">
          <ReportsList reports={reports.filter(r => r.compliance_status === 'approved')} title="Approved Reports" />
        </TabsContent>

        <TabsContent value="rejected">
          <ReportsList reports={reports.filter(r => r.compliance_status === 'rejected')} title="Rejected Reports" />
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