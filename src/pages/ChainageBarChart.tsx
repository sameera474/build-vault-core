import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BarChart3, MapPin, Download, RefreshCw, Loader2, ChevronLeft, Layers } from "lucide-react";
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

interface LayerData {
  layer: string;
  chainage: string;
  side: "LHS" | "RHS" | "FULL";
  material: string;
  report_id: string;
  chainage_from: number;
  chainage_to: number;
}

// Layer order matching the reference image
const layerOrder = [
  "SHOULDER",
  "SHO EMB 2",
  "SHO EMB 1",
  "WEARING",
  "TACK C.",
  "PRIME",
  "ABC TOP",
  "ABC 1ST",
  "SB 2 LAYER",
  "SB 1 LAYER",
  "EMB LAYER5",
  "EMB LAYER4",
  "EMB LAYER3",
  "EMB LAYER2",
  "EMB LAYER 1",
  "SHOULDER S.G.",
  "SUB GRADE",
  "EXCAVATION",
  "CLEARING",
];

const layerColors: { [key: string]: string } = {
  "SHOULDER": "#1f2937",
  "SHO EMB 2": "#374151",
  "SHO EMB 1": "#4b5563",
  "WEARING": "#1f2937",
  "TACK C.": "#6b7280",
  "PRIME": "#f97316",
  "ABC TOP": "#9ca3af",
  "ABC 1ST": "#d1d5db",
  "SB 2 LAYER": "#e5e7eb",
  "SB 1 LAYER": "#f3f4f6",
  "EMB LAYER5": "#fef3c7",
  "EMB LAYER4": "#fde68a",
  "EMB LAYER3": "#fcd34d",
  "EMB LAYER2": "#fbbf24",
  "EMB LAYER 1": "#f59e0b",
  "SHOULDER S.G.": "#d97706",
  "SUB GRADE": "#b45309",
  "EXCAVATION": "#92400e",
  "CLEARING": "#78350f",
};

export default function ChainageBarChart() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [layerData, setLayerData] = useState<LayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, [profile?.company_id]);

  useEffect(() => {
    if (projectId && projectId !== ":projectId" && !projectId.includes(":")) {
      fetchProjectData(projectId);
      fetchLayerData(projectId);
    }
  }, [projectId, profile?.company_id]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!projectId || projectId === ":projectId" || projectId.includes(":")) return;
    
    const interval = setInterval(() => {
      fetchLayerData(projectId, true);
    }, 30000);

    return () => clearInterval(interval);
  }, [projectId, profile?.company_id]);

  const fetchProjects = async () => {
    if (!profile?.company_id) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, description, location")
        .eq("company_id", profile.company_id)
        .order("name");

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
    if (!profile?.company_id || !id || id.includes(":")) return;

    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, description, location")
        .eq("id", id)
        .eq("company_id", profile.company_id)
        .maybeSingle();

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

  const fetchLayerData = async (id: string, isRefresh = false) => {
    if (!profile?.company_id || !id || id.includes(":")) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data, error } = await supabase
        .from("test_reports")
        .select(
          "id, chainage_from, chainage_to, material, custom_material, side"
        )
        .eq("project_id", id)
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
    if (projectId && projectId !== ":projectId" && !projectId.includes(":")) {
      fetchLayerData(projectId, true);
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
        </div>
        <div className="flex items-center gap-2">
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
            <div className="text-center py-12">
              <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Layer Data Found</h3>
              <p className="text-muted-foreground mb-4">
                No test reports with material and chainage information found for this project.
              </p>
              <Button onClick={() => navigate("/test-reports")}>
                Go to Test Reports
              </Button>
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
    </div>
  );
}
