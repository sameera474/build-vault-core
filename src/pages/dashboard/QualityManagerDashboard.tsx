import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Loader2,
} from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function QualityManagerDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    passRate: 100,
    failedTests: 0,
    ncrs: 0,
    queuedTests: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.user_id) return;
      setLoading(true);

      try {
        const [
          { data: allReports, error: reportsError },
          { count: queuedCount, error: queuedError },
        ] = await Promise.all([
          supabase
            .from("test_reports")
            .select("compliance_status, status"),
          supabase
            .from("test_reports")
            .select("*", { count: "exact", head: true })
            .eq("status", "draft"),
        ]);

        if (reportsError) throw reportsError;
        if (queuedError) throw queuedError;

        const passed =
          allReports?.filter((r) => r.compliance_status === "pass").length || 0;
        const failed =
          allReports?.filter((r) => r.compliance_status === "fail").length || 0;
        const total = allReports?.length || 0;
        const passRate = total > 0 ? Math.round((passed / total) * 100) : 100;

        setStats({
          passRate,
          failedTests: failed,
          ncrs: failed, // NCRs could be failed tests
          queuedTests: queuedCount || 0,
        });
      } catch (error) {
        console.error("Error fetching QM stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [profile?.user_id]);

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
          Quality Manager Dashboard
        </h1>
        <p className="text-muted-foreground">
          Quality metrics for{" "}
          <span className="font-semibold text-primary">
            {profile?.company_name}
          </span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.passRate}%</div>
            <p className="text-xs text-muted-foreground">
              Tests passing standards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Tests</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedTests}</div>
            <p className="text-xs text-muted-foreground">
              Tests below standards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NCRs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ncrs}</div>
            <p className="text-xs text-muted-foreground">
              Non-conformance reports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lab Queue</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.queuedTests}</div>
            <p className="text-xs text-muted-foreground">
              Tests pending completion
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quality Metrics Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Pass Rate", value: stats.passRate, fill: "#22c55e" },
                  {
                    name: "Failed Tests",
                    value: stats.failedTests,
                    fill: "#ef4444",
                  },
                  { name: "NCRs", value: stats.ncrs, fill: "#f97316" },
                  {
                    name: "Queued Tests",
                    value: stats.queuedTests,
                    fill: "#3b82f6",
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))",
                  }}
                  formatter={(value, name) => {
                    if (name === "Pass Rate") {
                      return [`${value}%`, name];
                    }
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar dataKey="value" name="Value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
