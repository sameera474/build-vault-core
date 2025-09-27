import { useState, useEffect } from 'react';
import { Plus, FileText, Edit, Trash2, Download, Filter } from 'lucide-react';
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
  const { profile } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    report_number: '',
    test_type: '',
    material_type: '',
    test_date: '',
    technician_name: '',
    compliance_status: 'pending',
    project_id: '',
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

    try {
      const reportData = {
        ...formData,
        company_id: profile.company_id,
        created_by: profile.user_id,
        results: formData.results || {}
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
      toast({
        title: "Error",
        description: error.message,
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
      project_id: '',
      notes: '',
      results: {}
    });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test Reports</h1>
          <p className="text-muted-foreground">
            Manage construction materials testing reports and results
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingReport(null)}>
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingReport ? 'Edit Test Report' : 'Create New Test Report'}
              </DialogTitle>
              <DialogDescription>
                {editingReport ? 'Update the test report details' : 'Add a new construction materials test report'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="report_number">Report Number *</Label>
                  <Input
                    id="report_number"
                    value={formData.report_number}
                    onChange={(e) => setFormData(prev => ({...prev, report_number: e.target.value}))}
                    placeholder="TR-001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="test_date">Test Date *</Label>
                  <Input
                    id="test_date"
                    type="date"
                    value={formData.test_date}
                    onChange={(e) => setFormData(prev => ({...prev, test_date: e.target.value}))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
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

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingReport ? 'Update Report' : 'Create Report'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by report number, test type, or technician..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {complianceStatuses.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="grid gap-4">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <Card key={report.id} className="border-border/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {report.report_number}
                    </CardTitle>
                    <CardDescription>
                      {report.test_type} • {new Date(report.test_date).toLocaleDateString()}
                      {report.project && ` • ${report.project.name}`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(report.compliance_status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(report)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteReport(report.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Material</p>
                    <p className="text-muted-foreground">{report.material_type || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Technician</p>
                    <p className="text-muted-foreground">{report.technician_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Created</p>
                    <p className="text-muted-foreground">{new Date(report.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="font-medium">Results</p>
                    <p className="text-muted-foreground">
                      {Object.keys(report.results || {}).length > 0 ? 'Available' : 'Pending'}
                    </p>
                  </div>
                </div>
                {report.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="font-medium text-sm">Notes:</p>
                    <p className="text-sm text-muted-foreground mt-1">{report.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-8">
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