import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Layers,
  MapPin,
  Loader2,
  BarChartHorizontal,
  ChevronLeft,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
}

interface LayerData {
  layer: string;
  chainage: [number, number];
  side: "LHS" | "RHS" | "FULL";
  test_type: string;
  report_id: string;
}

const layerOrder = [
  "Wearing Course",
  "Tack Coat",
  "Binder Course",
  "Prime",
  "Base Course",
  "Sub-base",
  "Subgrade",
  "Embankment",
  "Structure",
  "Other",
];

const layerColors: { [key: string]: string } = {
  "Wearing Course": "#1f2937", // Dark Gray
  "Tack Coat": "#4b5563",
  "Binder Course": "#6b7280",
  "Base Course": "#9ca3af", // Mid Gray
  Prime: "#f97316", // Orange
  "Sub-base": "#d1d5db", // Light Gray
  Subgrade: "#a16207", // Brown
  Embankment: "#ca8a04", // Dark Yellow
  Structure: "#3b82f6", // Blue
  Other: "#8b5cf6", // Purple
};

export default function LayerWorksChart() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [layerData, setLayerData] = useState<LayerData[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchLayerData = async (id: string) => {
    if (!profile?.company_id || !id || id.includes(":")) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("test_reports")
        .select(
          "id, chainage_from, chainage_to, material, custom_material, side, test_type"
        )
        .eq("project_id", id)
        .eq("company_id", profile.company_id)
        .order("chainage_from");

      if (error) throw error;

      const chartPoints: LayerData[] = (data || [])
        .map((report) => ({
          layer:
            report.material === "custom"
              ? report.custom_material
              : report.material,
          chainage: [Number(report.chainage_from), Number(report.chainage_to)],
          side: (report.side?.toUpperCase() as any) || "FULL",
          test_type: report.test_type,
          report_id: report.id,
        }))
        .filter(
          (p) => p.layer && !isNaN(p.chainage[0]) && !isNaN(p.chainage[1])
        );

      setLayerData(chartPoints);
    } catch (error) {
      console.error("Error fetching layer data:", error);
      toast({
        title: "Error",
        description: "Failed to load layer data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-md text-sm">
          <p className="font-bold">{data.layer}</p>
          <p>
            Chainage: {data.chainage[0]}m - {data.chainage[1]}m
          </p>
          <p>Side: {data.side}</p>
          <p>Test Type: {data.test_type}</p>
          <p>Report ID: {data.report_id}</p>
        </div>
      );
    }
    return null;
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
        <CardHeader>
          <CardTitle>Layer Works Chart</CardTitle>
          <CardDescription>
            Select a project to visualize the construction layers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((proj) => (
              <Card
                key={proj.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <CardHeader>
                  <CardTitle className="text-lg">{proj.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={() => navigate(`/layer-works/${proj.id}`)}
                  >
                    View Layer Chart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/layer-works/:projectId")}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <h1 className="text-3xl font-bold tracking-tight mt-2">
            Layer Works Chart
          </h1>
          <p className="text-muted-foreground">
            {project?.name} - Visualization of construction layers
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChartHorizontal className="h-5 w-5" />
            Layers by Chainage
          </CardTitle>
        </CardHeader>
        <CardContent>
          {layerData.length > 0 ? (
            <div className="h-[600px] w-full">
              <ResponsiveContainer>
                <BarChart
                  layout="vertical"
                  data={layerData}
                  margin={{ top: 20, right: 30, left: 50, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    label={{
                      value: "Chainage (m)",
                      position: "insideBottom",
                      offset: -10,
                    }}
                  />
                  <YAxis
                    type="category"
                    dataKey="layer"
                    width={100}
                    domain={layerOrder}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    name="LHS"
                    dataKey={(d) => (d.side !== "RHS" ? d.chainage : null)}
                    stackId="a"
                  >
                    {layerData.map((entry, index) => (
                      <Bar
                        key={`bar-lhs-${index}`}
                        dataKey={() =>
                          entry.side !== "RHS"
                            ? [entry.chainage[0], entry.chainage[1]]
                            : null
                        }
                        fill={layerColors[entry.layer] || layerColors.Other}
                      />
                    ))}
                  </Bar>
                  <Bar
                    name="RHS"
                    dataKey={(d) => (d.side !== "LHS" ? d.chainage : null)}
                    stackId="a"
                  >
                    {layerData.map((entry, index) => (
                      <Bar
                        key={`bar-rhs-${index}`}
                        dataKey={() =>
                          entry.side !== "LHS"
                            ? [entry.chainage[0], entry.chainage[1]]
                            : null
                        }
                        fill={layerColors[entry.layer] || layerColors.Other}
                        fillOpacity={0.6}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Layer Data Found</h3>
              <p className="text-muted-foreground">
                No test reports with material and chainage information found for
                this project.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
