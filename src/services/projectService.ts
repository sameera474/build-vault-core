
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
      .select('company_id, tenant_role, is_super_admin')
      .eq('user_id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');
    return profile;
  }

  async fetchProjects() {
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

  async createProject(projectData: Partial<Project> & { company_id?: string }) {
    const profile = await this.getProfile();
    const isSuper = (profile as any)?.is_super_admin;

    if (isSuper && projectData.company_id && projectData.company_id !== profile.company_id) {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('admin-create-project', {
        body: projectData,
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) {
        console.error('Error creating project via edge function:', error);
        throw error;
      }
      if (!data?.success) throw new Error((data as any)?.error || 'Failed to create project');
      return (data as any).project as Project;
    } else {
      console.log('Attempting to create project via RPC call for user.');
      const { data, error } = await supabase.rpc('create_new_project', {
        p_name: projectData.name,
        p_contract_number: projectData.contract_number,
        p_contractor_name: projectData.contractor_name,
        p_client_name: projectData.client_name,
        p_consultant_name: projectData.consultant_name,
        p_project_prefix: projectData.project_prefix,
        p_region_code: projectData.region_code,
        p_lab_code: projectData.lab_code,
      });

      if (error) {
        console.error('Error saving project via RPC:', error);
        throw error;
      }
      
      return data as Project;
    }
  }

  async updateProject(id: string, updates: Partial<Project>) {
    const profile = await this.getProfile();
    const isSuper = (profile as any)?.is_super_admin;

    if (isSuper) {
      const { data: { session } } = await supabase.auth.getSession();
      const payload = { id, ...updates } as any;
      const { data, error } = await supabase.functions.invoke('admin-update-project', {
        body: payload,
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to update project');
      return data.project as Project;
    } else {
      const updatesSanitized = { ...updates, company_id: profile.company_id } as any;
      const { data, error } = await supabase
        .from('projects')
        .update(updatesSanitized)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Project;
    }
  }

  async deleteProject(id: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get company_id from the project (needed for super admins who may not have a company_id)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('company_id')
      .eq('id', roadData.project_id)
      .single();

    if (projectError || !project) throw new Error('Project not found');

    const { data, error } = await supabase
      .from('project_roads')
      .insert({
        ...roadData,
        company_id: project.company_id,
        created_by: user.id,
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
