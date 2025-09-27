import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Send, CheckCircle, XCircle, Download, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ExcelEditor } from './ExcelEditor';

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
  data_json: any;
  summary_json: any;
  graphs_json: any;
  compliance_status: string;
  created_at: string;
  projects?: {
    name: string;
  };
}

export default function ReportEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [report, setReport] = useState<TestReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passFailStatus, setPassFailStatus] = useState<'pass' | 'fail' | 'pending'>('pending');

  useEffect(() => {
    if (id && profile?.company_id) {
      fetchReport();
    }
  }, [id, profile?.company_id]);

  const fetchReport = async () => {
    if (!id || !profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('test_reports')
        .select(`
          *,
          projects (name)
        `)
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .single();

      if (error) throw error;

      setReport(data);
      calculatePassFailStatus(data);
    } catch (error) {
      console.error('Error fetching report:', error);
      toast({
        title: "Error",
        description: "Failed to load test report",
        variant: "destructive",
      });
      navigate('/test-reports');
    } finally {
      setLoading(false);
    }
  };

  const calculatePassFailStatus = (reportData: TestReport) => {
    // Basic pass/fail logic based on test type
    // This would be enhanced with template-specific rules
    const summaryData = reportData.summary_json || {};
    
    if (reportData.test_type === 'Field Density') {
      const compaction = summaryData.degree_of_compaction;
      if (compaction && compaction >= 95) {
        setPassFailStatus('pass');
      } else if (compaction) {
        setPassFailStatus('fail');
      } else {
        setPassFailStatus('pending');
      }
    } else {
      // Default logic for other test types
      setPassFailStatus('pending');
    }
  };

  const handleSave = async () => {
    if (!report) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('test_reports')
        .update({
          data_json: report.data_json,
          summary_json: report.summary_json,
          graphs_json: report.graphs_json,
        })
        .eq('id', report.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Report saved successfully",
      });
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: "Error",
        description: "Failed to save report",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!report) return;

    try {
      const { error } = await supabase
        .from('test_reports')
        .update({ status: 'submitted' })
        .eq('id', report.id);

      if (error) throw error;

      setReport(prev => prev ? { ...prev, status: 'submitted' } : null);
      toast({
        title: "Success",
        description: "Report submitted for approval",
      });
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Error",
        description: "Failed to submit report",
        variant: "destructive",
      });
    }
  };

  const handleApprove = async () => {
    if (!report) return;

    try {
      const { error } = await supabase
        .from('test_reports')
        .update({ 
          status: 'approved',
          compliance_status: 'approved'
        })
        .eq('id', report.id);

      if (error) throw error;

      setReport(prev => prev ? { ...prev, status: 'approved', compliance_status: 'approved' } : null);
      toast({
        title: "Success",
        description: "Report approved successfully",
      });
    } catch (error) {
      console.error('Error approving report:', error);
      toast({
        title: "Error",
        description: "Failed to approve report",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!report) return;

    try {
      const { error } = await supabase
        .from('test_reports')
        .update({ 
          status: 'rejected',
          compliance_status: 'rejected'
        })
        .eq('id', report.id);

      if (error) throw error;

      setReport(prev => prev ? { ...prev, status: 'rejected', compliance_status: 'rejected' } : null);
      toast({
        title: "Success",
        description: "Report rejected",
      });
    } catch (error) {
      console.error('Error rejecting report:', error);
      toast({
        title: "Error",
        description: "Failed to reject report",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = () => {
    toast({
      title: "Export PDF",
      description: "PDF export functionality will be implemented",
    });
  };

  const exportToExcel = () => {
    toast({
      title: "Export Excel",
      description: "Excel export functionality will be implemented",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Report not found</p>
          <Button onClick={() => navigate('/test-reports')} className="mt-4">
            Back to Reports
          </Button>
        </div>
      </div>
    );
  }

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

  const getPassFailBadge = () => {
    switch (passFailStatus) {
      case 'pass':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Pass</Badge>;
      case 'fail':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Fail</Badge>;
      default:
        return <Badge variant="secondary">Pending Analysis</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/test-reports')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{report.report_number}</h1>
            <p className="text-muted-foreground">
              {report.projects?.name} • {report.road_name} • {report.chainage_from} - {report.chainage_to}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(report.status)}
          {getPassFailBadge()}
        </div>
      </div>

      {/* Report Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Material:</span>
            <p className="text-muted-foreground capitalize">{report.material}</p>
          </div>
          <div>
            <span className="font-medium">Test Type:</span>
            <p className="text-muted-foreground">{report.test_type}</p>
          </div>
          <div>
            <span className="font-medium">Side:</span>
            <p className="text-muted-foreground capitalize">{report.side}</p>
          </div>
          <div>
            <span className="font-medium">Lab Test No:</span>
            <p className="text-muted-foreground">{report.laboratory_test_no || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          
          {report.status === 'draft' && (
            <Button onClick={handleSubmitForApproval}>
              <Send className="h-4 w-4 mr-2" />
              Submit for Approval
            </Button>
          )}
          
          {report.status === 'submitted' && profile?.role === 'admin' && (
            <>
              <Button onClick={handleApprove} variant="default" className="bg-green-600">
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button onClick={handleReject} variant="destructive">
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={exportToPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Main Editor Tabs */}
      <Tabs defaultValue="sheet" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sheet">Sheet</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="sheet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Sheet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4">
                <p className="text-center text-muted-foreground">Excel-like editor will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Calculated Results</h4>
                    <div className="text-sm space-y-1">
                      <p>Maximum Dry Density: <span className="font-mono">1.85 g/cm³</span></p>
                      <p>Optimum Moisture Content: <span className="font-mono">12.5%</span></p>
                      <p>Field Density: <span className="font-mono">1.76 g/cm³</span></p>
                      <p>Degree of Compaction: <span className="font-mono">95.1%</span></p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Specifications</h4>
                    <div className="text-sm space-y-1">
                      <p>Required Compaction: <span className="font-mono">≥ 95%</span></p>
                      <p>Test Standard: <span className="font-mono">AASHTO T99</span></p>
                      <p>Result: {getPassFailBadge()}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Remarks</h4>
                  <p className="text-sm text-muted-foreground">
                    The test results meet the specified requirements for compaction.
                    Field density achieved satisfactory compaction levels.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visual Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>Charts and visualizations will be displayed here</p>
                <p className="text-sm mt-2">Based on the data entered in the sheet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Upload approval letters, photos, or other documents</p>
                <Button variant="outline" className="mt-2">
                  Browse Files
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}