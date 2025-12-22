import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Users,
  Mail,
  Phone,
  Building2,
  FolderOpen,
  Clock,
  TrendingUp,
  Calendar,
  ArrowRight,
  MapPin,
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
import { UserAvatar } from "@/components/UserAvatar";

interface TeamMember {
  user_id: string;
  name: string | null;
  email: string | null;
  tenant_role: string;
  department: string | null;
  avatar_url: string | null;
}

interface Project {
  id: string;
  name: string;
  status: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  report_count: number;
}

interface RecentReport {
  id: string;
  report_number: string;
  test_type: string;
  status: string;
  test_date: string;
  project_name: string;
  compliance_status: string | null;
}

export default function ProjectManagerDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeProjects: 0,
    pendingApprovals: 0,
    totalReports: 0,
    complianceRate: 100,
    approvedThisMonth: 0,
    draftReports: 0,
  });
  const [complianceTrend, setComplianceTrend] = useState<
    { month: string; rate: number }[]
  >([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.user_id || !profile?.company_id) return;
      setLoading(true);

      try {
        // Use user_accessible_projects to get only assigned projects
        const { data: projectsData } = await supabase.rpc("user_accessible_projects");
        
        const projectIds = (projectsData || []).map((p: any) => p.id);
        
        if (projectIds.length === 0) {
          setStats({
            activeProjects: 0,
            pendingApprovals: 0,
            totalReports: 0,
            complianceRate: 100,
            approvedThisMonth: 0,
            draftReports: 0,
          });
          setLoading(false);
          return;
        }

        // Fetch reports for assigned projects only
        const [
          { data: allReports },
          { data: pendingReports },
          { data: draftReports },
          { data: members },
        ] = await Promise.all([
          supabase
            .from("test_reports")
            .select("id, compliance_status, created_at, status, approved_at")
            .in("project_id", projectIds),
          supabase
            .from("test_reports")
            .select("id")
            .in("project_id", projectIds)
            .eq("status", "submitted"),
          supabase
            .from("test_reports")
            .select("id")
            .in("project_id", projectIds)
            .eq("status", "draft"),
          supabase
            .from("profiles")
            .select("user_id, name, email, tenant_role, department, avatar_url")
            .eq("company_id", profile.company_id)
            .eq("is_super_admin", false),
        ]);

        // Get report counts per project
        const reportCounts: Record<string, number> = {};
        allReports?.forEach(r => {
          const projectId = (r as any).project_id;
          if (projectId) {
            reportCounts[projectId] = (reportCounts[projectId] || 0) + 1;
          }
        });

        // Map projects with report counts
        const projectsWithCounts: Project[] = (projectsData || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          location: p.location,
          start_date: p.start_date,
          end_date: p.end_date,
          report_count: reportCounts[p.id] || 0,
        }));
        setAssignedProjects(projectsWithCounts);

        // Fetch recent reports with project names
        const { data: recentReportsData } = await supabase
          .from("test_reports")
          .select(`
            id,
            report_number,
            test_type,
            status,
            test_date,
            compliance_status,
            projects (name)
          `)
          .in("project_id", projectIds)
          .order("created_at", { ascending: false })
          .limit(5);

        setRecentReports(
          (recentReportsData || []).map((r: any) => ({
            id: r.id,
            report_number: r.report_number,
            test_type: r.test_type,
            status: r.status,
            test_date: r.test_date,
            project_name: r.projects?.name || "Unknown",
            compliance_status: r.compliance_status,
          }))
        );

        setTeamMembers((members || []) as TeamMember[]);

        // Calculate stats
        const activeProjectCount = projectsWithCounts.filter(p => p.status === "active").length;
        const totalReportsCount = allReports?.length || 0;
        
        let complianceRate = 100;
        if (allReports && allReports.length > 0) {
          const passed = allReports.filter(
            (r) => r.compliance_status === "pass"
          ).length;
          complianceRate = Math.round((passed / allReports.length) * 100);
        }

        // Count approved this month
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);
        const approvedThisMonth = allReports?.filter(r => 
          r.status === "approved" && 
          r.approved_at && 
          new Date(r.approved_at) >= thisMonth
        ).length || 0;

        // Calculate monthly trend
        const monthlyData: { [key: string]: { total: number; passed: number } } = {};
        allReports?.forEach((report) => {
          const month = new Date(report.created_at).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
          if (!monthlyData[month]) {
            monthlyData[month] = { total: 0, passed: 0 };
          }
          monthlyData[month].total++;
          if (report.compliance_status === "pass") {
            monthlyData[month].passed++;
          }
        });

        const trend = Object.entries(monthlyData)
          .map(([month, data]) => ({
            month,
            date: new Date(month),
            rate: data.total > 0 ? Math.round((data.passed / data.total) * 100) : 0,
          }))
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .map(({ month, rate }) => ({ month, rate }));

        setComplianceTrend(trend);

        setStats({
          activeProjects: activeProjectCount,
          pendingApprovals: pendingReports?.length || 0,
          totalReports: totalReportsCount,
          complianceRate,
          approvedThisMonth,
          draftReports: draftReports?.length || 0,
        });
      } catch (error) {
        console.error("Error fetching PM data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile?.user_id, profile?.company_id]);

  const formatRole = (role: string) => {
    return role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "submitted":
        return <Badge variant="default">Submitted</Badge>;
      case "approved":
        return <Badge className="bg-green-600">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/projects")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              My Projects
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              Active assigned projects
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/approvals")}>
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

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/test-reports")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Reports
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              {stats.draftReports} drafts, {stats.approvedThisMonth} approved this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Compliance Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.complianceRate}%</div>
            <p className="text-xs text-muted-foreground">
              Tests passing standards
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Projects Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              My Assigned Projects
            </CardTitle>
            <CardDescription>
              Projects you have access to manage
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/projects")}>
            View All <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {assignedProjects.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No projects assigned to you yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Contact your administrator to get assigned to projects
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {assignedProjects.slice(0, 4).map((project) => (
                <div
                  key={project.id}
                  className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{project.name}</h4>
                      {project.location && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {project.location}
                        </p>
                      )}
                    </div>
                    <Badge variant={project.status === "active" ? "default" : "secondary"}>
                      {project.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {project.report_count} reports
                    </span>
                    {project.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(project.start_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Reports Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Test Reports
            </CardTitle>
            <CardDescription>
              Latest reports from your assigned projects
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/test-reports")}>
            View All <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentReports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No test reports yet</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate("/test-reports")}
              >
                Create First Report
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/test-reports`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{report.report_number}</p>
                      {getStatusBadge(report.status)}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {report.test_type} • {report.project_name}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {new Date(report.test_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Trend */}
      {complianceTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Compliance Rate Trend</CardTitle>
            <CardDescription>
              Monthly compliance rate of tests in your projects
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
      )}

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
              <Badge variant="secondary">{formatRole(profile?.tenant_role || "project_manager")}</Badge>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                {profile?.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {profile.email}
                  </span>
                )}
                {profile?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {profile.phone}
                  </span>
                )}
              </div>
              {profile?.department && (
                <p className="text-sm text-muted-foreground">Department: {profile.department}</p>
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
            Company Team Members
          </CardTitle>
          <CardDescription>
            {teamMembers.length} team members in {profile?.company_name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No team members found</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teamMembers.slice(0, 6).map((member) => (
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
                    {member.email && (
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {member.email}
                      </p>
                    )}
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
