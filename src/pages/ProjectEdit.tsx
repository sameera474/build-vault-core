import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { projectService } from '@/services/projectService';
import { toast } from '@/hooks/use-toast';
import type { Project } from '@/services/projectService';

export default function ProjectEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
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
    if (!id || id === 'new') return;
    
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

  const handleSave = async (projectData: Partial<Project>) => {
    try {
      if (id === 'new') {
        const newProject = await projectService.createProject(projectData);
        toast({
          title: "Success",
          description: "Project created successfully",
        });
        navigate(`/projects/${newProject.id}`);
      } else if (project) {
        await projectService.updateProject(project.id, projectData);
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
      />
    </div>
  );
}