import { useState, useEffect } from 'react';
import { Plus, FileText, Edit, Trash2, Download, Filter, Table, Brush } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TestReportTemplate } from '@/components/TestReportTemplate';
import { DrawingCanvas } from '@/components/DrawingCanvas';
import { testReportSchema, type TestReportFormData } from '@/lib/validationSchemas';

interface Project {
  id: string;
  name: string;
}

interface TestReport {
  id: string;
  report_number: string;
  test_type: string;
  material_type: string;
  test_date: string;
  technician_name: string;
  compliance_status: string;
  results: any;
  notes: string;
  project_id: string;
  project?: { name: string };
  created_at: string;
}

const testTypes = [
  'Concrete Compression',
  'Steel Tensile',
  'Soil Compaction',
  'Asphalt Marshall',
  'Aggregate Gradation',
  'Rebar Testing',
  'Concrete Slump',
  'CBR Test',
  'Other'
];

const materialTypes = [
  'Concrete',
  'Steel',
  'Soil',
  'Asphalt',
  'Aggregate',
  'Rebar',
  'Other'
];

const complianceStatuses = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'pass', label: 'Pass', color: 'bg-green-100 text-green-800' },
  { value: 'fail', label: 'Fail', color: 'bg-red-100 text-red-800' },
  { value: 'review_required', label: 'Review Required', color: 'bg-orange-100 text-orange-800' }
];

export default function TestReports() {
  const [reports, setReports] = useState<TestReport[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<TestReport | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showExcelEditor, setShowExcelEditor] = useState(false);
  const [selectedReportForEditor, setSelectedReportForEditor] = useState<string | null>(null);
  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { profile } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    report_number: '',
    test_type: '',
    material_type: '',
    test_date: '',
    technician_name: '',
    compliance_status: 'pending',
    project_id: 'none',
    notes: '',
    results: {}
  });

  useEffect(() => {
    fetchReports();
    fetchProjects();
  }, [profile?.company_id]);

  const fetchReports = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('test_reports')
        .select(`
          *,
          projects (name)
        `)
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

  const fetchProjects = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('company_id', profile.company_id)
        .eq('status', 'active');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;

    // Validate form data
    const validation = testReportSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        errors[path] = issue.message;
      });
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setValidationErrors({});

    try {
      const reportData = {
        ...validation.data,
        project_id: validation.data.project_id === 'none' ? null : validation.data.project_id,
        company_id: profile.company_id,
        created_by: profile.user_id,
        results: validation.data.results || {}
      };

      let error;
      if (editingReport) {
        ({ error } = await supabase
          .from('test_reports')
          .update(reportData)
          .eq('id', editingReport.id));
      } else {
        ({ error } = await supabase
          .from('test_reports')
          .insert([reportData]));
      }

      if (error) throw error;

      toast({
        title: editingReport ? "Report updated" : "Report created",
        description: `Test report ${formData.report_number} has been ${editingReport ? 'updated' : 'created'} successfully.`,
      });

      resetForm();
      fetchReports();
    } catch (error: any) {
      console.error('Error saving report:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save test report",
        variant: "destructive",
      });
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('test_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Report deleted",
        description: "Test report has been removed successfully.",
      });

      fetchReports();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      report_number: '',
      test_type: '',
      material_type: '',
      test_date: '',
      technician_name: '',
      compliance_status: 'pending',
      project_id: 'none',
      notes: '',
      results: {}
    });
    setValidationErrors({});
    setEditingReport(null);
    setIsCreateOpen(false);
  };

  const openEditDialog = (report: TestReport) => {
    setFormData({
      report_number: report.report_number,
      test_type: report.test_type,
      material_type: report.material_type || '',
      test_date: report.test_date,
      technician_name: report.technician_name || '',
      compliance_status: report.compliance_status,
      project_id: report.project_id || '',
      notes: report.notes || '',
      results: report.results || {}
    });
    setEditingReport(report);
    setIsCreateOpen(true);
  };

  const openExcelEditor = (reportId: string) => {
    setSelectedReportForEditor(reportId);
    setShowExcelEditor(true);
  };

  const handleExcelEditorSave = (data: any) => {
    toast({
      title: "Excel data saved",
      description: "Test report spreadsheet data has been saved successfully.",
    });
  };

  const handleDrawingSave = (imageData: string) => {
    toast({
      title: "Drawing saved",
      description: "Your drawing has been saved to the test report.",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = complianceStatuses.find(s => s.value === status);
    return statusConfig ? (
      <Badge className={statusConfig.color}>
        {statusConfig.label}
      </Badge>
    ) : (
      <Badge variant="secondary">{status}</Badge>
    );
  };

  const filteredReports = reports.filter(report => {
    const matchesStatus = filterStatus === 'all' || report.compliance_status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      report.report_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.test_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.technician_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test Reports</h1>
          <p className="text-muted-foreground">
            Manage construction materials testing reports and results
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingReport(null)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                New Report
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingReport ? 'Edit Test Report' : 'Create New Test Report'}
              </DialogTitle>
              <DialogDescription>
                {editingReport ? 'Update the test report details' : 'Add a new construction materials test report'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="report_number">Report Number *</Label>
                  <Input
                    id="report_number"
                    value={formData.report_number}
                    onChange={(e) => setFormData(prev => ({...prev, report_number: e.target.value}))}
                    placeholder="TR-001"
                    required
                    className={validationErrors['report_number'] ? 'border-red-500' : ''}
                  />
                  {validationErrors['report_number'] && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors['report_number']}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="test_date">Test Date *</Label>
                  <Input
                    id="test_date"
                    type="date"
                    value={formData.test_date}
                    onChange={(e) => setFormData(prev => ({...prev, test_date: e.target.value}))}
                    required
                    className={validationErrors['test_date'] ? 'border-red-500' : ''}
                  />
                  {validationErrors['test_date'] && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors['test_date']}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="test_type">Test Type *</Label>
                  <Select value={formData.test_type} onValueChange={(value) => setFormData(prev => ({...prev, test_type: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select test type" />
                    </SelectTrigger>
                    <SelectContent>
                      {testTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="material_type">Material Type</Label>
                  <Select value={formData.material_type} onValueChange={(value) => setFormData(prev => ({...prev, material_type: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materialTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="technician_name">Technician Name</Label>
                  <Input
                    id="technician_name"
                    value={formData.technician_name}
                    onChange={(e) => setFormData(prev => ({...prev, technician_name: e.target.value}))}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="compliance_status">Compliance Status</Label>
                  <Select value={formData.compliance_status} onValueChange={(value) => setFormData(prev => ({...prev, compliance_status: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {complianceStatuses.map(status => (
                        <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="project_id">Project</Label>
                <Select value={formData.project_id} onValueChange={(value) => setFormData(prev => ({...prev, project_id: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Project</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                  placeholder="Additional observations, comments, or test conditions..."
                  rows={3}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  {editingReport ? 'Update Report' : 'Create Report'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        
        <Dialog open={showExcelEditor} onOpenChange={setShowExcelEditor}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Table className="h-4 w-4 mr-2" />
              Excel Editor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Excel-like Test Report Editor</DialogTitle>
              <DialogDescription>
                Create detailed test reports with spreadsheet functionality, formulas, and charts
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <TestReportTemplate 
                reportId={selectedReportForEditor || undefined}
                onSave={handleExcelEditorSave}
                onClose={() => setShowExcelEditor(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
        
        <Dialog open={showDrawingCanvas} onOpenChange={setShowDrawingCanvas}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Brush className="h-4 w-4 mr-2" />
              Drawing Canvas
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Drawing Canvas</DialogTitle>
              <DialogDescription>
                Create technical drawings, sketches, and annotations for your test reports
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <DrawingCanvas 
                reportId={selectedReportForEditor || undefined}
                onSave={handleDrawingSave}
                width={800}
                height={500}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      {/* Mobile-Optimized Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <Input
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {complianceStatuses.map(status => (
              <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mobile-Optimized Reports Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 min-w-0 flex-1">
                    <CardTitle className="text-lg truncate">{report.report_number}</CardTitle>
                    <CardDescription className="text-sm">
                      {report.test_type}
                    </CardDescription>
                    <CardDescription className="text-xs">
                      {new Date(report.test_date).toLocaleDateString()}
                      {report.project && ` • ${report.project.name}`}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 ml-2">
                    {getStatusBadge(report.compliance_status)}
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(report)}
                        className="h-8 w-8 p-0"
                        title="Edit Report"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openExcelEditor(report.id)}
                        className="h-8 w-8 p-0"
                        title="Excel Editor"
                      >
                        <Table className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReportForEditor(report.id);
                          setShowDrawingCanvas(true);
                        }}
                        className="h-8 w-8 p-0"
                        title="Drawing Canvas"
                      >
                        <Brush className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteReport(report.id)}
                        className="h-8 w-8 p-0"
                        title="Delete Report"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-medium text-xs text-muted-foreground">Material</p>
                    <p className="truncate">{report.material_type || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-xs text-muted-foreground">Technician</p>
                    <p className="truncate">{report.technician_name || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Created: {new Date(report.created_at).toLocaleDateString()}
                </div>

                {report.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Notes:</p>
                    <p className="text-sm line-clamp-2">{report.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No test reports found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No reports match your current filters.' 
                  : 'Get started by creating your first test report.'}
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Report
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}