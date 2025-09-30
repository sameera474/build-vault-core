import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Search, Filter, Eye, Send, CheckCircle, XCircle, BarChart3, FolderPlus, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { CreateTestReportDialog } from '@/components/CreateTestReportDialog';
import FlowDiagram from '@/components/FlowDiagram';
import { useTestReportPermissions } from '@/hooks/usePermissions';
import { RoleBadge } from '@/components/RoleBadge';

interface Project {
  id: string;
  name: string;
  description?: string;
}

interface TestReport {
  id: string;
  report_number: string;
  project_id: string;
  material: string;
  custom_material: string;
  road_name: string;
  chainage_from: string;
  chainage_to: string;
  side: string;
  laboratory_test_no: string;
  covered_chainage: string;
  road_offset: string;
  test_type: string;
  status: string;
  compliance_status: string;
  test_date: string;
  created_at: string;
  projects?: {
    name: string;
  };
}

export default function TestReports() {
  const { profile } = useAuth();
  const permissions = useTestReportPermissions();
  const navigate = useNavigate();
  const [reports, setReports] = useState<TestReport[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    project: '',
    material: '',
    testType: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    if (profile?.user_id) {
      fetchProjects();
    }
  }, [profile?.user_id]);

  // Separate effect for filters with debouncing
  useEffect(() => {
    if (!profile?.user_id) return;
    
    const timeoutId = setTimeout(() => {
      fetchReports();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [profile?.user_id, filters]);

  const fetchReports = async () => {
    if (!profile?.user_id) return;
    
    setLoading(true);
    try {
      // Let RLS handle filtering - no need to explicitly filter by company_id
      let query = supabase
        .from('test_reports')
        .select(`
          *,
          projects (
            name
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.trim();
        query = query.or(`report_number.ilike.%${searchTerm}%,road_name.ilike.%${searchTerm}%,laboratory_test_no.ilike.%${searchTerm}%,technician_name.ilike.%${searchTerm}%`);
      }
      if (filters.project && filters.project !== 'all' && filters.project !== '') {
        query = query.eq('project_id', filters.project);
      }
      if (filters.material && filters.material !== 'all' && filters.material !== '') {
        query = query.eq('material', filters.material as any);
      }
      if (filters.testType && filters.testType !== 'all' && filters.testType !== '') {
        query = query.eq('test_type', filters.testType);
      }
      if (filters.status && filters.status !== 'all' && filters.status !== '') {
        query = query.eq('status', filters.status as any);
      }
      if (filters.dateFrom && filters.dateFrom.trim()) {
        query = query.gte('test_date', filters.dateFrom);
      }
      if (filters.dateTo && filters.dateTo.trim()) {
        query = query.lte('test_date', filters.dateTo);
      }

      const { data, error } = await query;

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

  const fetchProjects = async () => {
    if (!profile?.user_id) return;
    
    // Use my_projects view which respects RLS and role-based access
    const { data, error } = await supabase
      .from('my_projects')
      .select('id, name, description');

    if (error) {
      console.error('Error fetching projects:', error);
      return;
    }

    setProjects(data || []);
  };

  const handleSubmitForApproval = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('test_reports')
        .update({ status: 'submitted' })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Report submitted for approval",
      });
      fetchReports();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Error",
        description: "Failed to submit report",
        variant: "destructive",
      });
    }
  };

  const handleApprove = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('test_reports')
        .update({ 
          status: 'approved',
          compliance_status: 'approved'
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Report approved successfully",
      });
      fetchReports();
    } catch (error) {
      console.error('Error approving report:', error);
      toast({
        title: "Error",
        description: "Failed to approve report",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('test_reports')
        .update({ 
          status: 'rejected',
          compliance_status: 'rejected'
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Report rejected",
      });
      fetchReports();
    } catch (error) {
      console.error('Error rejecting report:', error);
      toast({
        title: "Error",
        description: "Failed to reject report",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this test report? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('test_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Report deleted successfully",
      });
      fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'submitted':
        return <Badge variant="default">Submitted</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Test Reports</h1>
          <RoleBadge role={permissions.role} />
        </div>
        <div className="flex gap-2">
          {projects.length === 0 && (permissions.canCreateReport || permissions.role === 'super_admin' || permissions.role === 'company_admin' || permissions.role === 'admin') ? (
            <Button onClick={() => navigate('/projects')}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Project First
            </Button>
          ) : permissions.canCreateReport ? (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Test Report
            </Button>
          ) : null}
        </div>
      </div>

      {/* View-only alert for project managers */}
      {permissions.isViewOnly && permissions.role === 'project_manager' && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You have view-only access to assigned projects. Contact your administrator to request edit permissions.
          </AlertDescription>
        </Alert>
      )}

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderPlus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">
              {permissions.role === 'project_manager' || permissions.role === 'staff' 
                ? 'No Assigned Projects' 
                : 'No Projects Found'}
            </h3>
            <p className="text-muted-foreground mt-2 text-center">
              {permissions.role === 'project_manager' || permissions.role === 'staff'
                ? 'You have not been assigned to any projects yet. Contact your administrator.'
                : 'You need to create a project before you can create test reports.'}
            </p>
            {(permissions.role === 'super_admin' || permissions.role === 'company_admin' || permissions.role === 'admin') && (
              <Button onClick={() => navigate('/projects')} className="mt-4">
                <FolderPlus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs defaultValue="reports" className="space-y-4">
            <TabsList>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="flow">Process Flow</TabsTrigger>
            </TabsList>

            <TabsContent value="flow">
              <FlowDiagram />
            </TabsContent>

            <TabsContent value="reports">
              <div className="space-y-6">
                {/* Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {reports.length} report{reports.length !== 1 ? 's' : ''} found
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilters({
                          search: '',
                          project: '',
                          material: '',
                          testType: '',
                          status: '',
                          dateFrom: '',
                          dateTo: '',
                        })}
                      >
                        Clear Filters
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                        <Label htmlFor="project">Project</Label>
                        <Select
                          value={filters.project}
                          onValueChange={(value) => setFilters(prev => ({ ...prev, project: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All projects" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All projects</SelectItem>
                            {projects.map(project => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="material">Material</Label>
                        <Select
                          value={filters.material}
                          onValueChange={(value) => setFilters(prev => ({ ...prev, material: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All materials" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All materials</SelectItem>
                            <SelectItem value="soil">Soil</SelectItem>
                            <SelectItem value="concrete">Concrete</SelectItem>
                            <SelectItem value="aggregates">Aggregates</SelectItem>
                            <SelectItem value="asphalt">Asphalt</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="testType">Test Type</Label>
                        <Select
                          value={filters.testType}
                          onValueChange={(value) => setFilters(prev => ({ ...prev, testType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All test types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All test types</SelectItem>
                            <SelectItem value="Field Density">Field Density</SelectItem>
                            <SelectItem value="Atterberg Limits">Atterberg Limits</SelectItem>
                            <SelectItem value="Proctor Compaction">Proctor Compaction</SelectItem>
                            <SelectItem value="CBR">CBR</SelectItem>
                            <SelectItem value="Sieve Analysis (Fine/Coarse Aggregates)">Sieve Analysis</SelectItem>
                            <SelectItem value="Compressive Strength of Concrete">Compressive Strength</SelectItem>
                            <SelectItem value="Asphalt Core Density & Compaction">Asphalt Core Density</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={filters.status}
                          onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
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
                    </div>
                  </CardContent>
                </Card>

                {/* Reports Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardHeader>
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="h-3 bg-muted rounded"></div>
                            <div className="h-3 bg-muted rounded w-2/3"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : reports.length === 0 ? (
                    <Card className="col-span-full">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="text-center">
                          <h3 className="text-lg font-semibold">No test reports found</h3>
                          <p className="text-muted-foreground mt-2">
                            {permissions.canCreateReport 
                              ? 'Get started by creating your first test report.'
                              : 'No reports to display. Contact your administrator for access.'}
                          </p>
                          {permissions.canCreateReport && (
                            <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                              <Plus className="h-4 w-4 mr-2" />
                              Create Test Report
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    reports.map((report) => (
                      <Card key={report.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{report.report_number}</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {report.projects?.name || 'No project'}
                              </p>
                              {report.road_name && (
                                <p className="text-xs text-muted-foreground">
                                  {report.road_name} • {report.chainage_from} - {report.chainage_to}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              {getStatusBadge(report.status)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Material:</span>
                              <span className="capitalize">{report.material || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Test Type:</span>
                              <span>{report.test_type}</span>
                            </div>
                            {report.side && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Side:</span>
                                <span className="capitalize">{report.side}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Date:</span>
                              <span>{new Date(report.test_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-4 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/test-reports/${report.id}/edit`)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            
                            {report.status === 'draft' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSubmitForApproval(report.id)}
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Submit
                              </Button>
                            )}
                            
                            {report.status === 'submitted' && profile?.role === 'admin' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApprove(report.id)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReject(report.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            
                            {report.status === 'approved' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/barchart/${report.project_id}`)}
                              >
                                <BarChart3 className="h-3 w-3 mr-1" />
                                Chart
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      <CreateTestReportDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
