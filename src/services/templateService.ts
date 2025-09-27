import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type MaterialEnum = 'soil' | 'concrete' | 'aggregates' | 'asphalt' | 'custom';
export type SideEnum = 'left' | 'right' | 'middle';
export type ReportStatusEnum = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface TemplateColumn {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date';
  required?: boolean;
  locked?: boolean;
  unit?: string;
  decimals?: number;
  min?: number;
  max?: number;
  options?: string[];
  validation?: string;
}

export interface TemplateSchema {
  columns: TemplateColumn[];
  locked: string[];
  required: string[];
  named_ranges?: { [key: string]: string[] };
}

export interface TemplateRules {
  kpis?: { [key: string]: string };
  thresholds?: { [key: string]: number };
  pass_condition?: string;
  remarks?: string;
}

export interface TestReportTemplate {
  id: string;
  company_id: string;
  name: string;
  material: MaterialEnum;
  custom_material?: string;
  test_type: string;
  standard?: string;
  road_class?: string;
  units: 'SI' | 'Imperial';
  visibility_roles: string[];
  version: number;
  status: 'draft' | 'published';
  schema_json: TemplateSchema;
  rules_json?: TemplateRules;
  preview_json?: any;
  description?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

class TemplateService {
  private async getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('user_id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');
    return profile;
  }

  async fetchTemplates(filters?: {
    material?: MaterialEnum;
    test_type?: string;
    standard?: string;
    road_class?: string;
    units?: string;
    status?: string;
  }) {
    const profile = await this.getProfile();
    
    let query = supabase
      .from('test_report_templates')
      .select('*')
      .eq('company_id', profile.company_id);

    if (filters?.material) {
      query = query.eq('material', filters.material);
    }
    if (filters?.test_type) {
      query = query.eq('test_type', filters.test_type);
    }
    if (filters?.standard) {
      query = query.eq('standard', filters.standard);
    }
    if (filters?.road_class) {
      query = query.eq('road_class', filters.road_class);
    }
    if (filters?.units) {
      query = query.eq('units', filters.units);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as any;
  }

  async saveTemplate(template: Partial<TestReportTemplate>) {
    const profile = await this.getProfile();
    const { data: { user } } = await supabase.auth.getUser();

    const templateData = {
      ...template,
      company_id: profile.company_id,
      created_by: user?.id,
    };

    if (template.id) {
      const { data, error } = await supabase
        .from('test_report_templates')
        .update(templateData)
        .eq('id', template.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('test_report_templates')
        .insert(templateData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  }

  async deleteTemplate(id: string) {
    const { error } = await supabase
      .from('test_report_templates')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async cloneTemplate(id: string, newName: string) {
    const { data: template, error: fetchError } = await supabase
      .from('test_report_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const clonedTemplate = {
      ...template,
      id: undefined,
      name: newName,
      version: 1,
      status: 'draft' as const,
      created_at: undefined,
      updated_at: undefined,
    };

    return this.saveTemplate(clonedTemplate);
  }

  async publishTemplate(id: string) {
    const { data, error } = await supabase
      .from('test_report_templates')
      .update({ status: 'published' })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async unpublishTemplate(id: string) {
    const { data, error } = await supabase
      .from('test_report_templates')
      .update({ status: 'draft' })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Helper method to get example schemas
  getExampleSchemas() {
    return {
      field_density: {
        columns: [
          { id: 'sample_no', label: 'Sample No.', type: 'text' as const, required: true },
          { id: 'wet_density', label: 'Wet Density (g/cc)', type: 'number' as const, decimals: 3, required: true, min: 1.5, max: 2.8 },
          { id: 'dry_density', label: 'Dry Density (g/cc)', type: 'number' as const, decimals: 3, required: true },
          { id: 'moisture_content', label: 'Moisture %', type: 'number' as const, decimals: 2 }
        ],
        locked: ['sample_no'],
        required: ['wet_density', 'dry_density'],
        named_ranges: {
          density_range: ['dry_density']
        }
      } as TemplateSchema,
      proctor: {
        columns: [
          { id: 'point', label: 'Point', type: 'text' as const, required: true },
          { id: 'moisture_content', label: 'Moisture Content (%)', type: 'number' as const, decimals: 2, required: true },
          { id: 'dry_density', label: 'Dry Density (g/cc)', type: 'number' as const, decimals: 3, required: true },
          { id: 'wet_density', label: 'Wet Density (g/cc)', type: 'number' as const, decimals: 3 }
        ],
        locked: ['point'],
        required: ['moisture_content', 'dry_density'],
        named_ranges: {
          density_curve: ['moisture_content', 'dry_density']
        }
      } as TemplateSchema
    };
  }

  getExampleRules() {
    return {
      field_density: {
        kpis: {
          avg_dry_density: 'AVG(dry_density)'
        },
        thresholds: {
          min_avg_dry_density: 1.90
        },
        pass_condition: 'avg_dry_density >= min_avg_dry_density',
        remarks: 'Auto: PASS if avg ≥ threshold'
      } as TemplateRules,
      proctor: {
        kpis: {
          max_dry_density: 'MAX(dry_density)',
          optimum_moisture: 'moisture_content[MAX_INDEX(dry_density)]'
        },
        thresholds: {
          min_max_density: 1.85
        },
        pass_condition: 'max_dry_density >= min_max_density',
        remarks: 'Maximum dry density achieved'
      } as TemplateRules
    };
  }
}

export const templateService = new TemplateService();