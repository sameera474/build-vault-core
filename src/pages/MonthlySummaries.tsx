import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, Download, BarChart3, FileText, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
}

interface MonthlySummary {
  month: string;
  total_reports: number;
  approved_reports: number;
  pending_reports: number;
  test_types: { [key: string]: number };
}

export default function MonthlySummaries() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject && selectedYear && selectedMonth) {
      fetchMonthlySummary();
    }
  }, [selectedProject, selectedYear, selectedMonth]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .rpc('user_accessible_projects');

      if (error) throw error;

      setProjects(data || []);
      if (data && data.length > 0) {
        setSelectedProject(data[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlySummary = async () => {
    if (!selectedProject || !selectedYear || !selectedMonth) return;

    setLoading(true);
    try {
      const startDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1);
      const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0);

      const { data: reports, error } = await supabase
        .from('test_reports')
        .select('id, status, test_type, created_at')
        .eq('project_id', selectedProject)
        .gte('test_date', startDate.toISOString().split('T')[0])
        .lte('test_date', endDate.toISOString().split('T')[0]);

      if (error) throw error;

      const testTypeCounts: { [key: string]: number } = {};
      reports?.forEach(report => {
        if (report.test_type) {
          testTypeCounts[report.test_type] = (testTypeCounts[report.test_type] || 0) + 1;
        }
      });

      const summaryData: MonthlySummary = {
        month: `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`,
        total_reports: reports?.length || 0,
        approved_reports: reports?.filter(r => r.status === 'approved').length || 0,
        pending_reports: reports?.filter(r => r.status === 'draft' || r.status === 'submitted').length || 0,
        test_types: testTypeCounts,
      };

      setSummary(summaryData);
    } catch (error: any) {
      console.error('Error fetching summary:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate monthly summary',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePdfSummary = async () => {
    if (!summary || !selectedProject) return;

    setGeneratingPdf(true);
    try {
      toast({
        title: 'Generating PDF',
        description: 'Your monthly summary is being generated...',
      });

      const { data, error } = await supabase.functions.invoke('export_monthly_summary_pdf', {
        body: {
          project_id: selectedProject,
          year: selectedYear,
          month: selectedMonth,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Open the PDF in a new tab
        window.open(data.url, '_blank');
        
        toast({
          title: 'Success',
          description: 'Monthly summary PDF has been generated and downloaded',
        });
      } else {
        throw new Error('No download URL returned');
      }
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate PDF',
        variant: 'destructive',
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Monthly Summaries</h1>
          <p className="text-muted-foreground">Generate and view monthly test report summaries</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Generate Summary
          </CardTitle>
          <CardDescription>Select project and period to generate monthly summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Project</label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Results */}
      {summary && (
        <>
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total_reports}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.month}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved Reports</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{summary.approved_reports}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.total_reports > 0 
                    ? `${Math.round((summary.approved_reports / summary.total_reports) * 100)}% approved`
                    : 'No reports'
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
                <CalendarIcon className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{summary.pending_reports}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting review
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Test Types Breakdown */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Test Types Breakdown</CardTitle>
                <CardDescription>Distribution of test types for {summary.month}</CardDescription>
              </div>
              <Button onClick={generatePdfSummary} disabled={generatingPdf}>
                <Download className="h-4 w-4 mr-2" />
                {generatingPdf ? 'Generating...' : 'Export PDF'}
              </Button>
            </CardHeader>
            <CardContent>
              {Object.keys(summary.test_types).length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test Type</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(summary.test_types)
                      .sort(([, a], [, b]) => b - a)
                      .map(([testType, count]) => (
                        <TableRow key={testType}>
                          <TableCell className="font-medium">{testType}</TableCell>
                          <TableCell className="text-right">{count}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">
                              {Math.round((count / summary.total_reports) * 100)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No test reports found for this period
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!summary && selectedProject && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Data Available</h3>
            <p className="text-muted-foreground mt-2 text-center">
              Select a project and period to generate a monthly summary
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}