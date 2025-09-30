import { useState } from 'react';
import { Download, Mail, FileText, Share, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';

interface ExportOptions {
  format: 'pdf' | 'csv' | 'json';
  dateRange: 'all' | '7days' | '30days' | '90days';
  includePhotos: boolean;
  includeCharts: boolean;
}

interface EmailOptions {
  recipients: string;
  subject: string;
  message: string;
  attachReport: boolean;
}

export function IntegrationExport() {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    dateRange: '30days',
    includePhotos: true,
    includeCharts: true
  });
  
  const [emailOptions, setEmailOptions] = useState<EmailOptions>({
    recipients: '',
    subject: 'Test Report Export',
    message: 'Please find the attached test report export.',
    attachReport: true
  });

  const [isExporting, setIsExporting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const getDateRange = (range: string) => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (range) {
      case '7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setFullYear(2020); // All data
    }
    
    return { startDate, endDate };
  };

  const fetchReportData = async () => {
    if (!profile?.company_id) return null;

    const { startDate, endDate } = getDateRange(exportOptions.dateRange);

    try {
      const { data: reports, error } = await supabase
        .from('test_reports')
        .select(`
          *,
          projects(name)
        `)
        .eq('company_id', profile.company_id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: projects } = await supabase
        .from('projects')
        .select(`
          *,
          companies(*)
        `)
        .eq('company_id', profile.company_id);

      return { reports: reports || [], projects: projects || [] };
    } catch (error) {
      console.error('Error fetching report data:', error);
      return null;
    }
  };

  const exportToPDF = async (data: any) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;
    let yPosition = margin;

    // Company Header with Logo (if available)
    const company = data.projects[0]?.company || {};
    
    // Company Logo (placeholder for actual logo implementation)
    if (company.client_logo) {
      // Note: In a real implementation, you'd load and add the actual logo
      pdf.setFontSize(8);
      pdf.text('Logo: ' + company.client_logo, margin, yPosition);
      yPosition += 8;
    }

    // Header
    pdf.setFontSize(20);
    pdf.text('ConstructTest Pro - Test Reports Export', margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 10;
    pdf.text(`Company: ${profile?.name || company.name || 'Unknown'}`, margin, yPosition);
    yPosition += 10;
    if (company.address) {
      pdf.text(`Address: ${company.address}`, margin, yPosition);
      yPosition += 10;
    }
    pdf.text(`Total Reports: ${data.reports.length}`, margin, yPosition);
    yPosition += 20;

    // Summary Statistics
    const passedReports = data.reports.filter((r: any) => r.compliance_status === 'pass').length;
    const failedReports = data.reports.filter((r: any) => r.compliance_status === 'fail').length;
    const pendingReports = data.reports.filter((r: any) => r.compliance_status === 'pending').length;
    const complianceRate = data.reports.length > 0 ? ((passedReports / data.reports.length) * 100).toFixed(1) : '0';

    pdf.setFontSize(14);
    pdf.text('Summary Statistics', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.text(`Compliance Rate: ${complianceRate}%`, margin, yPosition);
    yPosition += 7;
    pdf.text(`Passed: ${passedReports}`, margin, yPosition);
    yPosition += 7;
    pdf.text(`Failed: ${failedReports}`, margin, yPosition);
    yPosition += 7;
    pdf.text(`Pending: ${pendingReports}`, margin, yPosition);
    yPosition += 20;

    // Reports List
    pdf.setFontSize(14);
    pdf.text('Test Reports', margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(8);
    const headers = ['Report #', 'Test Type', 'Date', 'Status', 'Project'];
    const columnWidths = [30, 40, 25, 20, 40];
    let xPosition = margin;

    // Table headers
    headers.forEach((header, index) => {
      pdf.text(header, xPosition, yPosition);
      xPosition += columnWidths[index];
    });
    yPosition += 8;

    // Table data with final results
    data.reports.slice(0, 50).forEach((report: any) => { // Limit to 50 reports for PDF
      if (yPosition > pdf.internal.pageSize.height - 30) {
        pdf.addPage();
        yPosition = margin;
      }

      xPosition = margin;
      
      // Get final result from summary or calculate pass/fail
      let finalResult = 'PENDING';
      if (report.compliance_status === 'approved') finalResult = 'APPROVED';
      else if (report.compliance_status === 'rejected') finalResult = 'REJECTED';
      else if (report.compliance_status === 'pass') finalResult = 'PASS';
      else if (report.compliance_status === 'fail') finalResult = 'FAIL';
      
      const rowData = [
        report.report_number || 'N/A',
        report.test_type || 'N/A',
        new Date(report.test_date).toLocaleDateString(),
        finalResult,
        report.projects?.name || 'No Project'
      ];

      rowData.forEach((cell, index) => {
        const truncated = cell.length > 15 ? cell.substring(0, 12) + '...' : cell;
        pdf.text(truncated, xPosition, yPosition);
        xPosition += columnWidths[index];
      });
      yPosition += 6;
    });

    return pdf;
  };

  const exportToCSV = (data: any) => {
    const headers = [
      'Report Number',
      'Test Type',
      'Material Type',
      'Test Date',
      'Technician',
      'Compliance Status',
      'Project',
      'Created At',
      'Notes'
    ];

    const csvData = [
      headers.join(','),
      ...data.reports.map((report: any) => [
        `"${report.report_number || ''}"`,
        `"${report.test_type || ''}"`,
        `"${report.material_type || ''}"`,
        `"${report.test_date || ''}"`,
        `"${report.technician_name || ''}"`,
        `"${report.compliance_status || ''}"`,
        `"${report.projects?.name || ''}"`,
        `"${new Date(report.created_at).toLocaleDateString()}"`,
        `"${(report.notes || '').replace(/"/g, '""')}"` // Escape quotes
      ].join(','))
    ].join('\n');

    return new Blob([csvData], { type: 'text/csv' });
  };

  const exportToJSON = (data: any) => {
    const exportData = {
      metadata: {
        generated: new Date().toISOString(),
        company: profile?.name,
        totalReports: data.reports.length,
        dateRange: exportOptions.dateRange
      },
      reports: data.reports,
      projects: data.projects
    };

    return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const data = await fetchReportData();
      if (!data) {
        throw new Error('Failed to fetch report data');
      }

      let downloadUrl: string;
      let filename: string;

      switch (exportOptions.format) {
        case 'pdf':
          const pdf = await exportToPDF(data);
          const pdfBlob = pdf.output('blob');
          downloadUrl = URL.createObjectURL(pdfBlob);
          filename = `test-reports-export-${new Date().toISOString().split('T')[0]}.pdf`;
          break;

        case 'csv':
          const csvBlob = exportToCSV(data);
          downloadUrl = URL.createObjectURL(csvBlob);
          filename = `test-reports-export-${new Date().toISOString().split('T')[0]}.csv`;
          break;

        case 'json':
          const jsonBlob = exportToJSON(data);
          downloadUrl = URL.createObjectURL(jsonBlob);
          filename = `test-reports-export-${new Date().toISOString().split('T')[0]}.json`;
          break;

        default:
          throw new Error('Unsupported export format');
      }

      // Download file
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.click();

      // Cleanup
      URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Export successful",
        description: `Report exported as ${exportOptions.format.toUpperCase()}`,
      });

    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: error.message || "Failed to export report",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailOptions.recipients.trim()) {
      toast({
        title: "Missing recipients",
        description: "Please enter at least one email address",
        variant: "destructive",
      });
      return;
    }

    setIsSendingEmail(true);

    try {
      // First generate the export data if attachment is requested
      let attachmentData = null;
      if (emailOptions.attachReport) {
        const data = await fetchReportData();
        if (data) {
          switch (exportOptions.format) {
            case 'pdf':
              const pdf = await exportToPDF(data);
              attachmentData = {
                filename: `test-reports-${new Date().toISOString().split('T')[0]}.pdf`,
                content: pdf.output('datauristring').split(',')[1], // Base64 content
                type: 'application/pdf'
              };
              break;
            case 'csv':
              const csvBlob = exportToCSV(data);
              const csvReader = new FileReader();
              csvReader.readAsDataURL(csvBlob);
              csvReader.onload = () => {
                const result = csvReader.result as string;
                attachmentData = {
                  filename: `test-reports-${new Date().toISOString().split('T')[0]}.csv`,
                  content: result.split(',')[1],
                  type: 'text/csv'
                };
              };
              break;
          }
        }
      }

      // Send email via edge function
      const { error } = await supabase.functions.invoke('send-report-email', {
        body: {
          recipients: emailOptions.recipients.split(',').map(email => email.trim()),
          subject: emailOptions.subject,
          message: emailOptions.message,
          attachment: attachmentData,
          senderName: profile?.name || 'ConstructTest Pro User'
        }
      });

      if (error) throw error;

      toast({
        title: "Email sent",
        description: "Report has been sent successfully",
      });

      setIsEmailDialogOpen(false);

    } catch (error: any) {
      console.error('Email error:', error);
      toast({
        title: "Email failed",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Export & Integration</h2>
        <p className="text-muted-foreground">
          Export reports, send emails, and integrate with external systems
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Reports
            </CardTitle>
            <CardDescription>
              Generate and download comprehensive reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="format">Export Format</Label>
              <Select 
                value={exportOptions.format} 
                onValueChange={(value: any) => setExportOptions(prev => ({ ...prev, format: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Report</SelectItem>
                  <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                  <SelectItem value="json">JSON Data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateRange">Date Range</Label>
              <Select 
                value={exportOptions.dateRange} 
                onValueChange={(value: any) => setExportOptions(prev => ({ ...prev, dateRange: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? (
                'Exporting...'
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export {exportOptions.format.toUpperCase()}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Email Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Integration
            </CardTitle>
            <CardDescription>
              Send reports directly to stakeholders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Report via Email
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Send Report via Email</DialogTitle>
                  <DialogDescription>
                    Configure email settings and send report to recipients
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipients">Recipients (comma-separated)</Label>
                    <Input
                      id="recipients"
                      value={emailOptions.recipients}
                      onChange={(e) => setEmailOptions(prev => ({ ...prev, recipients: e.target.value }))}
                      placeholder="client@example.com, supervisor@company.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={emailOptions.subject}
                      onChange={(e) => setEmailOptions(prev => ({ ...prev, subject: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={emailOptions.message}
                      onChange={(e) => setEmailOptions(prev => ({ ...prev, message: e.target.value }))}
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEmailDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendEmail}
                      disabled={isSendingEmail}
                    >
                      {isSendingEmail ? 'Sending...' : 'Send Email'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <div className="p-3 border rounded-lg bg-muted/50">
              <h4 className="font-medium text-sm mb-2">Quick Actions</h4>
              <div className="space-y-2">
                <Button size="sm" variant="ghost" className="w-full justify-start">
                  <Share className="h-4 w-4 mr-2" />
                  Share via Link
                </Button>
                <Button size="sm" variant="ghost" className="w-full justify-start">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Available Integrations</CardTitle>
          <CardDescription>
            Connect with external systems and services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium">Document Management</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Export to Google Drive, Dropbox, or SharePoint
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-5 w-5 text-green-600" />
                <h4 className="font-medium">Email Automation</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Automated reports via Outlook, Gmail, or SMTP
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Share className="h-5 w-5 text-purple-600" />
                <h4 className="font-medium">API Access</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                REST API for custom integrations and webhooks
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}