import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExcelGrid } from './ExcelGrid';
import { ArrowLeft, Save, Send, CheckCircle, XCircle, FileDown, Upload, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { reportService, TestReport } from '@/services/reportService';
import { templateService, TemplateRules } from '@/services/templateService';
import { useAuth } from '@/contexts/AuthContext';

export function EnhancedReportEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [report, setReport] = useState<TestReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState('sheet');
  const [passFailStatus, setPassFailStatus] = useState<'pass' | 'fail' | 'pending'>('pending');
  const [summaryData, setSummaryData] = useState<any>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (id) {
      fetchReport();
    }
  }, [id]);

  // Auto-save effect
  useEffect(() => {
    if (isDirty && report) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout for 10 seconds
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, 10000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [isDirty, report]);

  const fetchReport = async () => {
    try {
      if (!id) return;
      
      const data = await reportService.fetchReport(id);
      setReport(data);
      
      // Initialize summary data
      if (data.summary_json) {
        setSummaryData(data.summary_json);
      }
      
      // Calculate pass/fail status
      if (data.template && data.data_json && data.template.rules_json) {
        calculatePassFailStatus(data.data_json, data.template.rules_json);
      }
    } catch (error) {
      toast.error('Failed to load test report');
      console.error('Error fetching report:', error);
      navigate('/test-reports');
    } finally {
      setLoading(false);
    }
  };

  const calculatePassFailStatus = useCallback((data: any[], rules: TemplateRules) => {
    try {
      if (!rules.pass_condition || !data?.length) {
        setPassFailStatus('pending');
        return;
      }

      // Calculate KPIs
      const kpis: { [key: string]: number } = {};
      if (rules.kpis) {
        Object.entries(rules.kpis).forEach(([key, formula]) => {
          kpis[key] = evaluateFormula(formula, data);
        });
      }

      // Evaluate pass condition
      const passed = evaluatePassCondition(rules.pass_condition, kpis, rules.thresholds || {});
      setPassFailStatus(passed ? 'pass' : 'fail');
      
      // Update summary data
      setSummaryData(prev => ({
        ...prev,
        kpis,
        passed,
        lastCalculated: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error calculating pass/fail status:', error);
      setPassFailStatus('pending');
    }
  }, []);

  const evaluateFormula = (formula: string, data: any[]): number => {
    // Simple formula evaluation for AVG, SUM, MIN, MAX
    const values = data.map(row => parseFloat(row[formula.split('(')[1]?.split(')')[0]] || 0)).filter(v => !isNaN(v));
    
    if (formula.startsWith('AVG(')) {
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    }
    if (formula.startsWith('SUM(')) {
      return values.reduce((a, b) => a + b, 0);
    }
    if (formula.startsWith('MIN(')) {
      return values.length > 0 ? Math.min(...values) : 0;
    }
    if (formula.startsWith('MAX(')) {
      return values.length > 0 ? Math.max(...values) : 0;
    }
    
    return 0;
  };

  const evaluatePassCondition = (condition: string, kpis: any, thresholds: any): boolean => {
    // Simple condition evaluation
    // Replace variables in condition with actual values
    let evaluatedCondition = condition;
    
    Object.entries(kpis).forEach(([key, value]) => {
      evaluatedCondition = evaluatedCondition.replace(new RegExp(key, 'g'), String(value));
    });
    
    Object.entries(thresholds).forEach(([key, value]) => {
      evaluatedCondition = evaluatedCondition.replace(new RegExp(key, 'g'), String(value));
    });
    
    try {
      return eval(evaluatedCondition);
    } catch {
      return false;
    }
  };

  const handleDataChange = (newData: any[], dirty: boolean) => {
    setIsDirty(dirty);
    
    if (report?.template?.rules_json) {
      calculatePassFailStatus(newData, report.template.rules_json);
    }
  };

  const handleAutoSave = async () => {
    if (!report || !isDirty) return;
    
    try {
      setSaving(true);
      await reportService.saveReportData(report.id, {
        data_json: report.data_json,
        summary_json: summaryData,
        graphs_json: report.graphs_json,
      });
      setIsDirty(false);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!report) return;
    
    try {
      setSaving(true);
      await reportService.saveReportData(report.id, {
        data_json: report.data_json,
        summary_json: summaryData,
        graphs_json: report.graphs_json,
      });
      setIsDirty(false);
      setLastSaved(new Date());
      toast.success('Report saved successfully');
    } catch (error) {
      toast.error('Failed to save report');
      console.error('Error saving report:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!report) return;
    
    try {
      await handleSave(); // Save first
      await reportService.submitForApproval(report.id);
      setReport(prev => prev ? { ...prev, status: 'submitted' } : null);
      toast.success('Report submitted for approval');
    } catch (error) {
      toast.error('Failed to submit report');
      console.error('Error submitting report:', error);
    }
  };

  const handleApprove = async () => {
    if (!report) return;
    
    try {
      await reportService.approveReport(report.id);
      setReport(prev => prev ? { ...prev, status: 'approved', compliance_status: 'approved' } : null);
      toast.success('Report approved');
    } catch (error) {
      toast.error('Failed to approve report');
      console.error('Error approving report:', error);
    }
  };

  const handleReject = async () => {
    if (!report) return;
    
    try {
      await reportService.rejectReport(report.id);
      setReport(prev => prev ? { ...prev, status: 'rejected', compliance_status: 'rejected' } : null);
      toast.success('Report rejected');
    } catch (error) {
      toast.error('Failed to reject report');
      console.error('Error rejecting report:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      submitted: 'default',
      approved: 'default',
      rejected: 'destructive',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getPassFailBadge = () => {
    if (passFailStatus === 'pass') {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          PASS
        </Badge>
      );
    } else if (passFailStatus === 'fail') {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          FAIL
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          <Clock className="h-3 w-3 mr-1" />
          PENDING
        </Badge>
      );
    }
  };

  const canEdit = () => {
    return report?.status === 'draft' || report?.status === 'rejected';
  };

  const canApprove = () => {
    return report?.status === 'submitted' && ['quality_manager', 'admin'].includes(profile?.role || '');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Report not found</h1>
          <Button onClick={() => navigate('/test-reports')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/test-reports')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {report.test_type} - {report.road_name}
            </h1>
            <p className="text-muted-foreground">
              {report.chainage_from} to {report.chainage_to}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getPassFailBadge()}
          {getStatusBadge(report.status)}
        </div>
      </div>

      {/* Report Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Report Details
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {saving && (
                <span className="flex items-center gap-1">
                  <div className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent"></div>
                  Saving...
                </span>
              )}
              {lastSaved && (
                <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
              )}
              {isDirty && !saving && (
                <Badge variant="secondary">Unsaved changes</Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Project:</span> {report.project?.name}
            </div>
            <div>
              <span className="font-medium">Material:</span> {report.material}
            </div>
            <div>
              <span className="font-medium">Test Date:</span> {report.test_date}
            </div>
            <div>
              <span className="font-medium">Lab Test No:</span> {report.laboratory_test_no}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={!isDirty || saving}>
          <Save className="h-4 w-4 mr-2" />
          Save Draft
        </Button>
        
        {canEdit() && (
          <Button onClick={handleSubmitForApproval} disabled={isDirty}>
            <Send className="h-4 w-4 mr-2" />
            Submit for Approval
          </Button>
        )}
        
        {canApprove() && (
          <>
            <Button onClick={handleApprove} variant="default">
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button onClick={handleReject} variant="destructive">
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </>
        )}
        
        <Button variant="outline">
          <FileDown className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sheet">Sheet</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="sheet" className="space-y-4">
          {report.template?.schema_json ? (
            <ExcelGrid
              schema={report.template.schema_json}
              initialData={report.data_json || []}
              onChange={handleDataChange}
              onSave={handleSave}
              readOnly={!canEdit()}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No template schema available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Results Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* KPIs */}
                {summaryData.kpis && (
                  <div>
                    <h4 className="font-medium mb-2">Key Performance Indicators</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(summaryData.kpis).map(([key, value]) => (
                        <div key={key} className="p-3 border rounded">
                          <div className="text-sm text-muted-foreground">{key.replace(/_/g, ' ').toUpperCase()}</div>
                          <div className="text-xl font-bold">{typeof value === 'number' ? value.toFixed(3) : value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pass/Fail Status */}
                <div>
                  <h4 className="font-medium mb-2">Compliance Status</h4>
                  <div className="flex items-center gap-2">
                    {getPassFailBadge()}
                    <span className="text-sm text-muted-foreground">
                      {summaryData.lastCalculated && `Last calculated: ${new Date(summaryData.lastCalculated).toLocaleString()}`}
                    </span>
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <h4 className="font-medium mb-2">Remarks</h4>
                  <Textarea
                    value={report.notes || ''}
                    onChange={(e) => setReport(prev => prev ? { ...prev, notes: e.target.value } : null)}
                    placeholder="Enter remarks or observations..."
                    disabled={!canEdit()}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">Charts feature coming soon</p>
              <p className="text-sm text-muted-foreground mt-2">
                Charts will be automatically generated based on template configuration
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Attachments
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                No files uploaded yet
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}