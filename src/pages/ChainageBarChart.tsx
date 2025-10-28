import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BarChart3, MapPin, Download, RefreshCw, Loader2, ChevronLeft, Layers, Settings } from "lucide-react";
import { LayerManagement } from "@/components/LayerManagement";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
}

interface ProjectRoad {
  id: string;
  name: string;
  project_id: string;
  company_id: string;
  created_at: string;
}

interface LayerData {
  layer: string;
  chainage: string;
  side: "LHS" | "RHS" | "FULL";
  material: string;
  report_id: string;
  chainage_from: number;
  chainage_to: number;
}

export default function ChainageBarChart() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [roads, setRoads] = useState<ProjectRoad[]>([]);
  const [selectedRoadId, setSelectedRoadId] = useState<string>("");
  const [layerData, setLayerData] = useState<LayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [layerOrder, setLayerOrder] = useState<string[]>([]);
  const [layerColors, setLayerColors] = useState<{ [key: string]: string }>({});
  const [showLayerSettings, setShowLayerSettings] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  // Fetch layers from database
  const fetchLayers = async () => {
    if (!profile) return;

    try {
      let query = supabase
        .from("construction_layers")
        .select("name, color, display_order")
        .eq("is_active", true);

      // Only filter by company_id if not super admin
      if (!profile.is_super_admin && profile.company_id) {
        query = query.eq("company_id", profile.company_id);
      }

      const { data: layers, error } = await query.order("display_order");

      if (error) throw error;

      if (layers && layers.length > 0) {
        const order = layers.map((l) => l.name);
        const colors = layers.reduce((acc, l) => {
          acc[l.name] = l.color;
          return acc;
        }, {} as { [key: string]: string });

        setLayerOrder(order);
        setLayerColors(colors);
      }
    } catch (error) {
      console.error("Error fetching layers:", error);
    }
  };

  useEffect(() => {
    fetchLayers();
  }, [profile]);

  useEffect(() => {
    fetchProjects();
  }, [profile]);

  useEffect(() => {
    if (projectId && projectId !== ":projectId" && !projectId.includes(":")) {
      fetchProjectData(projectId);
      fetchProjectRoads(projectId);
    }
  }, [projectId, profile]);

  useEffect(() => {
    if (projectId && projectId !== ":projectId" && !projectId.includes(":") && layerOrder.length > 0 && selectedRoadId) {
      fetchLayerData(projectId, selectedRoadId);
    }
  }, [projectId, selectedRoadId, profile, layerOrder]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!projectId || projectId === ":projectId" || projectId.includes(":") || layerOrder.length === 0 || !selectedRoadId) return;
    
    const interval = setInterval(() => {
      fetchLayerData(projectId, selectedRoadId, true);
    }, 30000);

    return () => clearInterval(interval);
  }, [projectId, selectedRoadId, profile, layerOrder]);

  const fetchProjects = async () => {
    if (!profile) return;
    setLoading(true);

    try {
      let query = supabase
        .from("projects")
        .select("id, name, description, location");
      
      // Only filter by company_id if not super admin
      if (!profile.is_super_admin && profile.company_id) {
        query = query.eq("company_id", profile.company_id);
      }
      
      const { data, error } = await query.order("name");

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      if (!projectId || projectId === ":projectId" || projectId.includes(":")) {
        setLoading(false);
      }
    }
  };

  const fetchProjectData = async (id: string) => {
    if (!profile || !id || id.includes(":")) return;

    try {
      let query = supabase
        .from("projects")
        .select("id, name, description, location")
        .eq("id", id);
      
      // Only filter by company_id if not super admin
      if (!profile.is_super_admin && profile.company_id) {
        query = query.eq("company_id", profile.company_id);
      }
      
      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error("Error fetching project:", error);
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive",
      });
    }
  };

  const fetchProjectRoads = async (id: string) => {
    if (!profile || !id || id.includes(":")) return;

    try {
      let query = supabase
        .from("project_roads")
        .select("*")
        .eq("project_id", id);
      
      // Only filter by company_id if not super admin
      if (!profile.is_super_admin && profile.company_id) {
        query = query.eq("company_id", profile.company_id);
      }
      
      const { data, error } = await query.order("name");

      if (error) throw error;
      setRoads(data || []);
      
      // Auto-select first road if available
      if (data && data.length > 0 && !selectedRoadId) {
        setSelectedRoadId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching project roads:", error);
      toast({
        title: "Error",
        description: "Failed to load project roads",
        variant: "destructive",
      });
    }
  };

  const parseChainageToMeters = (chainage: string): number => {
    if (!chainage) return 0;
    // Handle formats like "5+562", "01+250", "1+100"
    const cleanChainage = String(chainage).replace(/\s/g, "");
    const parts = cleanChainage.split("+");
    if (parts.length === 2) {
      const km = parseInt(parts[0]) || 0;
      const meters = parseInt(parts[1]) || 0;
      return km * 1000 + meters;
    }
    // Try to parse as plain number
    return parseInt(cleanChainage) || 0;
  };

  const fetchLayerData = async (id: string, roadId: string, isRefresh = false) => {
    if (!profile || !id || id.includes(":") || !roadId) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Get the road name first
      const { data: roadData } = await supabase
        .from("project_roads")
        .select("name")
        .eq("id", roadId)
        .single();

      if (!roadData) {
        setLayerData([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const { data, error } = await supabase
        .from("test_reports")
        .select(
          "id, chainage_from, chainage_to, material, custom_material, side, road_name"
        )
        .eq("project_id", id)
        .eq("road_name", roadData.name)
        .order("chainage_from");

      if (error) throw error;

      const layerPoints: LayerData[] = (data || [])
        .map((report) => {
          const from = parseChainageToMeters(report.chainage_from || "");
          const to = parseChainageToMeters(report.chainage_to || "");
          const material =
            report.material === "custom"
              ? report.custom_material
              : report.material;

          // Map side values
          let sideValue: "LHS" | "RHS" | "FULL" = "FULL";
          if (report.side) {
            const sideStr = String(report.side).toLowerCase();
            if (sideStr === "left" || sideStr === "lhs") {
              sideValue = "LHS";
            } else if (sideStr === "right" || sideStr === "rhs") {
              sideValue = "RHS";
            }
          }

          return {
            layer: material?.toUpperCase() || "OTHER",
            chainage: report.chainage_from && report.chainage_to 
              ? `${report.chainage_from} to ${report.chainage_to}`
              : "Unknown",
            side: sideValue,
            material: material || "unknown",
            report_id: report.id,
            chainage_from: from,
            chainage_to: to,
          };
        })
        .filter(
          (p) => p.material && p.chainage_from > 0 && p.chainage_to > 0
        );

      setLayerData(layerPoints);
      
      if (isRefresh) {
        toast({
          title: "Data Refreshed",
          description: "Layer works chart updated successfully",
        });
      }
    } catch (error) {
      console.error("Error fetching layer data:", error);
      toast({
        title: "Error",
        description: "Failed to load layer data",
        variant: "destructive",
      });
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleRefresh = () => {
    if (projectId && projectId !== ":projectId" && !projectId.includes(":") && selectedRoadId) {
      fetchLayerData(projectId, selectedRoadId, true);
    }
  };

  const groupByLayer = () => {
    const grouped: { [key: string]: { lhs: LayerData[], rhs: LayerData[] } } = {};
    
    // Initialize all predefined layers
    layerOrder.forEach(layer => {
      grouped[layer] = { lhs: [], rhs: [] };
    });

    // Also add any custom layers from the data
    layerData.forEach(item => {
      if (!grouped[item.layer]) {
        grouped[item.layer] = { lhs: [], rhs: [] };
      }
    });

    // Group the data
    layerData.forEach(item => {
      if (grouped[item.layer]) {
        if (item.side === "LHS" || item.side === "FULL") {
          grouped[item.layer].lhs.push(item);
        }
        if (item.side === "RHS" || item.side === "FULL") {
          grouped[item.layer].rhs.push(item);
        }
      }
    });

    return grouped;
  };

  const exportLayerData = () => {
    const grouped = groupByLayer();
    let csvContent = "Layer,Side,Chainage From,Chainage To,Material,Report ID\n";
    
    Object.entries(grouped).forEach(([layer, data]) => {
      data.lhs.forEach(item => {
        csvContent += `${layer},LHS,${item.chainage_from},${item.chainage_to},${item.material},${item.report_id}\n`;
      });
      data.rhs.forEach(item => {
        csvContent += `${layer},RHS,${item.chainage_from},${item.chainage_to},${item.material},${item.report_id}\n`;
      });
    });

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `layer-works-${project?.name || "chart"}-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!projectId || projectId === ":projectId" || projectId.includes(":")) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Layer Works Chainage Chart
          </h1>
          <p className="text-muted-foreground">
            Select a project to view layer works progress
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Select Project</CardTitle>
            <CardDescription>
              Choose a project to visualize layer works
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((proj) => (
                <Card
                  key={proj.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{proj.name}</CardTitle>
                    <CardDescription>{proj.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="h-4 w-4" />
                      {proj.location}
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => navigate(`/barchart/${proj.id}`)}
                    >
                      View Layer Chart
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {projects.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No projects found. Create a project first to view layer works charts.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const grouped = groupByLayer();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/barchart/:projectId")}
            className="mb-2"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            Layer Works Chainage Chart
          </h1>
          <p className="text-muted-foreground">
            {project?.name} - Construction layer progress
          </p>
          {roads.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm font-medium">Road:</span>
              <Select value={selectedRoadId} onValueChange={setSelectedRoadId}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a road" />
                </SelectTrigger>
                <SelectContent>
                  {roads.map((road) => (
                    <SelectItem key={road.id} value={road.id}>
                      {road.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setShowLayerSettings(true)} 
            variant="outline"
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Layers
          </Button>
          <Button 
            onClick={handleRefresh} 
            variant="outline"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportLayerData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Project Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {project?.name}
          </CardTitle>
          <CardDescription>
            {project?.description} • {project?.location}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="font-medium">Total Reports:</span> {layerData.length}
            </div>
            <div>
              <span className="font-medium">Auto-refresh:</span> Every 30 seconds
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layer Works Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Layer Works Progress
          </CardTitle>
          <CardDescription>
            Construction layers by chainage (LHS and RHS)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {layerData.length > 0 ? (
            <div className="space-y-6">
              {/* LHS Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="text-base font-semibold">
                    LHS (Left Hand Side)
                  </Badge>
                </div>
                <div className="space-y-2">
                  {Object.keys(grouped).filter(layer => grouped[layer].lhs.length > 0 || layerOrder.includes(layer)).map((layer) => {
                    const lhsData = grouped[layer]?.lhs || [];
                    if (lhsData.length === 0 && !layerOrder.includes(layer)) return null;
                    
                    // Find max chainage for scaling
                    const maxChainage = Math.max(...layerData.map(d => d.chainage_to), 10000);
                    
                    return (
                      <div key={`lhs-${layer}`} className="flex items-center gap-2">
                        <div className="w-40 text-sm font-medium text-right">{layer}</div>
                        <div className="flex-1 h-8 bg-muted rounded relative overflow-hidden">
                          {lhsData.map((item, idx) => (
                            <div
                              key={idx}
                              className="absolute h-full group cursor-pointer hover:opacity-80 transition-opacity"
                              style={{
                                left: `${(item.chainage_from / maxChainage) * 100}%`,
                                width: `${((item.chainage_to - item.chainage_from) / maxChainage) * 100}%`,
                                backgroundColor: layerColors[layer] || "#6b7280",
                              }}
                              title={`${item.chainage} - ${item.material}`}
                            >
                              <div className="absolute inset-0 flex items-center justify-center text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                {item.chainage}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RHS Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="text-base font-semibold">
                    RHS (Right Hand Side)
                  </Badge>
                </div>
                <div className="space-y-2">
                  {Object.keys(grouped).filter(layer => grouped[layer].rhs.length > 0 || layerOrder.includes(layer)).map((layer) => {
                    const rhsData = grouped[layer]?.rhs || [];
                    if (rhsData.length === 0 && !layerOrder.includes(layer)) return null;
                    
                    // Find max chainage for scaling
                    const maxChainage = Math.max(...layerData.map(d => d.chainage_to), 10000);
                    
                    return (
                      <div key={`rhs-${layer}`} className="flex items-center gap-2">
                        <div className="w-40 text-sm font-medium text-right">{layer}</div>
                        <div className="flex-1 h-8 bg-muted rounded relative overflow-hidden">
                          {rhsData.map((item, idx) => (
                            <div
                              key={idx}
                              className="absolute h-full group cursor-pointer hover:opacity-80 transition-opacity"
                              style={{
                                left: `${(item.chainage_from / maxChainage) * 100}%`,
                                width: `${((item.chainage_to - item.chainage_from) / maxChainage) * 100}%`,
                                backgroundColor: layerColors[layer] || "#6b7280",
                                opacity: 0.7,
                              }}
                              title={`${item.chainage} - ${item.material}`}
                            >
                              <div className="absolute inset-0 flex items-center justify-center text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                {item.chainage}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chainage Scale */}
              <div className="mt-4 pl-40">
                <div className="flex justify-between text-xs text-muted-foreground border-t pt-2">
                  {(() => {
                    const maxChainage = Math.max(...layerData.map(d => d.chainage_to), 10000);
                    const steps = 5;
                    return Array.from({ length: steps }, (_, i) => {
                      const value = (maxChainage / (steps - 1)) * i;
                      const km = Math.floor(value / 1000);
                      const m = Math.floor(value % 1000);
                      return (
                        <span key={i}>
                          {String(km).padStart(2, '0')}+{String(m).padStart(3, '0')}
                        </span>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <Layers className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Layer Works Data Available</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {roads.length === 0 
                  ? "This project doesn't have any roads configured yet. Add roads to the project first."
                  : !selectedRoadId
                  ? "Please select a road to view layer works data."
                  : `No test reports found for the selected road with layer and chainage information.`}
              </p>
              <div className="bg-muted/50 rounded-lg p-6 max-w-2xl mx-auto mb-6">
                <h4 className="font-medium mb-3 text-left">To display layer works data, test reports must include:</h4>
                <ul className="text-left space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span><strong>Material/Layer type</strong> (e.g., SUB GRADE, ABC TOP, WEARING)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span><strong>Chainage From</strong> (e.g., 0+000, 1+250)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span><strong>Chainage To</strong> (e.g., 0+100, 1+300)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span><strong>Side</strong> (LHS, RHS, or both)</span>
                  </li>
                </ul>
              </div>
              <div className="flex gap-3 justify-center">
                {roads.length === 0 ? (
                  <Button onClick={() => navigate(`/projects/${projectId}/edit`)} size="lg">
                    Configure Project Roads
                  </Button>
                ) : (
                  <>
                    <Button onClick={() => navigate("/test-reports")} size="lg">
                      View All Test Reports
                    </Button>
                    <Button onClick={() => navigate("/test-reports/new")} variant="outline" size="lg">
                      Create New Report
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Layer Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.keys(grouped).map((layer) => (
              <div key={layer} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: layerColors[layer] || "#6b7280" }}
                ></div>
                <span className="text-xs">{layer}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Layer Management Dialog */}
      <Dialog open={showLayerSettings} onOpenChange={setShowLayerSettings}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Construction Layers</DialogTitle>
          </DialogHeader>
          <LayerManagement onLayersUpdated={() => {
            fetchLayers();
            if (projectId && projectId !== ":projectId" && !projectId.includes(":") && selectedRoadId) {
              fetchLayerData(projectId, selectedRoadId);
            }
          }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
