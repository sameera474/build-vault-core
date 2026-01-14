import { useState, useEffect } from 'react';
import { Download, Mail, FileText, Share, Printer, Zap, Link as LinkIcon, Calendar, Filter, FileSpreadsheet, Database, Cloud, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface ExportOptions {
  format: 'pdf' | 'csv' | 'json' | 'excel';
  dateRange: 'custom' | '7days' | '30days' | '90days' | 'all';
  customStartDate?: Date;
  customEndDate?: Date;
  includePhotos: boolean;
  includeCharts: boolean;
  projectId?: string;
  roadName?: string;
  testType?: string;
  status?: string;
  material?: string;
}

interface Project {
  id: string;
  name: string;
}

interface ProjectRoad {
  id: string;
  name: string;
  project_id: string;
}

interface EmailOptions {
  recipients: string;
  subject: string;
  message: string;
  attachReport: boolean;
}

const TEST_TYPES = [
  'Field Density Test',
  'Proctor Compaction Test',
  'CBR Test',
  'Sieve Analysis',
  'Atterberg Limits',
  'Concrete Compression Test',
  'Marshall Stability Test',
  'Asphalt Core Density',
  'Los Angeles Abrasion',
  'Aggregate Impact Value',
  'Aggregate Crushing Value',
];

const MATERIALS = ['soil', 'concrete', 'aggregates', 'asphalt', 'custom'];
const STATUSES = ['draft', 'submitted', 'approved', 'rejected'];

export function IntegrationExport() {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    dateRange: '30days',
    includePhotos: true,
    includeCharts: true,
    projectId: 'all',
    roadName: 'all',
    testType: 'all',
    status: 'all',
    material: 'all',
  });
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [roads, setRoads] = useState<ProjectRoad[]>([]);
  const [zapierWebhook, setZapierWebhook] = useState('');
  const [isTriggeringZap, setIsTriggeringZap] = useState(false);
  const [reportCount, setReportCount] = useState<number>(0);
  
  const [emailOptions, setEmailOptions] = useState<EmailOptions>({
    recipients: '',
    subject: 'Test Report Export - ConstructTest Pro',
    message: 'Please find the attached test report export from ConstructTest Pro.',
    attachReport: true
  });

  const [isExporting, setIsExporting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [shareableLink, setShareableLink] = useState('');
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedExports, setSelectedExports] = useState<string[]>(['reports']);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (exportOptions.projectId && exportOptions.projectId !== 'all') {
      fetchRoads();
    } else {
      setRoads([]);
      setExportOptions(prev => ({ ...prev, roadName: 'all' }));
    }
  }, [exportOptions.projectId]);

  useEffect(() => {
    fetchReportCount();
  }, [exportOptions, profile?.company_id]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase.rpc('user_accessible_projects');
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchRoads = async () => {
    if (!exportOptions.projectId || exportOptions.projectId === 'all') return;

    try {
      const { data, error } = await supabase
        .from('project_roads')
        .select('*')
        .eq('project_id', exportOptions.projectId)
        .order('name');

      if (error) throw error;
      setRoads(data || []);
    } catch (error) {
      console.error('Error fetching roads:', error);
    }
  };

  const fetchReportCount = async () => {
    if (!profile?.company_id) return;
    
    const { startDate, endDate } = getDateRange(exportOptions.dateRange);
    
    try {
      let query = supabase
        .from('test_reports')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', profile.company_id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (exportOptions.projectId && exportOptions.projectId !== 'all') {
        query = query.eq('project_id', exportOptions.projectId);
      }
      if (exportOptions.testType && exportOptions.testType !== 'all') {
        query = query.eq('test_type', exportOptions.testType);
      }
      if (exportOptions.status && exportOptions.status !== 'all') {
        query = query.eq('status', exportOptions.status as "approved" | "draft" | "rejected" | "submitted");
      }
      if (exportOptions.material && exportOptions.material !== 'all') {
        query = query.eq('material', exportOptions.material as "aggregates" | "asphalt" | "concrete" | "custom" | "soil");
      }
      if (exportOptions.roadName && exportOptions.roadName !== 'all') {
        query = query.eq('road_name', exportOptions.roadName);
      }

      const { count, error } = await query;
      if (error) throw error;
      setReportCount(count || 0);
    } catch (error) {
      console.error('Error fetching report count:', error);
    }
  };

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
      case 'custom':
        return {
          startDate: exportOptions.customStartDate || new Date(2020, 0, 1),
          endDate: exportOptions.customEndDate || new Date()
        };
      default:
        startDate.setFullYear(2020);
    }
    
    return { startDate, endDate };
  };

  const fetchReportData = async () => {
    if (!profile?.company_id) return null;

    const { startDate, endDate } = getDateRange(exportOptions.dateRange);

    try {
      let query = supabase
        .from('test_reports')
        .select(`
          *,
          projects(name, client_name, contractor_name, consultant_name)
        `)
        .eq('company_id', profile.company_id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (exportOptions.projectId && exportOptions.projectId !== 'all') {
        query = query.eq('project_id', exportOptions.projectId);
      }
      if (exportOptions.testType && exportOptions.testType !== 'all') {
        query = query.eq('test_type', exportOptions.testType);
      }
      if (exportOptions.status && exportOptions.status !== 'all') {
        query = query.eq('status', exportOptions.status as "approved" | "draft" | "rejected" | "submitted");
      }
      if (exportOptions.material && exportOptions.material !== 'all') {
        query = query.eq('material', exportOptions.material as "aggregates" | "asphalt" | "concrete" | "custom" | "soil");
      }
      if (exportOptions.roadName && exportOptions.roadName !== 'all') {
        query = query.eq('road_name', exportOptions.roadName);
      }

      query = query.order('created_at', { ascending: false });

      const { data: reports, error } = await query;
      if (error) throw error;

      const { data: projects } = await supabase
        .from('projects')
        .select(`*, companies(*)`)
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

    const company = data.projects[0]?.companies || {};

    // Header
    pdf.setFontSize(20);
    pdf.setTextColor(33, 37, 41);
    pdf.text('ConstructTest Pro', margin, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(14);
    pdf.setTextColor(108, 117, 125);
    pdf.text('Test Reports Export', margin, yPosition);
    yPosition += 15;

    // Export Info Box
    pdf.setFillColor(248, 249, 250);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 35, 'F');
    pdf.setFontSize(10);
    pdf.setTextColor(33, 37, 41);
    yPosition += 8;
    pdf.text(`Generated: ${format(new Date(), 'PPP p')}`, margin + 5, yPosition);
    yPosition += 6;
    pdf.text(`Company: ${company.name || profile?.company_name || 'N/A'}`, margin + 5, yPosition);
    yPosition += 6;
    pdf.text(`Total Reports: ${data.reports.length}`, margin + 5, yPosition);
    yPosition += 6;
    pdf.text(`Date Range: ${exportOptions.dateRange === 'custom' ? 'Custom' : exportOptions.dateRange}`, margin + 5, yPosition);
    yPosition += 20;

    // Summary Statistics
    const passedReports = data.reports.filter((r: any) => r.compliance_status === 'pass' || r.status === 'approved').length;
    const failedReports = data.reports.filter((r: any) => r.compliance_status === 'fail' || r.status === 'rejected').length;
    const pendingReports = data.reports.filter((r: any) => r.status === 'draft' || r.status === 'submitted').length;
    const complianceRate = data.reports.length > 0 ? ((passedReports / data.reports.length) * 100).toFixed(1) : '0';

    pdf.setFontSize(14);
    pdf.setTextColor(33, 37, 41);
    pdf.text('Summary Statistics', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    const statsData = [
      { label: 'Compliance Rate', value: `${complianceRate}%`, color: [40, 167, 69] },
      { label: 'Passed/Approved', value: passedReports.toString(), color: [40, 167, 69] },
      { label: 'Failed/Rejected', value: failedReports.toString(), color: [220, 53, 69] },
      { label: 'Pending', value: pendingReports.toString(), color: [255, 193, 7] },
    ];

    statsData.forEach((stat, index) => {
      const xPos = margin + (index * 42);
      pdf.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
      pdf.text(stat.value, xPos, yPosition);
      pdf.setTextColor(108, 117, 125);
      pdf.text(stat.label, xPos, yPosition + 5);
    });
    yPosition += 20;

    // Reports Table
    pdf.setFontSize(14);
    pdf.setTextColor(33, 37, 41);
    pdf.text('Test Reports', margin, yPosition);
    yPosition += 10;

    // Table Header
    pdf.setFillColor(233, 236, 239);
    pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 8, 'F');
    pdf.setFontSize(8);
    pdf.setTextColor(33, 37, 41);
    
    const headers = ['Report #', 'Test Type', 'Date', 'Status', 'Material', 'Project'];
    const columnWidths = [28, 38, 22, 22, 25, 35];
    let xPosition = margin;

    headers.forEach((header, index) => {
      pdf.text(header, xPosition + 2, yPosition);
      xPosition += columnWidths[index];
    });
    yPosition += 8;

    // Table Data
    pdf.setFontSize(7);
    data.reports.slice(0, 100).forEach((report: any, rowIndex: number) => {
      if (yPosition > pdf.internal.pageSize.height - 30) {
        pdf.addPage();
        yPosition = margin;
      }

      // Alternating row colors
      if (rowIndex % 2 === 0) {
        pdf.setFillColor(248, 249, 250);
        pdf.rect(margin, yPosition - 3, pageWidth - 2 * margin, 6, 'F');
      }

      xPosition = margin;
      
      const status = report.status || 'draft';
      const rowData = [
        report.report_number || 'N/A',
        report.test_type || 'N/A',
        report.test_date ? format(new Date(report.test_date), 'dd/MM/yy') : 'N/A',
        status.toUpperCase(),
        report.material || 'N/A',
        report.projects?.name || 'No Project'
      ];

      pdf.setTextColor(33, 37, 41);
      rowData.forEach((cell, index) => {
        const truncated = cell.length > 18 ? cell.substring(0, 15) + '...' : cell;
        pdf.text(truncated, xPosition + 2, yPosition);
        xPosition += columnWidths[index];
      });
      yPosition += 6;
    });

    // Footer
    const pageCount = pdf.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(108, 117, 125);
      pdf.text(
        `Page ${i} of ${pageCount} | Generated by ConstructTest Pro`,
        pageWidth / 2,
        pdf.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    return pdf;
  };

  const exportToExcel = (data: any) => {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['ConstructTest Pro - Export Summary'],
      [],
      ['Generated', format(new Date(), 'PPP p')],
      ['Company', profile?.company_name || 'N/A'],
      ['Total Reports', data.reports.length],
      ['Date Range', exportOptions.dateRange],
      [],
      ['Statistics'],
      ['Approved/Passed', data.reports.filter((r: any) => r.compliance_status === 'pass' || r.status === 'approved').length],
      ['Rejected/Failed', data.reports.filter((r: any) => r.compliance_status === 'fail' || r.status === 'rejected').length],
      ['Pending', data.reports.filter((r: any) => r.status === 'draft' || r.status === 'submitted').length],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // Reports Sheet
    const reportHeaders = [
      'Report Number',
      'Test Type',
      'Material',
      'Test Date',
      'Technician',
      'Status',
      'Compliance Status',
      'Project',
      'Road Name',
      'Chainage From',
      'Chainage To',
      'Side',
      'Notes',
      'Created At',
      'Updated At'
    ];

    const reportRows = data.reports.map((report: any) => [
      report.report_number || '',
      report.test_type || '',
      report.material || '',
      report.test_date || '',
      report.technician_name || '',
      report.status || '',
      report.compliance_status || '',
      report.projects?.name || '',
      report.road_name || '',
      report.chainage_from || '',
      report.chainage_to || '',
      report.side || '',
      report.notes || '',
      report.created_at ? format(new Date(report.created_at), 'PPP') : '',
      report.updated_at ? format(new Date(report.updated_at), 'PPP') : '',
    ]);

    const reportsSheet = XLSX.utils.aoa_to_sheet([reportHeaders, ...reportRows]);
    
    // Set column widths
    reportsSheet['!cols'] = [
      { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 20 },
      { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 12 },
      { wch: 12 }, { wch: 10 }, { wch: 30 }, { wch: 15 }, { wch: 15 }
    ];
    
    XLSX.utils.book_append_sheet(wb, reportsSheet, 'Test Reports');

    // Projects Sheet (if including projects data)
    if (selectedExports.includes('projects') && data.projects.length > 0) {
      const projectHeaders = ['Name', 'Client', 'Contractor', 'Consultant', 'Status', 'Start Date', 'End Date', 'Location'];
      const projectRows = data.projects.map((project: any) => [
        project.name || '',
        project.client_name || '',
        project.contractor_name || '',
        project.consultant_name || '',
        project.status || '',
        project.start_date || '',
        project.end_date || '',
        project.location || '',
      ]);
      const projectsSheet = XLSX.utils.aoa_to_sheet([projectHeaders, ...projectRows]);
      projectsSheet['!cols'] = [
        { wch: 30 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 30 }
      ];
      XLSX.utils.book_append_sheet(wb, projectsSheet, 'Projects');
    }

    // Generate file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  };

  const exportToCSV = (data: any) => {
    const headers = [
      'Report Number',
      'Test Type',
      'Material Type',
      'Test Date',
      'Technician',
      'Status',
      'Compliance Status',
      'Project',
      'Road Name',
      'Chainage From',
      'Chainage To',
      'Side',
      'Created At',
      'Notes'
    ];

    const csvData = [
      headers.join(','),
      ...data.reports.map((report: any) => [
        `"${report.report_number || ''}"`,
        `"${report.test_type || ''}"`,
        `"${report.material || ''}"`,
        `"${report.test_date || ''}"`,
        `"${report.technician_name || ''}"`,
        `"${report.status || ''}"`,
        `"${report.compliance_status || ''}"`,
        `"${report.projects?.name || ''}"`,
        `"${report.road_name || ''}"`,
        `"${report.chainage_from || ''}"`,
        `"${report.chainage_to || ''}"`,
        `"${report.side || ''}"`,
        `"${report.created_at ? format(new Date(report.created_at), 'PPP') : ''}"`,
        `"${(report.notes || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    return new Blob([csvData], { type: 'text/csv' });
  };

  const exportToJSON = (data: any) => {
    const exportData = {
      metadata: {
        generated: new Date().toISOString(),
        company: profile?.company_name,
        totalReports: data.reports.length,
        dateRange: exportOptions.dateRange,
        filters: {
          project: exportOptions.projectId,
          testType: exportOptions.testType,
          status: exportOptions.status,
          material: exportOptions.material,
        }
      },
      statistics: {
        total: data.reports.length,
        approved: data.reports.filter((r: any) => r.status === 'approved').length,
        rejected: data.reports.filter((r: any) => r.status === 'rejected').length,
        submitted: data.reports.filter((r: any) => r.status === 'submitted').length,
        draft: data.reports.filter((r: any) => r.status === 'draft').length,
      },
      reports: data.reports,
      projects: selectedExports.includes('projects') ? data.projects : undefined
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

      if (data.reports.length === 0) {
        toast({
          title: "No data to export",
          description: "No reports found matching your filters",
          variant: "destructive",
        });
        return;
      }

      let downloadUrl: string;
      let filename: string;
      const dateStr = format(new Date(), 'yyyy-MM-dd');

      switch (exportOptions.format) {
        case 'pdf':
          const pdf = await exportToPDF(data);
          const pdfBlob = pdf.output('blob');
          downloadUrl = URL.createObjectURL(pdfBlob);
          filename = `test-reports-export-${dateStr}.pdf`;
          break;

        case 'excel':
          const excelBlob = exportToExcel(data);
          downloadUrl = URL.createObjectURL(excelBlob);
          filename = `test-reports-export-${dateStr}.xlsx`;
          break;

        case 'csv':
          const csvBlob = exportToCSV(data);
          downloadUrl = URL.createObjectURL(csvBlob);
          filename = `test-reports-export-${dateStr}.csv`;
          break;

        case 'json':
          const jsonBlob = exportToJSON(data);
          downloadUrl = URL.createObjectURL(jsonBlob);
          filename = `test-reports-export-${dateStr}.json`;
          break;

        default:
          throw new Error('Unsupported export format');
      }

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Export successful",
        description: `${data.reports.length} reports exported as ${exportOptions.format.toUpperCase()}`,
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
      let attachmentData = null;
      if (emailOptions.attachReport) {
        const data = await fetchReportData();
        if (data) {
          const pdf = await exportToPDF(data);
          attachmentData = {
            filename: `test-reports-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
            content: pdf.output('datauristring').split(',')[1],
            type: 'application/pdf'
          };
        }
      }

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

  const handleTriggerZapier = async () => {
    if (!zapierWebhook.trim()) {
      toast({
        title: "Missing webhook URL",
        description: "Please enter your Zapier webhook URL",
        variant: "destructive",
      });
      return;
    }

    setIsTriggeringZap(true);

    try {
      const data = await fetchReportData();
      
      await fetch(zapierWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          company: profile?.company_name,
          totalReports: data?.reports.length || 0,
          reports: data?.reports || [],
          triggered_from: window.location.origin,
        }),
      });

      toast({
        title: "Zapier Triggered",
        description: "Request sent successfully. Check your Zap's history to confirm.",
      });

    } catch (error: any) {
      console.error("Error triggering Zapier:", error);
      toast({
        title: "Error",
        description: "Failed to trigger Zapier webhook",
        variant: "destructive",
      });
    } finally {
      setIsTriggeringZap(false);
    }
  };

  const handleShareLink = () => {
    const link = `${window.location.origin}/reports/shared/${Date.now()}`;
    setShareableLink(link);
    setIsShareDialogOpen(true);
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied",
      description: "Shareable link copied to clipboard",
    });
  };

  const handlePrint = async () => {
    try {
      const data = await fetchReportData();
      if (!data) throw new Error('Failed to fetch report data');

      const pdf = await exportToPDF(data);
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      const printWindow = window.open(pdfUrl);
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }
      
      toast({
        title: "Print dialog opened",
        description: "PDF ready for printing",
      });
    } catch (error: any) {
      console.error('Print error:', error);
      toast({
        title: "Print failed",
        description: error.message || "Failed to prepare document for printing",
        variant: "destructive",
      });
    }
  };

  const toggleExportItem = (item: string) => {
    setSelectedExports(prev => 
      prev.includes(item) 
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Export & Integration</h2>
        <p className="text-muted-foreground">
          Export reports, send emails, and integrate with external systems
        </p>
      </div>

      <Tabs defaultValue="export" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Filters Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Export Filters
                </CardTitle>
                <CardDescription>
                  Configure what data to include in your export
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label>Date Range</Label>
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
                        <SelectItem value="custom">Custom range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Date Pickers */}
                  {exportOptions.dateRange === 'custom' && (
                    <>
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <Calendar className="mr-2 h-4 w-4" />
                              {exportOptions.customStartDate 
                                ? format(exportOptions.customStartDate, 'PPP')
                                : 'Pick a date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={exportOptions.customStartDate}
                              onSelect={(date) => setExportOptions(prev => ({ ...prev, customStartDate: date }))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <Calendar className="mr-2 h-4 w-4" />
                              {exportOptions.customEndDate 
                                ? format(exportOptions.customEndDate, 'PPP')
                                : 'Pick a date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={exportOptions.customEndDate}
                              onSelect={(date) => setExportOptions(prev => ({ ...prev, customEndDate: date }))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </>
                  )}

                  {/* Project Filter */}
                  <div className="space-y-2">
                    <Label>Project</Label>
                    <Select 
                      value={exportOptions.projectId || 'all'} 
                      onValueChange={(value) => setExportOptions(prev => ({ ...prev, projectId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Road Filter */}
                  {exportOptions.projectId && exportOptions.projectId !== 'all' && roads.length > 0 && (
                    <div className="space-y-2">
                      <Label>Road</Label>
                      <Select 
                        value={exportOptions.roadName || 'all'} 
                        onValueChange={(value) => setExportOptions(prev => ({ ...prev, roadName: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roads</SelectItem>
                          {roads.map((road) => (
                            <SelectItem key={road.id} value={road.name}>
                              {road.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Test Type Filter */}
                  <div className="space-y-2">
                    <Label>Test Type</Label>
                    <Select 
                      value={exportOptions.testType || 'all'} 
                      onValueChange={(value) => setExportOptions(prev => ({ ...prev, testType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Test Types</SelectItem>
                        {TEST_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select 
                      value={exportOptions.status || 'all'} 
                      onValueChange={(value) => setExportOptions(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Material Filter */}
                  <div className="space-y-2">
                    <Label>Material</Label>
                    <Select 
                      value={exportOptions.material || 'all'} 
                      onValueChange={(value) => setExportOptions(prev => ({ ...prev, material: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Materials</SelectItem>
                        {MATERIALS.map((material) => (
                          <SelectItem key={material} value={material}>
                            {material.charAt(0).toUpperCase() + material.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Data to Include */}
                <div className="space-y-2 pt-4 border-t">
                  <Label>Data to Include</Label>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="include-reports" 
                        checked={selectedExports.includes('reports')}
                        onCheckedChange={() => toggleExportItem('reports')}
                        disabled
                      />
                      <label htmlFor="include-reports" className="text-sm">Test Reports</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="include-projects" 
                        checked={selectedExports.includes('projects')}
                        onCheckedChange={() => toggleExportItem('projects')}
                      />
                      <label htmlFor="include-projects" className="text-sm">Project Details</label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export
                </CardTitle>
                <CardDescription>
                  Download your data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-primary">{reportCount}</p>
                  <p className="text-sm text-muted-foreground">Reports matching filters</p>
                </div>

                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <Select 
                    value={exportOptions.format} 
                    onValueChange={(value: any) => setExportOptions(prev => ({ ...prev, format: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-red-500" />
                          PDF Report
                        </div>
                      </SelectItem>
                      <SelectItem value="excel">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-green-600" />
                          Excel Spreadsheet
                        </div>
                      </SelectItem>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          CSV File
                        </div>
                      </SelectItem>
                      <SelectItem value="json">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-orange-500" />
                          JSON Data
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleExport} 
                  disabled={isExporting || reportCount === 0}
                  className="w-full"
                  size="lg"
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

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handlePrint}
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleShareLink}
                  >
                    <Share className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Send Reports via Email
              </CardTitle>
              <CardDescription>
                Email reports directly to clients, stakeholders, or team members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipients">Recipients</Label>
                    <Input
                      id="recipients"
                      value={emailOptions.recipients}
                      onChange={(e) => setEmailOptions(prev => ({ ...prev, recipients: e.target.value }))}
                      placeholder="email@example.com, another@example.com"
                    />
                    <p className="text-xs text-muted-foreground">Separate multiple emails with commas</p>
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
                      rows={5}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="attach-report" 
                      checked={emailOptions.attachReport}
                      onCheckedChange={(checked) => setEmailOptions(prev => ({ ...prev, attachReport: checked as boolean }))}
                    />
                    <label htmlFor="attach-report" className="text-sm">Attach PDF report</label>
                  </div>

                  <Button
                    onClick={handleSendEmail}
                    disabled={isSendingEmail || !emailOptions.recipients.trim()}
                    className="w-full"
                  >
                    {isSendingEmail ? 'Sending...' : 'Send Email'}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <h4 className="font-medium mb-2">Email Preview</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">To:</span> {emailOptions.recipients || 'No recipients'}</p>
                      <p><span className="text-muted-foreground">Subject:</span> {emailOptions.subject}</p>
                      <div className="pt-2 border-t">
                        <p className="text-muted-foreground mb-1">Message:</p>
                        <p className="whitespace-pre-wrap">{emailOptions.message}</p>
                      </div>
                      {emailOptions.attachReport && (
                        <div className="pt-2 border-t flex items-center gap-2 text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span>PDF attachment will be included</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Quick Templates</h4>
                    <div className="space-y-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => setEmailOptions(prev => ({
                          ...prev,
                          subject: 'Weekly Test Report Summary',
                          message: 'Dear Team,\n\nPlease find attached the weekly test report summary for your review.\n\nBest regards'
                        }))}
                      >
                        Weekly Summary
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => setEmailOptions(prev => ({
                          ...prev,
                          subject: 'Project Compliance Report',
                          message: 'Dear Client,\n\nAttached is the compliance report for the project as requested.\n\nPlease let us know if you have any questions.\n\nBest regards'
                        }))}
                      >
                        Compliance Report
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => setEmailOptions(prev => ({
                          ...prev,
                          subject: 'Urgent: Failed Test Report',
                          message: 'ATTENTION REQUIRED\n\nThis email contains test reports that have failed compliance. Immediate action may be required.\n\nPlease review the attached report.'
                        }))}
                      >
                        Failed Test Alert
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Zapier Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  Zapier Integration
                </CardTitle>
                <CardDescription>
                  Connect to 5,000+ apps with Zapier webhooks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="zapier-webhook">Webhook URL</Label>
                  <Input
                    id="zapier-webhook"
                    value={zapierWebhook}
                    onChange={(e) => setZapierWebhook(e.target.value)}
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Create a Zap with "Catch Hook" trigger and paste the URL
                  </p>
                </div>
                
                <Button 
                  onClick={handleTriggerZapier} 
                  disabled={isTriggeringZap || !zapierWebhook.trim()}
                  className="w-full"
                >
                  {isTriggeringZap ? 'Triggering...' : 'Send to Zapier'}
                </Button>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Popular automations:</strong> Send to Slack, update Google Sheets, create Trello cards, notify via SMS
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Cloud Storage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-blue-500" />
                  Cloud Storage
                </CardTitle>
                <CardDescription>
                  Export directly to cloud storage services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" disabled>
                  <img src="https://www.google.com/drive/static/images/drive/logo-drive.png" alt="Google Drive" className="h-4 w-4 mr-2" />
                  Google Drive
                  <Badge variant="secondary" className="ml-auto">Coming Soon</Badge>
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Cloud className="h-4 w-4 mr-2 text-blue-600" />
                  Dropbox
                  <Badge variant="secondary" className="ml-auto">Coming Soon</Badge>
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Cloud className="h-4 w-4 mr-2 text-blue-500" />
                  OneDrive
                  <Badge variant="secondary" className="ml-auto">Coming Soon</Badge>
                </Button>
              </CardContent>
            </Card>

            {/* Project Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  Project Management
                </CardTitle>
                <CardDescription>
                  Sync with project management tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" disabled>
                  <span className="h-4 w-4 mr-2 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">A</span>
                  Asana
                  <Badge variant="secondary" className="ml-auto">Coming Soon</Badge>
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <span className="h-4 w-4 mr-2 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">T</span>
                  Trello
                  <Badge variant="secondary" className="ml-auto">Coming Soon</Badge>
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <span className="h-4 w-4 mr-2 bg-purple-600 rounded text-white text-xs flex items-center justify-center font-bold">N</span>
                  Notion
                  <Badge variant="secondary" className="ml-auto">Coming Soon</Badge>
                </Button>
              </CardContent>
            </Card>

            {/* Communication */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share className="h-5 w-5 text-purple-600" />
                  Communication
                </CardTitle>
                <CardDescription>
                  Send notifications to communication platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" disabled>
                  <span className="h-4 w-4 mr-2 bg-[#4A154B] rounded text-white text-xs flex items-center justify-center font-bold">S</span>
                  Slack
                  <Badge variant="secondary" className="ml-auto">Coming Soon</Badge>
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <span className="h-4 w-4 mr-2 bg-[#0078D4] rounded text-white text-xs flex items-center justify-center font-bold">T</span>
                  Microsoft Teams
                  <Badge variant="secondary" className="ml-auto">Coming Soon</Badge>
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <span className="h-4 w-4 mr-2 bg-green-500 rounded text-white text-xs flex items-center justify-center font-bold">W</span>
                  WhatsApp
                  <Badge variant="secondary" className="ml-auto">Coming Soon</Badge>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                REST API Access
              </CardTitle>
              <CardDescription>
                Access your data programmatically via our REST API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">API Endpoints</h4>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-500/10 text-green-600">GET</Badge>
                    <code>/api/v1/reports</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-500/10 text-green-600">GET</Badge>
                    <code>/api/v1/projects</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600">POST</Badge>
                    <code>/api/v1/reports</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">PUT</Badge>
                    <code>/api/v1/reports/:id</code>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium">Features</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• RESTful API design</li>
                    <li>• JSON response format</li>
                    <li>• Pagination support</li>
                    <li>• Filtering & sorting</li>
                    <li>• Rate limiting</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <LinkIcon className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium">Authentication</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Use API keys to authenticate your requests
                  </p>
                  <Button variant="outline" size="sm" disabled>
                    Generate API Key
                    <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Example Request</h4>
                <pre className="text-sm bg-background p-3 rounded border overflow-x-auto">
{`curl -X GET \\
  'https://api.constructtestpro.com/v1/reports' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json'`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Share Link Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shareable Link</DialogTitle>
            <DialogDescription>
              Share this link with anyone to give them access to the report
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg break-all">
              <code className="text-sm">{shareableLink}</code>
            </div>
            <Button 
              onClick={() => {
                navigator.clipboard.writeText(shareableLink);
                toast({
                  title: "Copied",
                  description: "Link copied to clipboard",
                });
              }}
              className="w-full"
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}