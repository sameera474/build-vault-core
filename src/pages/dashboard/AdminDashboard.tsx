import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, FileText, DollarSign, Loader2, Mail } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    teamMembers: 0,
    activeProjects: 0,
    totalReports: 0,
    monthlyUsage: 0,
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.user_id || !profile?.company_id) return;
      setLoading(true);

      try {
        const today = new Date();
        const firstDayOfMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        ).toISOString();

        const [
          { data: members },
          { count: projectCount },
          { count: reportCount },
          { count: monthlyReportCount },
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("user_id, name, email, tenant_role, avatar_url")
            .eq("company_id", profile.company_id)
            .eq("is_super_admin", false),
          supabase
            .from("projects")
            .select("*", { count: "exact", head: true })
            .eq("company_id", profile.company_id)
            .eq("status", "active"),
          supabase
            .from("test_reports")
            .select("*", { count: "exact", head: true })
            .eq("company_id", profile.company_id),
          supabase
            .from("test_reports")
            .select("*", { count: "exact", head: true })
            .eq("company_id", profile.company_id)
            .gte("created_at", firstDayOfMonth),
        ]);

        setTeamMembers((members || []) as TeamMember[]);

        setStats({
          teamMembers: members?.length || 0,
          activeProjects: projectCount || 0,
          totalReports: reportCount || 0,
          monthlyUsage: monthlyReportCount || 0,
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
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
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Company-wide overview for{" "}
          <span className="font-semibold text-primary">
            {profile?.company_name}
          </span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamMembers}</div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyUsage}</div>
            <p className="text-xs text-muted-foreground">Reports this month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Team Members", value: stats.teamMembers },
                  { name: "Active Projects", value: stats.activeProjects },
                  { name: "Total Reports", value: stats.totalReports },
                  { name: "Monthly Usage", value: stats.monthlyUsage },
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
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
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
              <Badge variant="secondary">{formatRole(profile?.tenant_role || "admin")}</Badge>
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
