import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { projectService } from '@/services/projectService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Project } from '@/services/projectService';

export default function ProjectEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { isSuperAdmin, userRole } = usePermissions();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && id !== 'new') {
      fetchProject();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchProject = async () => {
    if (!id || id === 'new' || id.startsWith(':')) {
      setLoading(false);
      return;
    }
    
    try {
      const projectData = await projectService.fetchProject(id);
      setProject(projectData);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast({
        title: "Error",
        description: "Failed to load project",
        variant: "destructive",
      });
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (projectData: Partial<Project> & { company_id: string }) => {
    if (isSuperAdmin) {
      toast({
        title: "Read-only",
        description: "Super Admin cannot edit projects",
        variant: "destructive",
      });
      return;
    }

    if (userRole !== 'admin') {
      toast({
        title: "Permission denied",
        description: "Only Company Admins can create/update projects",
        variant: "destructive",
      });
      return;
    }

    console.log('ProjectEdit.handleSave called', { routeId: id, projectData });
    try {
      const isNew = !id || id === 'new';
      const body = { 
        ...projectData, 
        company_id: profile?.company_id || '',
        name: projectData.name || '',
        contract_number: projectData.contract_number || ''
      };
      
      if (isNew) {
        console.log('Creating new project with data:', body);
        const { error } = await supabase.from('projects').insert([body]);
        if (error) throw error;
        toast({
          title: "Success",
          description: "Project created successfully",
        });
        navigate('/projects');
      } else if (project) {
        console.log('Updating project', project.id, 'with data:', body);
        const { error } = await supabase.from('projects').update(body).eq('id', project.id);
        if (error) throw error;
        toast({
          title: "Success", 
          description: "Project updated successfully",
        });
        navigate('/projects');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: "Error",
        description: "Failed to save project",
        variant: "destructive",
      });
    }
  };

  // Redirect super admin away from create route
  if (isSuperAdmin && (!id || id === 'new')) {
    navigate('/projects');
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <ProjectForm
        project={project}
        onSave={handleSave}
        onCancel={() => navigate('/projects')}
        companyName={(project as any)?.companies?.name}
      />
    </div>
  );
}