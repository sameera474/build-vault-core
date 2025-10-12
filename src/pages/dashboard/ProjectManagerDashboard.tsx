import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart3,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function ProjectManagerDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeProjects: 0,
    pendingApprovals: 0,
    completedTests: 0,
    complianceRate: 100,
  });
  const [complianceTrend, setComplianceTrend] = useState<
    { month: string; rate: number }[]
  >([]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.company_id) return;
      setLoading(true);

      try {
        const [
          { count: projectCount },
          { count: pendingCount },
          { count: completedCount },
          { data: allReports },
        ] = await Promise.all([
          supabase
            .from("projects")
            .select("*", { count: "exact", head: true })
            .eq("company_id", profile.company_id)
            .eq("status", "active"),
          supabase
            .from("test_reports")
            .select("*", { count: "exact", head: true })
            .eq("company_id", profile.company_id)
            .eq("status", "submitted"),
          supabase
            .from("test_reports")
            .select("*", { count: "exact", head: true })
            .eq("company_id", profile.company_id)
            .eq("status", "approved"),
          supabase
            .from("test_reports")
            .select("compliance_status, created_at")
            .eq("company_id", profile.company_id),
        ]);

        let complianceRate = 100;
        if (allReports && allReports.length > 0) {
          const passed = allReports.filter(
            (r) => r.compliance_status === "pass"
          ).length;
          complianceRate = Math.round((passed / allReports.length) * 100);
        }

        // Calculate compliance trend
        const monthlyData: {
          [key: string]: { total: number; passed: number };
        } = {};
        allReports?.forEach((report) => {
          const month = new Date(report.created_at).toLocaleDateString(
            "en-US",
            { month: "short", year: "numeric" }
          );
          if (!monthlyData[month]) {
            monthlyData[month] = { total: 0, passed: 0 };
          }
          monthlyData[month].total++;
          if (report.compliance_status === "pass") {
            monthlyData[month].passed++;
          }
        });

        const trend = Object.entries(monthlyData).map(([month, data]) => ({
          month,
          date: new Date(month), // Create a date object for sorting
          rate:
            data.total > 0 ? Math.round((data.passed / data.total) * 100) : 0,
        }));

        // Sort the trend data by date
        trend.sort((a, b) => a.date.getTime() - b.date.getTime());

        setComplianceTrend(trend);

        setStats({
          activeProjects: projectCount || 0,
          pendingApprovals: pendingCount || 0,
          completedTests: completedCount || 0,
          complianceRate,
        });
      } catch (error) {
        console.error("Error fetching PM stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [profile?.company_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Project Manager Dashboard
        </h1>
        <p className="text-muted-foreground">
          Project overview for{" "}
          <span className="font-semibold text-primary">
            {profile?.company_name}
          </span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              Projects in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approvals
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">
              Reports awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Tests
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTests}</div>
            <p className="text-xs text-muted-foreground">Approved reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Compliance Rate
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.complianceRate}%</div>
            <p className="text-xs text-muted-foreground">
              Tests passing standards
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Rate Trend</CardTitle>
          <CardDescription>
            Monthly compliance rate of all tests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={complianceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))",
                  }}
                  formatter={(value) => [`${value}%`, "Compliance Rate"]}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
