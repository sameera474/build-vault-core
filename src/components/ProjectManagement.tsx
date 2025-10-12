import { useState, useEffect } from "react";
import {
  Plus,
  MapPin,
  Calendar,
  Users,
  FileText,
  MoreHorizontal,
  Edit,
  Trash2,
  Building,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";

interface Project {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  company_id: string;
  created_at: string;
  created_by: string | null;
  _count?: {
    test_reports: number;
  };
  company_name?: string;
}

interface Company {
  id: string;
  name: string;
  is_active: boolean;
}

export function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    start_date: "",
    end_date: "",
    status: "active",
  });

  useEffect(() => {
    fetchProjects();
    if (isSuperAdmin) {
      fetchCompanies();
    }
  }, [profile?.company_id, isSuperAdmin]);

  useEffect(() => {
    fetchProjects();
  }, [selectedCompany, isSuperAdmin]);

  // Add navigation listener to refresh projects when returning to the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchProjects();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Add focus listener to refresh projects when page gains focus
  useEffect(() => {
    const handleFocus = () => fetchProjects();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Refresh projects when component mounts to catch new projects created from other pages
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);

      // If tenant user and profile not loaded yet, avoid querying with undefined company_id
      if (!isSuperAdmin && !profile?.company_id) {
        setLoading(false);
        return;
      }

      if (isSuperAdmin) {
        // Super admins must fetch via Edge Function to bypass tenant RLS safely
        const body =
          selectedCompany && selectedCompany !== "all"
            ? { company_id: selectedCompany }
            : {};
        const { data, error } = await supabase.functions.invoke(
          "admin-list-projects",
          { body }
        );
        if (error) throw error;
        const res = (data as any) || {};
        if (res.error) throw new Error(res.error);
        const projectsData = (res.projects as any[]) || [];

        const projectsWithCounts = projectsData.map((project: any) => ({
          ...project,
          company_name: (project as any).companies?.name || "Unknown Company",
          _count: { test_reports: 0 },
        }));
        setProjects(projectsWithCounts);
      } else {
        // Tenant users fetch only their company's projects (RLS enforced)
        let query = supabase
          .from("projects")
          .select(
            `
            *,
            companies(name)
          `
          )
          .order("created_at", { ascending: false });

        // Only apply filter when company_id is available
        if (profile?.company_id) {
          query = query.eq("company_id", profile.company_id as string);
        }

        const { data: projectsData, error } = await query;
        if (error) throw error;

        const projectsWithCounts = (projectsData || []).map((project: any) => ({
          ...project,
          company_name: (project as any).companies?.name || "Unknown Company",
          _count: { test_reports: 0 },
        }));
        setProjects(projectsWithCounts);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    if (!isSuperAdmin) return;

    try {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, is_active")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      location: "",
      start_date: "",
      end_date: "",
      status: "active",
    });
    setEditingProject(null);
  };

  const handleCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleEdit = (project: Project) => {
    setFormData({
      name: project.name,
      description: project.description || "",
      location: project.location || "",
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      status: project.status,
    });
    setEditingProject(project);
    setIsCreateOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    // Determine company ID
    let companyId = profile?.company_id as string | undefined;
    if (isSuperAdmin && selectedCompany && selectedCompany !== "all") {
      companyId = selectedCompany;
    }

    if (!companyId) {
      toast({
        title: "Error",
        description: "Company must be selected",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const baseData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        location: formData.location.trim() || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        status: formData.status,
        company_id: companyId,
        created_by: profile?.user_id,
      } as any;

      if (editingProject) {
        // Update existing project
        if (isSuperAdmin) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const { error, data } = await supabase.functions.invoke(
            "admin-update-project",
            {
              body: { id: editingProject.id, ...baseData },
              headers: { Authorization: `Bearer ${session?.access_token}` },
            }
          );
          if (error || (data as any)?.error)
            throw error || new Error((data as any)?.error);
        } else {
          const tenantData = { ...baseData, company_id: profile?.company_id };
          const { error } = await supabase
            .from("projects")
            .update(tenantData)
            .eq("id", editingProject.id);
          if (error) throw error;
        }

        toast({
          title: "Project updated",
          description: "Project has been updated successfully.",
        });
      } else {
        // Create new project
        if (isSuperAdmin) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const { error, data } = await supabase.functions.invoke(
            "admin-create-project",
            {
              body: baseData,
              headers: { Authorization: `Bearer ${session?.access_token}` },
            }
          );
          if (error || (data as any)?.error)
            throw error || new Error((data as any)?.error);
        } else {
          const tenantData = { ...baseData, company_id: profile?.company_id };
          const { error } = await supabase
            .from("projects")
            .insert([tenantData]);
          if (error) throw error;
        }

        toast({
          title: "Project created",
          description: "New project has been created successfully.",
        });
      }

      setIsCreateOpen(false);
      resetForm();
      fetchProjects();
    } catch (error: any) {
      console.error("Error saving project:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save project",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      toast({
        title: "Project deleted",
        description: "Project has been deleted successfully.",
      });

      fetchProjects();
    } catch (error: any) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "on-hold":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">
            Manage your construction projects and track testing progress
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isSuperAdmin && (
            <div className="flex items-center gap-2">
              <Label htmlFor="company-filter" className="text-sm font-medium">
                Company:
              </Label>
              <Select
                value={selectedCompany}
                onValueChange={setSelectedCompany}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All companies</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button onClick={() => navigate("/projects/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Edit Project" : "Create New Project"}
            </DialogTitle>
            <DialogDescription>
              {editingProject
                ? "Update the project details below."
                : "Add a new construction project to organize your testing activities."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Project description (optional)"
                  rows={3}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  placeholder="Project location (optional)"
                />
              </div>

              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      start_date: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      end_date: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : editingProject
                  ? "Update Project"
                  : "Create Project"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No projects found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first project to start organizing your construction
              testing activities.
            </p>
            <Button onClick={() => navigate("/projects/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg line-clamp-1">
                      {project.name}
                    </CardTitle>
                    {isSuperAdmin && (
                      <p className="text-sm text-muted-foreground">
                        {project.company_name}
                      </p>
                    )}
                    <Badge className={getStatusColor(project.status)}>
                      {project.status.replace("-", " ")}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => navigate(`/barchart/${project.id}`)}
                      >
                        View Charts
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(project.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="space-y-2">
                  {project.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {project.location}
                    </div>
                  )}

                  {(project.start_date || project.end_date) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {project.start_date &&
                        new Date(project.start_date).toLocaleDateString()}
                      {project.start_date && project.end_date && " - "}
                      {project.end_date &&
                        new Date(project.end_date).toLocaleDateString()}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    {project._count?.test_reports || 0} test reports
                  </div>
                </div>

                {/* Always-visible actions for clarity */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/barchart/${project.id}`)}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Chart
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(project.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
