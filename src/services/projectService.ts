import { supabase } from '@/integrations/supabase/client';

export interface Project {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  contract_number?: string;
  contractor_name?: string;
  contractor_logo?: string;
  client_name?: string;
  client_logo?: string;
  consultant_name?: string;
  consultant_logo?: string;
  project_prefix: string;
  region_code: string;
  lab_code: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ProjectRoad {
  id: string;
  company_id: string;
  project_id: string;
  name: string;
  created_by?: string;
  created_at: string;
}

class ProjectService {
  private async getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role, tenant_role')
      .eq('user_id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');
    return profile;
  }

  async fetchProjects() {
    // RLS will automatically filter by user's company
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Project[];
  }

  async fetchAllCompanies() {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data;
  }

  async fetchProject(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Project;
  }

  async createProject(projectData: Partial<Project> & { company_id: string }) {
    const profile = await this.getProfile();
    const { data: { user } } = await supabase.auth.getUser();

    // Check if user is super admin and creating for different company
    const isSuper = (profile as any)?.is_super_admin;
    const isDifferentCompany = projectData.company_id !== profile.company_id;

    if (isSuper && isDifferentCompany) {
      // Use Edge Function for super admin cross-company operations
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('admin-create-project', {
        body: projectData,
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to create project');
      return data.project as Project;
    } else {
      // Regular tenant insert (or super admin for their own company)
      const newProject = {
        ...projectData,
        company_id: profile.company_id, // Always use user's company for regular flow
        created_by: user?.id,
        status: 'active',
      };

      console.log('ProjectService.createProject payload', newProject);

      const { data, error } = await supabase
        .from('projects')
        .insert(newProject as any)
        .select()
        .single();
      
      if (error) throw error;
      return data as Project;
    }
  }

  async updateProject(id: string, updates: Partial<Project>) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Project;
  }

  async deleteProject(id: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Project Roads Management
  async fetchProjectRoads(projectId: string) {
    const { data, error } = await supabase
      .from('project_roads')
      .select('*')
      .eq('project_id', projectId)
      .order('name');
    
    if (error) throw error;
    return data as ProjectRoad[];
  }

  async createProjectRoad(roadData: { project_id: string; name: string }) {
    const profile = await this.getProfile();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('project_roads')
      .insert({
        ...roadData,
        company_id: profile.company_id,
        created_by: user?.id,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as ProjectRoad;
  }

  async deleteProjectRoad(id: string) {
    const { error } = await supabase
      .from('project_roads')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Upload logo files
  async uploadLogo(file: File, type: 'contractor' | 'client' | 'consultant'): Promise<string> {
    const profile = await this.getProfile();
    const fileName = `${profile.company_id}/${type}/${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('logos')
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('logos')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }
}

export const projectService = new ProjectService();