import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  Loader2,
  Users,
  Mail,
  Building2,
} from "lucide-react";
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
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";

interface TeamMember {
  user_id: string;
  name: string | null;
  email: string | null;
  tenant_role: string;
  avatar_url: string | null;
}

export default function TechnicianDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    testsToday: 0,
    passingTests: 0,
    pendingTests: 0,
    totalTests: 0,
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.user_id || !profile?.company_id) return;
      setLoading(true);

      try {
        const today = new Date().toISOString().split("T")[0];

        const [
          { count: todayCount, error: todayError },
          { data: allTests, error: allTestsError },
          { data: members },
        ] = await Promise.all([
          supabase
            .from("test_reports")
            .select("*", { count: "exact", head: true })
            .eq("company_id", profile.company_id)
            .gte("test_date", today),
          supabase
            .from("test_reports")
            .select("compliance_status, status")
            .eq("company_id", profile.company_id),
          supabase
            .from("profiles")
            .select("user_id, name, email, tenant_role, avatar_url")
            .eq("company_id", profile.company_id)
            .eq("is_super_admin", false),
        ]);

        if (todayError) throw todayError;
        if (allTestsError) throw allTestsError;

        setTeamMembers((members || []) as TeamMember[]);

        const passing =
          allTests?.filter((r) => r.compliance_status === "pass").length || 0;
        const pending =
          allTests?.filter((r) => r.status === "draft").length || 0;

        setStats({
          testsToday: todayCount || 0,
          passingTests: passing,
          pendingTests: pending,
          totalTests: allTests?.length || 0,
        });
      } catch (error) {
        console.error("Error fetching technician stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile?.user_id, profile?.company_id]);

  const formatRole = (role: string) => {
    return role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pieData = [
    { name: "Passing", value: stats.passingTests },
    { name: "Pending", value: stats.pendingTests },
  ];
  const COLORS = ["#22c55e", "#f97316"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Technician Dashboard
        </h1>
        <p className="text-muted-foreground">
          Your testing activity and performance summary for{" "}
          <span className="font-semibold text-primary">
            {profile?.company_name}
          </span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests Today</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.testsToday}</div>
            <p className="text-xs text-muted-foreground">Completed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passing Tests</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.passingTests}</div>
            <p className="text-xs text-muted-foreground">Meeting standards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTests}</div>
            <p className="text-xs text-muted-foreground">Drafts to complete</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTests}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Test Status Overview</CardTitle>
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

      {/* My Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            My Profile
          </CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <UserAvatar
              userName={profile?.name}
              avatarUrl={profile?.avatar_url}
              className="h-16 w-16 text-lg"
            />
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{profile?.name || "Unknown"}</h3>
              <Badge variant="secondary">{formatRole(profile?.tenant_role || "technician")}</Badge>
              {profile?.email && (
                <p className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                  <Mail className="h-3 w-3" />
                  {profile.email}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
          <CardDescription>
            {teamMembers.length} team members in {profile?.company_name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No team members found</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {teamMembers.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <UserAvatar
                    userName={member.name}
                    avatarUrl={member.avatar_url}
                    className="h-10 w-10"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{member.name || "Unknown"}</p>
                    <Badge variant="outline" className="text-xs">
                      {formatRole(member.tenant_role)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
