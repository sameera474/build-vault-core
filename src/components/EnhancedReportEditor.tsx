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
import { DetailedReportViewer } from './DetailedReportViewer';
import { supabase } from '@/integrations/supabase/client';

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
  const [computedCompliance, setComputedCompliance] = useState<'pass' | 'fail' | 'pending'>('pending');
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
        setComputedCompliance('pending');
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
      const status: 'pass' | 'fail' = passed ? 'pass' : 'fail';
      setPassFailStatus(status);
      setComputedCompliance(status);
      
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
      setComputedCompliance('pending');
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
    // Safer formula evaluation without eval
    let expr = condition;
    
    // Replace tokens with numbers/booleans
    [...Object.entries(kpis), ...Object.entries(thresholds)].forEach(([key, val]) => {
      const safe = typeof val === 'number' ? val : 0;
      expr = expr.replace(new RegExp(`\\b${key}\\b`, 'g'), String(safe));
    });
    
    // Only allow valid chars for safety
    if (!/^[\d\s.<>=!&|()+-/*]*$/.test(expr)) return false;
    
    try {
      // eslint-disable-next-line no-new-func
      return Function(`"use strict"; return (${expr});`)();
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
        compliance_status: computedCompliance,
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
        compliance_status: computedCompliance,
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

  const handleExportPdf = async () => {
    if (!report) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('export_report_pdf', {
        body: { report_id: report.id }
      });
      
      if (error || !data?.url) {
        throw error || new Error('No URL returned');
      }
      // Prefer programmatic click to avoid popup blockers
      const a = document.createElement('a');
      a.href = data.url;
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Export ready. If it did not open, use the link in the notification.', {
        description: data.url,
        action: {
          label: 'Open',
          onClick: () => window.open(data.url, '_blank')
        }
      });
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error('PDF export error:', error);
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
    // Super admin can always edit
    if (profile?.is_super_admin || profile?.tenant_role === 'super_admin') return true;
    
    // For other roles, check status and permissions
    return (report?.status === 'draft' || report?.status === 'rejected') && 
           ['admin'].includes(profile?.tenant_role || '');
  };

  const canApprove = () => {
    return report?.status === 'submitted' && 
           (profile?.is_super_admin || ['admin'].includes(profile?.tenant_role || ''));
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
            Complete Report Details
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
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="font-semibold mb-3 text-lg">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="p-3 border rounded">
                  <span className="font-medium text-muted-foreground">Report Number:</span>
                  <p className="font-mono text-lg">{report.report_number}</p>
                </div>
                <div className="p-3 border rounded">
                  <span className="font-medium text-muted-foreground">Project:</span>
                  <p>{report.project?.name || 'N/A'}</p>
                </div>
                <div className="p-3 border rounded">
                  <span className="font-medium text-muted-foreground">Test Type:</span>
                  <p>{report.test_type}</p>
                </div>
                <div className="p-3 border rounded">
                  <span className="font-medium text-muted-foreground">Material:</span>
                  <p className="capitalize">{report.material || report.custom_material || 'N/A'}</p>
                </div>
                <div className="p-3 border rounded">
                  <span className="font-medium text-muted-foreground">Test Date:</span>
                  <p>{new Date(report.test_date).toLocaleDateString()}</p>
                </div>
                <div className="p-3 border rounded">
                  <span className="font-medium text-muted-foreground">Time of Test:</span>
                  <p>{report.time_of_test || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div>
              <h4 className="font-semibold mb-3 text-lg">Location Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="p-3 border rounded">
                  <span className="font-medium text-muted-foreground">Road Name:</span>
                  <p>{report.road_name || 'N/A'}</p>
                </div>
                <div className="p-3 border rounded">
                  <span className="font-medium text-muted-foreground">Chainage From:</span>
                  <p>{report.chainage_from || 'N/A'}</p>
                </div>
                <div className="p-3 border rounded">
                  <span className="font-medium text-muted-foreground">Chainage To:</span>
                  <p>{report.chainage_to || 'N/A'}</p>
                </div>
                <div className="p-3 border rounded">
                  <span className="font-medium text-muted-foreground">Side:</span>
                  <p className="capitalize">{report.side || 'N/A'}</p>
                </div>
                <div className="p-3 border rounded">
                  <span className="font-medium text-muted-foreground">Road Offset:</span>
                  <p>{report.road_offset || 'N/A'}</p>
                </div>
                <div className="p-3 border rounded">
                  <span className="font-medium text-muted-foreground">Covered Chainage:</span>
                  <p>{report.covered_chainage || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* GPS Coordinates */}
            {(report.gps_latitude || report.gps_longitude) && (
              <div>
                <h4 className="font-semibold mb-3 text-lg">GPS Coordinates</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 border rounded">
                    <span className="font-medium text-muted-foreground">Latitude:</span>
                    <p>{report.gps_latitude || 'N/A'}</p>
                  </div>
                  <div className="p-3 border rounded">
                    <span className="font-medium text-muted-foreground">Longitude:</span>
                    <p>{report.gps_longitude || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Test Details */}
            <div>
              <h4 className="font-semibold mb-3 text-lg">Test Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="p-3 border rounded">
                  <span className="font-medium text-muted-foreground">Laboratory Test No:</span>
                  <p>{report.laboratory_test_no || 'N/A'}</p>
                </div>
                <div className="p-3 border rounded">
                  <span className="font-medium text-muted-foreground">Technician:</span>
                  <p>{report.technician_name || 'N/A'}</p>
                </div>
                <div className="p-3 border rounded">
                  <span className="font-medium text-muted-foreground">Technician ID:</span>
                  <p>{report.technician_id || 'N/A'}</p>
                </div>
                <div className="p-3 border rounded">
                  <span className="font-medium text-muted-foreground">Standard:</span>
                  <p>{report.standard || 'N/A'}</p>
                </div>
                <div className="p-3 border rounded">
                  <span className="font-medium text-muted-foreground">Document Code:</span>
                  <p>{report.doc_code || 'N/A'}</p>
                </div>
                <div className="p-3 border rounded">
                  <span className="font-medium text-muted-foreground">Sequence Number:</span>
                  <p>{report.seq || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Conditions */}
            <div>
              <h4 className="font-semibold mb-3 text-lg">Site Conditions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 border rounded">
                  <span className="font-medium text-muted-foreground">Weather Conditions:</span>
                  <p>{report.weather_conditions || 'N/A'}</p>
                </div>
                <div className="p-3 border rounded">
                  <span className="font-medium text-muted-foreground">Site Conditions:</span>
                  <p>{report.site_conditions || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Status Information */}
            <div>
              <h4 className="font-semibold mb-3 text-lg">Status Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-3 border rounded">
                  <span className="font-medium text-muted-foreground">Report Status:</span>
                  <div className="mt-1">{getStatusBadge(report.status)}</div>
                </div>
                <div className="p-3 border rounded">
                  <span className="font-medium text-muted-foreground">Compliance Status:</span>
                  <div className="mt-1">{getPassFailBadge()}</div>
                </div>
                <div className="p-3 border rounded">
                  <span className="font-medium text-muted-foreground">Created:</span>
                  <p>{new Date(report.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {canEdit() && (
          <>
            <Button onClick={handleSave} disabled={!isDirty || saving}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            
            <Button onClick={handleSubmitForApproval} disabled={isDirty}>
              <Send className="h-4 w-4 mr-2" />
              Submit for Approval
            </Button>
          </>
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
        
        <Button variant="outline" onClick={handleExportPdf}>
          <FileDown className="h-4 w-4 mr-2" />
          Export PDF
        </Button>

        {!canEdit() && !canApprove() && (
          <div className="text-sm text-muted-foreground">
            View-only access - Contact administrator for edit permissions
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="detailed-view">Complete Report</TabsTrigger>
          <TabsTrigger value="sheet">Test Data</TabsTrigger>
          <TabsTrigger value="summary">Results Summary</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="detailed-view" className="space-y-6">
          <DetailedReportViewer 
            report={{ ...report, summary_json: summaryData, compliance_status: computedCompliance }} 
            project={report.project}
            company={report.project?.company || {}}
          />
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Complete Test Report Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Raw Data Display */}
                {report.data_json && Array.isArray(report.data_json) && report.data_json.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-lg">Test Data Entries</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border rounded text-sm">
                        <thead>
                          <tr className="bg-muted">
                            {Object.keys(report.data_json[0] || {}).map((key) => (
                              <th key={key} className="p-3 text-left border-b">
                                {key.replace(/_/g, ' ').toUpperCase()}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {report.data_json.map((row: any, index: number) => (
                            <tr key={index} className="border-b">
                              {Object.values(row).map((value: any, cellIndex: number) => (
                                <td key={cellIndex} className="p-3">
                                  {typeof value === 'number' ? value.toFixed(3) : String(value || 'N/A')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Results Summary */}
                {(report as any).results && (
                  <div>
                    <h4 className="font-semibold mb-3 text-lg">Test Results</h4>
                    <div className="p-4 border rounded bg-muted/30">
                      <pre className="text-sm whitespace-pre-wrap">
                        {typeof (report as any).results === 'object' 
                          ? JSON.stringify((report as any).results, null, 2)
                          : String((report as any).results)
                        }
                      </pre>
                    </div>
                  </div>
                )}

                {/* Notes and Observations */}
                {report.notes && (
                  <div>
                    <h4 className="font-semibold mb-3 text-lg">Notes & Observations</h4>
                    <div className="p-4 border rounded bg-muted/30">
                      <p className="whitespace-pre-wrap">{report.notes}</p>
                    </div>
                  </div>
                )}

                {/* Template Information */}
                {report.template && (
                  <div>
                    <h4 className="font-semibold mb-3 text-lg">Template Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="p-3 border rounded">
                        <span className="font-medium text-muted-foreground">Template Name:</span>
                        <p>{report.template.name}</p>
                      </div>
                      <div className="p-3 border rounded">
                        <span className="font-medium text-muted-foreground">Version:</span>
                        <p>{report.template.version}</p>
                      </div>
                      <div className="p-3 border rounded">
                        <span className="font-medium text-muted-foreground">Standard:</span>
                        <p>{report.template.standard || 'N/A'}</p>
                      </div>
                      <div className="p-3 border rounded">
                        <span className="font-medium text-muted-foreground">Units:</span>
                        <p>{report.template.units || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
                          <div className="text-xl font-bold">{typeof value === 'number' ? value.toFixed(3) : String(value)}</div>
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