import { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen, 
  FileText, 
  Search, 
  CheckSquare, 
  Square, 
  MinusSquare,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface TestReport {
  id: string;
  report_number: string;
  test_type: string;
  test_date: string;
  status: string;
  compliance_status: string | null;
  road_name: string | null;
  material: string | null;
  project_id: string;
}

interface ProjectNode {
  id: string;
  name: string;
  roads: RoadNode[];
  reports: TestReport[];
}

interface RoadNode {
  name: string;
  reports: TestReport[];
}

interface ReportFileBrowserProps {
  selectedReports: string[];
  onSelectionChange: (reportIds: string[]) => void;
  maxHeight?: string;
}

export function ReportFileBrowser({ 
  selectedReports, 
  onSelectionChange,
  maxHeight = "400px" 
}: ReportFileBrowserProps) {
  const [projects, setProjects] = useState<ProjectNode[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedRoads, setExpandedRoads] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    fetchReportsHierarchy();
  }, [profile?.company_id]);

  const fetchReportsHierarchy = async () => {
    if (!profile?.company_id) return;
    
    setIsLoading(true);
    try {
      // Fetch all projects
      const { data: projectsData, error: projectsError } = await supabase
        .rpc('user_accessible_projects');
      
      if (projectsError) throw projectsError;

      // Fetch all reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('test_reports')
        .select('id, report_number, test_type, test_date, status, compliance_status, road_name, material, project_id')
        .eq('company_id', profile.company_id)
        .order('test_date', { ascending: false });

      if (reportsError) throw reportsError;

      // Build hierarchy
      const projectNodes: ProjectNode[] = (projectsData || []).map((project: any) => {
        const projectReports = (reportsData || []).filter(r => r.project_id === project.id);
        
        // Group reports by road
        const roadMap = new Map<string, TestReport[]>();
        const noRoadReports: TestReport[] = [];
        
        projectReports.forEach(report => {
          if (report.road_name) {
            const existing = roadMap.get(report.road_name) || [];
            roadMap.set(report.road_name, [...existing, report]);
          } else {
            noRoadReports.push(report);
          }
        });

        const roads: RoadNode[] = Array.from(roadMap.entries()).map(([name, reports]) => ({
          name,
          reports
        })).sort((a, b) => a.name.localeCompare(b.name));

        return {
          id: project.id,
          name: project.name,
          roads,
          reports: noRoadReports // Reports without road assignment
        };
      }).filter(p => p.roads.length > 0 || p.reports.length > 0);

      setProjects(projectNodes);
    } catch (error) {
      console.error('Error fetching reports hierarchy:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const toggleRoad = (roadKey: string) => {
    setExpandedRoads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roadKey)) {
        newSet.delete(roadKey);
      } else {
        newSet.add(roadKey);
      }
      return newSet;
    });
  };

  const getProjectReportIds = (project: ProjectNode): string[] => {
    const roadReports = project.roads.flatMap(r => r.reports.map(rep => rep.id));
    const directReports = project.reports.map(r => r.id);
    return [...roadReports, ...directReports];
  };

  const getRoadReportIds = (road: RoadNode): string[] => {
    return road.reports.map(r => r.id);
  };

  const isProjectSelected = (project: ProjectNode) => {
    const reportIds = getProjectReportIds(project);
    return reportIds.length > 0 && reportIds.every(id => selectedReports.includes(id));
  };

  const isProjectPartiallySelected = (project: ProjectNode) => {
    const reportIds = getProjectReportIds(project);
    const selectedCount = reportIds.filter(id => selectedReports.includes(id)).length;
    return selectedCount > 0 && selectedCount < reportIds.length;
  };

  const isRoadSelected = (road: RoadNode) => {
    const reportIds = getRoadReportIds(road);
    return reportIds.length > 0 && reportIds.every(id => selectedReports.includes(id));
  };

  const isRoadPartiallySelected = (road: RoadNode) => {
    const reportIds = getRoadReportIds(road);
    const selectedCount = reportIds.filter(id => selectedReports.includes(id)).length;
    return selectedCount > 0 && selectedCount < reportIds.length;
  };

  const toggleProjectSelection = (project: ProjectNode) => {
    const reportIds = getProjectReportIds(project);
    const allSelected = isProjectSelected(project);
    
    if (allSelected) {
      onSelectionChange(selectedReports.filter(id => !reportIds.includes(id)));
    } else {
      const newSelection = [...new Set([...selectedReports, ...reportIds])];
      onSelectionChange(newSelection);
    }
  };

  const toggleRoadSelection = (road: RoadNode) => {
    const reportIds = getRoadReportIds(road);
    const allSelected = isRoadSelected(road);
    
    if (allSelected) {
      onSelectionChange(selectedReports.filter(id => !reportIds.includes(id)));
    } else {
      const newSelection = [...new Set([...selectedReports, ...reportIds])];
      onSelectionChange(newSelection);
    }
  };

  const toggleReportSelection = (reportId: string) => {
    if (selectedReports.includes(reportId)) {
      onSelectionChange(selectedReports.filter(id => id !== reportId));
    } else {
      onSelectionChange([...selectedReports, reportId]);
    }
  };

  const selectAll = () => {
    const allReportIds = projects.flatMap(p => getProjectReportIds(p));
    onSelectionChange(allReportIds);
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  const getStatusBadge = (status: string, complianceStatus: string | null) => {
    if (complianceStatus === 'pass') {
      return <Badge className="bg-green-500 text-white text-[10px] px-1 py-0">PASS</Badge>;
    }
    if (complianceStatus === 'fail') {
      return <Badge variant="destructive" className="text-[10px] px-1 py-0">FAIL</Badge>;
    }
    
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500 text-white text-[10px] px-1 py-0">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="text-[10px] px-1 py-0">Rejected</Badge>;
      case 'submitted':
        return <Badge variant="secondary" className="text-[10px] px-1 py-0">Submitted</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] px-1 py-0">Draft</Badge>;
    }
  };

  // Filter projects based on search
  const filteredProjects = projects.map(project => {
    if (!searchTerm) return project;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Filter roads and their reports
    const filteredRoads = project.roads.map(road => ({
      ...road,
      reports: road.reports.filter(r => 
        r.report_number.toLowerCase().includes(searchLower) ||
        r.test_type.toLowerCase().includes(searchLower) ||
        road.name.toLowerCase().includes(searchLower)
      )
    })).filter(road => road.reports.length > 0 || road.name.toLowerCase().includes(searchLower));

    // Filter direct reports
    const filteredReports = project.reports.filter(r =>
      r.report_number.toLowerCase().includes(searchLower) ||
      r.test_type.toLowerCase().includes(searchLower)
    );

    // Check if project name matches
    const projectMatches = project.name.toLowerCase().includes(searchLower);

    if (projectMatches || filteredRoads.length > 0 || filteredReports.length > 0) {
      return {
        ...project,
        roads: projectMatches ? project.roads : filteredRoads,
        reports: projectMatches ? project.reports : filteredReports
      };
    }
    return null;
  }).filter(Boolean) as ProjectNode[];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      {/* Header */}
      <div className="p-3 border-b bg-muted/30 space-y-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects, roads, or reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              <CheckSquare className="h-3 w-3 mr-1" />
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={clearSelection}>
              <Square className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
          <Badge variant="secondary">
            {selectedReports.length} selected
          </Badge>
        </div>
      </div>

      {/* File Tree */}
      <ScrollArea style={{ height: maxHeight }}>
        <div className="p-2">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No reports found</p>
              {searchTerm && <p className="text-sm">Try adjusting your search</p>}
            </div>
          ) : (
            filteredProjects.map(project => (
              <div key={project.id} className="select-none">
                {/* Project Level */}
                <div 
                  className={cn(
                    "flex items-center gap-1 py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer group",
                    expandedProjects.has(project.id) && "bg-muted/30"
                  )}
                >
                  <button
                    onClick={() => toggleProject(project.id)}
                    className="p-0.5 hover:bg-muted rounded"
                  >
                    {expandedProjects.has(project.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => toggleProjectSelection(project)}
                    className="p-0.5"
                  >
                    {isProjectSelected(project) ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : isProjectPartiallySelected(project) ? (
                      <MinusSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  
                  {expandedProjects.has(project.id) ? (
                    <FolderOpen className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Folder className="h-4 w-4 text-yellow-500" />
                  )}
                  
                  <span 
                    className="flex-1 text-sm font-medium truncate"
                    onClick={() => toggleProject(project.id)}
                  >
                    {project.name}
                  </span>
                  
                  <Badge variant="outline" className="text-[10px] ml-auto">
                    {getProjectReportIds(project).length}
                  </Badge>
                </div>

                {/* Expanded Project Content */}
                {expandedProjects.has(project.id) && (
                  <div className="ml-6 border-l pl-2">
                    {/* Roads */}
                    {project.roads.map((road, roadIndex) => {
                      const roadKey = `${project.id}-${road.name}`;
                      return (
                        <div key={roadKey}>
                          {/* Road Level */}
                          <div 
                            className={cn(
                              "flex items-center gap-1 py-1 px-2 rounded-md hover:bg-muted/50 cursor-pointer",
                              expandedRoads.has(roadKey) && "bg-muted/20"
                            )}
                          >
                            <button
                              onClick={() => toggleRoad(roadKey)}
                              className="p-0.5 hover:bg-muted rounded"
                            >
                              {expandedRoads.has(roadKey) ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </button>
                            
                            <button
                              onClick={() => toggleRoadSelection(road)}
                              className="p-0.5"
                            >
                              {isRoadSelected(road) ? (
                                <CheckSquare className="h-3.5 w-3.5 text-primary" />
                              ) : isRoadPartiallySelected(road) ? (
                                <MinusSquare className="h-3.5 w-3.5 text-primary" />
                              ) : (
                                <Square className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </button>
                            
                            {expandedRoads.has(roadKey) ? (
                              <FolderOpen className="h-3.5 w-3.5 text-blue-500" />
                            ) : (
                              <Folder className="h-3.5 w-3.5 text-blue-500" />
                            )}
                            
                            <span 
                              className="flex-1 text-sm truncate"
                              onClick={() => toggleRoad(roadKey)}
                            >
                              {road.name}
                            </span>
                            
                            <Badge variant="outline" className="text-[10px]">
                              {road.reports.length}
                            </Badge>
                          </div>

                          {/* Reports in Road */}
                          {expandedRoads.has(roadKey) && (
                            <div className="ml-6 border-l pl-2">
                              {road.reports.map(report => (
                                <div 
                                  key={report.id}
                                  className={cn(
                                    "flex items-center gap-2 py-1 px-2 rounded-md hover:bg-muted/50 cursor-pointer text-sm",
                                    selectedReports.includes(report.id) && "bg-primary/10"
                                  )}
                                  onClick={() => toggleReportSelection(report.id)}
                                >
                                  <Checkbox
                                    checked={selectedReports.includes(report.id)}
                                    onCheckedChange={() => toggleReportSelection(report.id)}
                                    className="h-3.5 w-3.5"
                                  />
                                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="font-mono text-xs truncate flex-1">
                                    {report.report_number}
                                  </span>
                                  <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                                    {report.test_type}
                                  </span>
                                  {getStatusBadge(report.status, report.compliance_status)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Direct Reports (no road assigned) */}
                    {project.reports.length > 0 && (
                      <div className="mt-1">
                        {project.roads.length > 0 && (
                          <div className="text-xs text-muted-foreground px-2 py-1">
                            Unassigned Reports
                          </div>
                        )}
                        {project.reports.map(report => (
                          <div 
                            key={report.id}
                            className={cn(
                              "flex items-center gap-2 py-1 px-2 rounded-md hover:bg-muted/50 cursor-pointer text-sm ml-4",
                              selectedReports.includes(report.id) && "bg-primary/10"
                            )}
                            onClick={() => toggleReportSelection(report.id)}
                          >
                            <Checkbox
                              checked={selectedReports.includes(report.id)}
                              onCheckedChange={() => toggleReportSelection(report.id)}
                              className="h-3.5 w-3.5"
                            />
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-mono text-xs truncate flex-1">
                              {report.report_number}
                            </span>
                            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                              {report.test_type}
                            </span>
                            {getStatusBadge(report.status, report.compliance_status)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
