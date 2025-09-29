import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Search, Filter, Eye, Send, CheckCircle, XCircle, BarChart3, FolderPlus, Building2, Trash2, Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { CreateTestReportDialog } from '@/components/CreateTestReportDialog';
import FlowDiagram from '@/components/FlowDiagram';

interface Company {
  id: string;
  name: string;
  description?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  company_id: string;
  companies?: {
    name: string;
  };
}

interface TestReport {
  id: string;
  report_number: string;
  project_id: string;
  company_id: string;
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
  technician_name?: string;
  projects?: {
    name: string;
    companies?: {
      name: string;
    };
  };
}

export default function TestReports() {
  const { profile } = useAuth();
  const { isSuperAdmin, userRole, hasPermission } = usePermissions();
  const navigate = useNavigate();
  const [reports, setReports] = useState<TestReport[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    company: '',
    project: '',
    material: '',
    testType: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    if (profile?.company_id) {
      if (isSuperAdmin) {
        fetchCompanies();
      }
      fetchProjects();
    }
  }, [profile?.company_id, isSuperAdmin]);

  // Separate effect for filters with debouncing
  useEffect(() => {
    if (!profile?.company_id) return;
    
    const timeoutId = setTimeout(() => {
      fetchReports();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [profile?.company_id, filters, isSuperAdmin]);

  const fetchReports = async () => {
    if (!profile?.company_id) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('test_reports')
        .select(`
          *,
          projects (
            name,
            companies (
              name
            )
          )
        `);

      // Apply role-based filtering
      if (!isSuperAdmin) {
        // For non-super admins, filter by company
        query = query.eq('company_id', profile.company_id);
      }

      query = query.order('created_at', { ascending: false });

      // Apply filters
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.trim();
        query = query.or(`report_number.ilike.%${searchTerm}%,road_name.ilike.%${searchTerm}%,laboratory_test_no.ilike.%${searchTerm}%,technician_name.ilike.%${searchTerm}%`);
      }
      if (filters.company && filters.company !== 'all' && filters.company !== '') {
        query = query.eq('company_id', filters.company);
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

  const fetchCompanies = async () => {
    if (!isSuperAdmin) return;
    
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, description')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching companies:', error);
      return;
    }

    setCompanies(data || []);
  };

  const fetchProjects = async () => {
    if (!profile?.company_id) return;
    
    let query = supabase
      .from('projects')
      .select(`
        id, 
        name, 
        description,
        company_id,
        companies (
          name
        )
      `);

    // Apply role-based filtering for projects
    if (!isSuperAdmin) {
      query = query.eq('company_id', profile.company_id);
    }

    const { data, error } = await query;

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
    // Only admins can approve reports
    if (!hasPermission('approve_reports') && !isSuperAdmin && !['company_admin', 'admin'].includes(userRole)) {
      toast({
        title: "Error",
        description: "You don't have permission to approve reports",
        variant: "destructive",
      });
      return;
    }

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
    // Only admins can reject reports
    if (!hasPermission('approve_reports') && !isSuperAdmin && !['company_admin', 'admin'].includes(userRole)) {
      toast({
        title: "Error",
        description: "You don't have permission to reject reports",
        variant: "destructive",
      });
      return;
    }

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
    // Only admins can delete reports
    if (!isSuperAdmin && !['company_admin', 'admin'].includes(userRole)) {
      toast({
        title: "Error",
        description: "You don't have permission to delete reports",
        variant: "destructive",
      });
      return;
    }

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
        <h1 className="text-3xl font-bold">Test Reports</h1>
        <div className="flex gap-2">
          {projects.length === 0 ? (
            <Button onClick={() => navigate('/projects')}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Project First
            </Button>
          ) : (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Test Report
            </Button>
          )}
        </div>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderPlus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Projects Found</h3>
            <p className="text-muted-foreground mt-2 text-center">
              You need to create a project before you can create test reports.
            </p>
            <Button onClick={() => navigate('/projects')} className="mt-4">
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Your First Project
            </Button>
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
                          company: '',
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
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
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

                      {/* Company Filter - Only for Super Admin */}
                      {isSuperAdmin && (
                        <div>
                          <Label htmlFor="company">Company</Label>
                          <Select
                            value={filters.company}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, company: value, project: '' }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All companies" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All companies</SelectItem>
                              {companies.map(company => (
                                <SelectItem key={company.id} value={company.id}>
                                  {company.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
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
                            {projects
                              .filter(project => !filters.company || filters.company === 'all' || project.company_id === filters.company)
                              .map(project => (
                              <SelectItem key={project.id} value={project.id}>
                                {isSuperAdmin && project.companies?.name ? `${project.companies.name} - ${project.name}` : project.name}
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
                          onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="dateTo">Date To</Label>
                        <Input
                          id="dateTo"
                          type="date"
                          value={filters.dateTo}
                          onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reports Display */}
                {isSuperAdmin ? (
                  <SuperAdminReportsView 
                    reports={reports}
                    loading={loading}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onDelete={handleDelete}
                    onSubmit={handleSubmitForApproval}
                    onView={(id) => navigate(`/test-reports/${id}`)}
                    onEdit={(id) => navigate(`/test-reports/${id}/edit`)}
                    userRole={userRole}
                  />
                ) : (
                  <RegularReportsView 
                    reports={reports}
                    loading={loading}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onDelete={handleDelete}
                    onSubmit={handleSubmitForApproval}
                    onView={(id) => navigate(`/test-reports/${id}`)}
                    onEdit={(id) => navigate(`/test-reports/${id}/edit`)}
                    userRole={userRole}
                  />
                )}
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

// Super Admin View - Organized by Company and Project
interface ReportsViewProps {
  reports: TestReport[];
  loading: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  userRole: string;
}

function SuperAdminReportsView({ reports, loading, onApprove, onReject, onDelete, onSubmit, onView, onEdit, userRole }: ReportsViewProps) {
  // Group reports by company, then by project
  const groupedReports = reports.reduce((acc, report) => {
    const companyName = report.projects?.companies?.name || 'Unknown Company';
    const projectName = report.projects?.name || 'Unknown Project';
    
    if (!acc[companyName]) {
      acc[companyName] = {};
    }
    if (!acc[companyName][projectName]) {
      acc[companyName][projectName] = [];
    }
    acc[companyName][projectName].push(report);
    return acc;
  }, {} as Record<string, Record<string, TestReport[]>>);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedReports).map(([companyName, projects]) => (
        <Card key={companyName}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {companyName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {Object.entries(projects).map(([projectName, projectReports]) => (
                <AccordionItem key={projectName} value={projectName}>
                  <AccordionTrigger>
                    {projectName} ({projectReports.length} reports)
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      {projectReports.map((report) => (
                        <ReportCard
                          key={report.id}
                          report={report}
                          onApprove={onApprove}
                          onReject={onReject}
                          onDelete={onDelete}
                          onSubmit={onSubmit}
                          onView={onView}
                          onEdit={onEdit}
                          userRole={userRole}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Regular View - Simple grid layout
function RegularReportsView({ reports, loading, onApprove, onReject, onDelete, onSubmit, onView, onEdit, userRole }: ReportsViewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {reports.map((report) => (
        <ReportCard
          key={report.id}
          report={report}
          onApprove={onApprove}
          onReject={onReject}
          onDelete={onDelete}
          onSubmit={onSubmit}
          onView={onView}
          onEdit={onEdit}
          userRole={userRole}
        />
      ))}
    </div>
  );
}

// Individual Report Card Component
interface ReportCardProps {
  report: TestReport;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  userRole: string;
}

function ReportCard({ report, onApprove, onReject, onDelete, onSubmit, onView, onEdit, userRole }: ReportCardProps) {
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

  const canEdit = userRole !== 'project_manager' && (report.status === 'draft' || report.status === 'rejected');
  const canApprove = userRole === 'super_admin' || ['company_admin', 'admin'].includes(userRole);
  const canDelete = userRole === 'super_admin' || ['company_admin', 'admin'].includes(userRole);
  const canSubmit = userRole !== 'project_manager' && report.status === 'draft';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{report.report_number}</CardTitle>
            <p className="text-sm text-muted-foreground">{report.projects?.name}</p>
          </div>
          {getStatusBadge(report.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div><span className="font-medium">Test Type:</span> {report.test_type}</div>
          <div><span className="font-medium">Material:</span> {report.material}</div>
          <div><span className="font-medium">Road:</span> {report.road_name}</div>
          <div><span className="font-medium">Date:</span> {new Date(report.test_date).toLocaleDateString()}</div>
          {report.technician_name && (
            <div><span className="font-medium">Technician:</span> {report.technician_name}</div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          <Button size="sm" variant="outline" onClick={() => onView(report.id)}>
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => onEdit(report.id)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          
          {canSubmit && (
            <Button size="sm" onClick={() => onSubmit(report.id)}>
              <Send className="h-4 w-4 mr-1" />
              Submit
            </Button>
          )}
          
          {canApprove && report.status === 'submitted' && (
            <>
              <Button size="sm" variant="default" onClick={() => onApprove(report.id)}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onReject(report.id)}>
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </>
          )}
          
          {canDelete && (
            <Button size="sm" variant="destructive" onClick={() => onDelete(report.id)}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}