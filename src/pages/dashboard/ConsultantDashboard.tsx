import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, AlertCircle, Eye, Loader2 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function ConsultantDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReports: 0,
    passedTests: 0,
    failedTests: 0,
    recentReviews: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.user_id) return;
      setLoading(true);

      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const [
          { count: totalCount },
          { count: passedCount },
          { count: failedCount },
          { count: recentCount },
        ] = await Promise.all([
          supabase
            .from("test_reports")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("test_reports")
            .select("*", { count: "exact", head: true })
            .eq("compliance_status", "pass"),
          supabase
            .from("test_reports")
            .select("*", { count: "exact", head: true })
            .eq("compliance_status", "fail"),
          supabase
            .from("test_reports")
            .select("*", { count: "exact", head: true })
            .gte("created_at", sevenDaysAgo.toISOString()),
        ]);

        setStats({
          totalReports: totalCount || 0,
          passedTests: passedCount || 0,
          failedTests: failedCount || 0,
          recentReviews: recentCount || 0,
        });
      } catch (error) {
        console.error("Error fetching consultant stats:", error);
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

  const pieData = [
    { name: "Passed", value: stats.passedTests },
    { name: "Failed", value: stats.failedTests },
  ];
  const COLORS = ["#22c55e", "#ef4444"];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Consultant Dashboard
        </h1>
        <p className="text-muted-foreground">
          Monitoring dashboard for{" "}
          <span className="font-semibold text-primary">
            {profile?.company_name}
          </span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              Available for review
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed Tests</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.passedTests}</div>
            <p className="text-xs text-muted-foreground">Meeting standards</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Tests</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedTests}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Activity
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentReviews}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Your Access Level</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Role:</span>{" "}
              <span className="text-muted-foreground capitalize">
                {profile?.role === "consultant_engineer"
                  ? "Consultant Engineer"
                  : "Consultant Technician"}
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium">Access Type:</span>{" "}
              <span className="text-muted-foreground">Read-Only</span>
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground mt-4">
              <li>• View all test reports</li>
              <li>• Access analytics</li>
              {profile?.role === "consultant_engineer" && (
                <li>• Provide final approval if required</li>
              )}
              <li>• No editing permissions</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Access test reports to review technical data and compliance
              status.
            </p>
            <div className="space-y-2">
              <a href="/test-reports" className="block">
                <Card className="hover:bg-muted/50 transition-smooth cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-medium">View Test Reports</span>
                    </div>
                  </CardContent>
                </Card>
              </a>
              <a href="/analytics" className="block">
                <Card className="hover:bg-muted/50 transition-smooth cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-primary" />
                      <span className="font-medium">View Analytics</span>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Test Compliance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--background))",
                      borderColor: "hsl(var(--border))",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full"
              onClick={() => (window.location.href = "/test-reports")}
            >
              View All Reports
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => (window.location.href = "/analytics")}
            >
              Go to Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
