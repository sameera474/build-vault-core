import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, FileText, CheckCircle, AlertTriangle, XCircle, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface MonthlySummary {
  month: string;
  year: number;
  totalReports: number;
  passedReports: number;
  failedReports: number;
  pendingReports: number;
  reviewRequiredReports: number;
  complianceRate: number;
  testTypes: { [key: string]: number };
  projects: { [key: string]: number };
}

interface TestReport {
  id: string;
  test_date: string;
  compliance_status: string;
  test_type: string;
  project_id: string;
  projects?: { name: string };
}

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6'];
const statusColors = {
  pass: '#22c55e',
  fail: '#ef4444', 
  pending: '#f59e0b',
  review_required: '#3b82f6'
};

export default function MonthlySummaries() {
  const [summaries, setSummaries] = useState<MonthlySummary[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchMonthlySummaries();
  }, [profile?.company_id, selectedYear]);

  const fetchMonthlySummaries = async () => {
    if (!profile?.company_id) return;

    try {
      // Fetch all test reports for the selected year
      const { data: reports, error } = await supabase
        .from('test_reports')
        .select(`
          id,
          test_date,
          compliance_status,
          test_type,
          project_id,
          projects (name)
        `)
        .eq('company_id', profile.company_id)
        .gte('test_date', `${selectedYear}-01-01`)
        .lte('test_date', `${selectedYear}-12-31`)
        .order('test_date', { ascending: true });

      if (error) throw error;

      // Get available years
      const { data: allReports, error: yearsError } = await supabase
        .from('test_reports')
        .select('test_date')
        .eq('company_id', profile.company_id);

      if (yearsError) throw yearsError;

      const years = Array.from(new Set(
        allReports.map(r => new Date(r.test_date).getFullYear())
      )).sort((a, b) => b - a);

      setAvailableYears(years);

      // Process reports into monthly summaries
      const monthlyData = processReportsIntoSummaries(reports || []);
      setSummaries(monthlyData);
    } catch (error) {
      console.error('Error fetching monthly summaries:', error);
      toast({
        title: "Error",
        description: "Failed to load monthly summaries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processReportsIntoSummaries = (reports: TestReport[]): MonthlySummary[] => {
    const monthlyMap: { [key: string]: MonthlySummary } = {};

    // Initialize all months for the selected year
    for (let month = 0; month < 12; month++) {
      const monthKey = `${selectedYear}-${String(month + 1).padStart(2, '0')}`;
      const monthName = new Date(selectedYear, month).toLocaleDateString('en-US', { month: 'long' });
      
      monthlyMap[monthKey] = {
        month: monthName,
        year: selectedYear,
        totalReports: 0,
        passedReports: 0,
        failedReports: 0,
        pendingReports: 0,
        reviewRequiredReports: 0,
        complianceRate: 0,
        testTypes: {},
        projects: {}
      };
    }

    // Process each report
    reports.forEach(report => {
      const reportDate = new Date(report.test_date);
      const monthKey = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyMap[monthKey]) {
        const summary = monthlyMap[monthKey];
        summary.totalReports++;

        // Count by status
        switch (report.compliance_status) {
          case 'pass':
            summary.passedReports++;
            break;
          case 'fail':
            summary.failedReports++;
            break;
          case 'pending':
            summary.pendingReports++;
            break;
          case 'review_required':
            summary.reviewRequiredReports++;
            break;
        }

        // Count by test type
        summary.testTypes[report.test_type] = (summary.testTypes[report.test_type] || 0) + 1;

        // Count by project
        const projectName = report.projects?.name || 'Unassigned';
        summary.projects[projectName] = (summary.projects[projectName] || 0) + 1;

        // Calculate compliance rate
        if (summary.totalReports > 0) {
          summary.complianceRate = Math.round((summary.passedReports / summary.totalReports) * 100);
        }
      }
    });

    return Object.values(monthlyMap);
  };

  const getFilteredSummaries = () => {
    if (selectedMonth === 'all') {
      return summaries;
    }
    return summaries.filter(summary => summary.month === selectedMonth);
  };

  const getYearlyTotals = () => {
    const totals = summaries.reduce((acc, summary) => ({
      totalReports: acc.totalReports + summary.totalReports,
      passedReports: acc.passedReports + summary.passedReports,
      failedReports: acc.failedReports + summary.failedReports,
      pendingReports: acc.pendingReports + summary.pendingReports,
      reviewRequiredReports: acc.reviewRequiredReports + summary.reviewRequiredReports,
    }), {
      totalReports: 0,
      passedReports: 0,
      failedReports: 0,
      pendingReports: 0,
      reviewRequiredReports: 0,
    });

    const complianceRate = totals.totalReports > 0 
      ? Math.round((totals.passedReports / totals.totalReports) * 100)
      : 0;

    return { ...totals, complianceRate };
  };

  const getChartData = () => {
    return summaries.map(summary => ({
      month: summary.month.slice(0, 3), // Short month name
      total: summary.totalReports,
      passed: summary.passedReports,
      failed: summary.failedReports,
      pending: summary.pendingReports,
      complianceRate: summary.complianceRate
    }));
  };

  const getPieChartData = () => {
    const totals = getYearlyTotals();
    return [
      { name: 'Passed', value: totals.passedReports, color: statusColors.pass },
      { name: 'Failed', value: totals.failedReports, color: statusColors.fail },
      { name: 'Pending', value: totals.pendingReports, color: statusColors.pending },
      { name: 'Review Required', value: totals.reviewRequiredReports, color: statusColors.review_required },
    ].filter(item => item.value > 0);
  };

  const exportSummary = () => {
    const filteredData = getFilteredSummaries();
    const csvContent = generateCSV(filteredData);
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `monthly-summary-${selectedYear}${selectedMonth !== 'all' ? `-${selectedMonth}` : ''}.csv`);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateCSV = (data: MonthlySummary[]) => {
    const headers = ['Month', 'Year', 'Total Reports', 'Passed', 'Failed', 'Pending', 'Review Required', 'Compliance Rate (%)'];
    const rows = data.map(summary => [
      summary.month,
      summary.year,
      summary.totalReports,
      summary.passedReports,
      summary.failedReports,
      summary.pendingReports,
      summary.reviewRequiredReports,
      summary.complianceRate
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const yearlyTotals = getYearlyTotals();
  const chartData = getChartData();
  const pieData = getPieChartData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monthly Summaries</h1>
          <p className="text-muted-foreground">
            Analyze test report trends and compliance metrics over time
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {summaries.map(summary => (
                <SelectItem key={summary.month} value={summary.month}>{summary.month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={exportSummary} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Yearly Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{yearlyTotals.totalReports}</div>
            <p className="text-xs text-muted-foreground">in {selectedYear}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{yearlyTotals.passedReports}</div>
            <p className="text-xs text-muted-foreground">tests passed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{yearlyTotals.failedReports}</div>
            <p className="text-xs text-muted-foreground">tests failed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{yearlyTotals.pendingReports}</div>
            <p className="text-xs text-muted-foreground">awaiting results</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{yearlyTotals.complianceRate}%</div>
            <p className="text-xs text-muted-foreground">overall rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Test Volume</CardTitle>
            <CardDescription>Number of tests conducted each month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="passed" stackId="a" fill={statusColors.pass} name="Passed" />
                  <Bar dataKey="failed" stackId="a" fill={statusColors.fail} name="Failed" />
                  <Bar dataKey="pending" stackId="a" fill={statusColors.pending} name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Rate Trend</CardTitle>
            <CardDescription>Monthly compliance percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Compliance Rate']} />
                  <Line 
                    type="monotone" 
                    dataKey="complianceRate" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                    dot={{ fill: '#2563eb', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution and Monthly Details */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Overall test results breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Breakdown</CardTitle>
            <CardDescription>Detailed statistics for each month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {getFilteredSummaries().filter(s => s.totalReports > 0).map((summary) => (
                <div key={summary.month} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{summary.month} {summary.year}</h4>
                    <p className="text-sm text-muted-foreground">
                      {summary.totalReports} reports • {summary.complianceRate}% compliance
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-green-100 text-green-800">
                      {summary.passedReports} passed
                    </Badge>
                    {summary.failedReports > 0 && (
                      <Badge className="bg-red-100 text-red-800">
                        {summary.failedReports} failed
                      </Badge>
                    )}
                    {summary.pendingReports > 0 && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {summary.pendingReports} pending
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {getFilteredSummaries().filter(s => s.totalReports > 0).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No test reports found for the selected period.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}