import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarIcon,
  Download,
  BarChart3,
  FileText,
  CheckCircle,
  FileSpreadsheet,
  Eye,
  Printer,
  Loader2,
  Settings2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import TestTypeSummaryTable, { type TestReport } from "@/components/monthly-summary/TestTypeSummaryTable";
import SummaryHeader from "@/components/monthly-summary/SummaryHeader";
import { exportToExcel } from "@/components/monthly-summary/exportToExcel";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Project {
  id: string;
  name: string;
  contract_number?: string;
  client_name?: string;
  consultant_name?: string;
  contractor_name?: string;
  client_logo?: string;
  contractor_logo?: string;
  consultant_logo?: string;
}

interface ProjectRoad {
  id: string;
  name: string;
  project_id: string;
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
  const [roads, setRoads] = useState<ProjectRoad[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedRoad, setSelectedRoad] = useState<string>("all");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("all");
  const [selectedTestType, setSelectedTestType] = useState<string>("all");
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [detailedReports, setDetailedReports] = useState<TestReport[]>([]);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showDescriptionSection, setShowDescriptionSection] = useState(true);

  const materialOptions = [
    "all",
    "soil",
    "concrete",
    "aggregates",
    "asphalt",
    "custom",
  ];

  const currentProject = useMemo(() => 
    projects.find(p => p.id === selectedProject),
    [projects, selectedProject]
  );

  // Group reports by test type
  const reportsByTestType = useMemo(() => {
    const grouped: Record<string, TestReport[]> = {};
    detailedReports.forEach(report => {
      const testType = report.test_type || "Other";
      if (!grouped[testType]) {
        grouped[testType] = [];
      }
      grouped[testType].push(report);
    });
    return grouped;
  }, [detailedReports]);

  // Get unique test types for filter
  const availableTestTypes = useMemo(() => {
    return ["all", ...Object.keys(reportsByTestType).sort()];
  }, [reportsByTestType]);

  // Filter reports by selected test type
  const filteredReportsByTestType = useMemo(() => {
    if (selectedTestType === "all") return reportsByTestType;
    if (reportsByTestType[selectedTestType]) {
      return { [selectedTestType]: reportsByTestType[selectedTestType] };
    }
    return {};
  }, [reportsByTestType, selectedTestType]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchRoads();
      setSelectedRoad("all");
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProject && date?.from && date?.to) {
      fetchMonthlySummary();
    }
  }, [selectedProject, selectedRoad, date, selectedMaterial]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase.rpc("user_accessible_projects");

      if (error) throw error;

      setProjects(data || []);
      if (data && data.length > 0) {
        setSelectedProject(data[0].id);
      }
    } catch (error: any) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoads = async () => {
    if (!selectedProject) return;

    try {
      const { data, error } = await supabase
        .from("project_roads")
        .select("*")
        .eq("project_id", selectedProject)
        .order("name");

      if (error) throw error;
      setRoads(data || []);
    } catch (error: any) {
      console.error("Error fetching roads:", error);
      toast({
        title: "Error",
        description: "Failed to load roads",
        variant: "destructive",
      });
    }
  };

  const fetchMonthlySummary = async () => {
    if (!selectedProject || !date?.from || !date?.to) return;

    setLoading(true);
    try {
      // Fetch detailed reports with data_json and summary_json
      let query = supabase
        .from("test_reports")
        .select("id, status, test_type, test_date, report_number, compliance_status, technician_name, road_name, material, covered_chainage, chainage_from, chainage_to, side, data_json, summary_json, laboratory_test_no")
        .eq("project_id", selectedProject)
        .gte("test_date", date.from.toISOString().split("T")[0])
        .lte("test_date", date.to.toISOString().split("T")[0])
        .order("test_date", { ascending: true });

      if (selectedMaterial !== "all") {
        query = query.eq("material", selectedMaterial as "aggregates" | "asphalt" | "concrete" | "custom" | "soil");
      }

      if (selectedRoad !== "all") {
        query = query.eq("road_name", selectedRoad);
      }

      const { data: reports, error } = await query;

      if (error) throw error;

      setDetailedReports(reports || []);

      const testTypeCounts: { [key: string]: number } = {};
      reports?.forEach((report) => {
        if (report.test_type) {
          testTypeCounts[report.test_type] =
            (testTypeCounts[report.test_type] || 0) + 1;
        }
      });

      const summaryData: MonthlySummary = {
        month: `${format(date.from, "LLL dd, y")} - ${format(date.to, "LLL dd, y")}`,
        total_reports: reports?.length || 0,
        approved_reports: reports?.filter((r) => r.status === "approved").length || 0,
        pending_reports: reports?.filter((r) => r.status === "draft" || r.status === "submitted").length || 0,
        test_types: testTypeCounts,
      };

      setSummary(summaryData);
      setSelectedTestType("all");
    } catch (error: any) {
      console.error("Error fetching summary:", error);
      toast({
        title: "Error",
        description: "Failed to generate monthly summary",
        variant: "destructive",
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
        title: "Generating PDF",
        description: "Your monthly summary is being generated...",
      });

      const { data, error } = await supabase.functions.invoke(
        "export_monthly_summary_pdf",
        {
          body: {
            project_id: selectedProject,
            road_name: selectedRoad !== "all" ? selectedRoad : undefined,
            start_date: date?.from?.toISOString(),
            end_date: date?.to?.toISOString(),
            material: selectedMaterial,
            test_type: selectedTestType !== "all" ? selectedTestType : undefined,
          },
        }
      );

      if (error) throw error;

      if (data?.url) {
        // Use download link approach to avoid popup blockers
        const link = document.createElement("a");
        link.href = data.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.download = `monthly-summary-${currentProject?.name || "report"}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Success",
          description: "Monthly summary PDF has been generated",
        });
      } else {
        throw new Error("No download URL returned");
      }
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  const generateExcelSummary = () => {
    if (!summary || !currentProject || !date?.from || !date?.to) return;
    setGeneratingExcel(true);

    try {
      const fileName = exportToExcel({
        project: currentProject,
        dateRange: { from: date.from, to: date.to },
        roadName: selectedRoad,
        material: selectedMaterial,
        reportsByTestType: filteredReportsByTestType,
      });

      toast({ 
        title: "Excel file generated",
        description: `Downloaded: ${fileName}`,
      });
    } catch (error) {
      console.error("Error generating Excel:", error);
      toast({ title: "Failed to generate Excel file", variant: "destructive" });
    } finally {
      setGeneratingExcel(false);
    }
  };

  const handlePrint = () => {
    window.print();
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
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Monthly Summaries</h1>
          <p className="text-sm text-muted-foreground">
            Generate and view monthly test report summaries by test type
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Generate Summary
          </CardTitle>
          <CardDescription>
            Select project, filters, and period to generate monthly summary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <label className="text-sm font-medium mb-2 block">Project</label>
              <Select
                value={selectedProject}
                onValueChange={setSelectedProject}
              >
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
              <label className="text-sm font-medium mb-2 block">Road</label>
              <Select
                value={selectedRoad}
                onValueChange={setSelectedRoad}
                disabled={!selectedProject || roads.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select road" />
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
            <div>
              <label className="text-sm font-medium mb-2 block">Material</label>
              <Select
                value={selectedMaterial}
                onValueChange={setSelectedMaterial}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Materials" />
                </SelectTrigger>
                <SelectContent>
                  {materialOptions.map((material) => (
                    <SelectItem key={material} value={material}>
                      {material.charAt(0).toUpperCase() + material.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Test Type</label>
              <Select
                value={selectedTestType}
                onValueChange={setSelectedTestType}
                disabled={availableTestTypes.length <= 1}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Test Types" />
                </SelectTrigger>
                <SelectContent>
                  {availableTestTypes.map((testType) => (
                    <SelectItem key={testType} value={testType}>
                      {testType === "all" ? "All Test Types" : testType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Date range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full h-10 justify-start text-left font-normal px-3 border-input hover:bg-accent hover:text-accent-foreground",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {date?.from ? (
                        date.to ? (
                          <>
                            {format(date.from, "MMM dd")} - {format(date.to, "MMM dd, yyyy")}
                          </>
                        ) : (
                          format(date.from, "MMM dd, yyyy")
                        )
                      ) : (
                        "Pick a date"
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Results */}
      {summary && (
        <>
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-3 print:hidden">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Reports
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.total_reports}
                </div>
                <p className="text-xs text-muted-foreground">{summary.month}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Approved Reports
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {summary.approved_reports}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.total_reports > 0
                    ? `${Math.round((summary.approved_reports / summary.total_reports) * 100)}% approved`
                    : "No reports"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Reports
                </CardTitle>
                <CalendarIcon className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {summary.pending_reports}
                </div>
                <p className="text-xs text-muted-foreground">Awaiting review</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for Overview and Detailed Preview */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="print:hidden">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <TabsList>
                <TabsTrigger value="overview" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Detailed Preview
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="show-description"
                    checked={showDescriptionSection}
                    onCheckedChange={setShowDescriptionSection}
                  />
                  <Label htmlFor="show-description" className="text-sm cursor-pointer">
                    Show Description Section
                  </Label>
                </div>
                <Button
                  onClick={generateExcelSummary}
                  disabled={generatingExcel}
                  variant="outline"
                  size="sm"
                >
                  {generatingExcel ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                  )}
                  Export Excel
                </Button>
                <Button 
                  onClick={generatePdfSummary} 
                  disabled={generatingPdf}
                  size="sm"
                >
                  {generatingPdf ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export PDF
                </Button>
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  size="sm"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>

            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Test Types Breakdown</CardTitle>
                  <CardDescription>
                    Distribution of test types for {summary.month}
                  </CardDescription>
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
                            <TableRow 
                              key={testType}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => {
                                setSelectedTestType(testType);
                                setActiveTab("preview");
                              }}
                            >
                              <TableCell className="font-medium">
                                {testType}
                              </TableCell>
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
            </TabsContent>

            <TabsContent value="preview" className="mt-4 space-y-6">
              {/* Summary Header for Preview/Print */}
              {currentProject && date?.from && date?.to && (
                <SummaryHeader
                  projectName={currentProject.name}
                  contractNumber={currentProject.contract_number}
                  clientName={currentProject.client_name}
                  consultantName={currentProject.consultant_name}
                  contractorName={currentProject.contractor_name}
                  roadName={selectedRoad}
                  testType={selectedTestType !== "all" ? selectedTestType : undefined}
                  dateRange={{ from: date.from, to: date.to }}
                  clientLogo={currentProject.client_logo}
                  contractorLogo={currentProject.contractor_logo}
                  consultantLogo={currentProject.consultant_logo}
                  showDescriptionSection={showDescriptionSection}
                />
              )}

              {/* Test Type Tables */}
              {Object.keys(filteredReportsByTestType).length > 0 ? (
                Object.entries(filteredReportsByTestType).map(([testType, reports]) => (
                  <Card key={testType}>
                    <CardContent className="pt-6">
                      <TestTypeSummaryTable
                        testType={testType}
                        reports={reports}
                        projectName={currentProject?.name}
                      />
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Reports Found</h3>
                    <p className="text-muted-foreground mt-2 text-center">
                      No test reports match the selected filters
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Print-only content */}
          <div className="hidden print:block">
            {currentProject && date?.from && date?.to && (
              <SummaryHeader
                projectName={currentProject.name}
                contractNumber={currentProject.contract_number}
                clientName={currentProject.client_name}
                consultantName={currentProject.consultant_name}
                contractorName={currentProject.contractor_name}
                roadName={selectedRoad}
                testType={selectedTestType !== "all" ? selectedTestType : undefined}
                dateRange={{ from: date.from, to: date.to }}
                clientLogo={currentProject.client_logo}
                contractorLogo={currentProject.contractor_logo}
                consultantLogo={currentProject.consultant_logo}
                showDescriptionSection={showDescriptionSection}
              />
            )}
            
            {Object.entries(filteredReportsByTestType).map(([testType, reports]) => (
              <div key={testType} className="mb-8 break-inside-avoid">
                <TestTypeSummaryTable
                  testType={testType}
                  reports={reports}
                  projectName={currentProject?.name}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {!summary && selectedProject && (
        <Card className="print:hidden">
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
