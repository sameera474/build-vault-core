import { supabase } from '@/integrations/supabase/client';
import { MaterialEnum, SideEnum, ReportStatusEnum } from './templateService';

export interface TestReport {
  id: string;
  company_id: string;
  project_id?: string;
  template_id?: string;
  material?: MaterialEnum;
  custom_material?: string;
  test_type?: string;
  standard?: string;
  road_name?: string;
  chainage_from?: string;
  chainage_to?: string;
  side?: SideEnum;
  laboratory_test_no?: string;
  covered_chainage?: string;
  road_offset?: string;
  status: ReportStatusEnum;
  test_date?: string;
  report_number?: string;
  doc_code?: string;
  yymmdd?: string;
  seq?: number;
  gps_latitude?: number;
  gps_longitude?: number;
  weather_conditions?: string;
  site_conditions?: string;
  time_of_test?: string;
  technician_id?: string;
  data_json?: any;
  summary_json?: any;
  graphs_json?: any;
  compliance_status?: string;
  notes?: string;
  file_path?: string;
  technician_name?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  project?: any;
  template?: any;
}

class ReportService {
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

  private async generateReportNumber(companyId: string): Promise<string> {
    // Simple fallback report number generation
    const timestamp = Date.now().toString().slice(-6);
    return `TR-${timestamp}`;
  }

  async fetchReports(filters?: {
    project_id?: string;
    material?: MaterialEnum;
    status?: ReportStatusEnum;
    test_type?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
  }) {
    const profile = await this.getProfile();
    
    let query = supabase
      .from('test_reports')
      .select(`
        *,
        project:projects(name),
        template:test_report_templates(name)
      `)
      .eq('company_id', profile.company_id);

    if (filters?.project_id) {
      query = query.eq('project_id', filters.project_id);
    }
    if (filters?.material) {
      query = query.eq('material', filters.material);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.test_type) {
      query = query.eq('test_type', filters.test_type);
    }
    if (filters?.date_from) {
      query = query.gte('test_date', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('test_date', filters.date_to);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as TestReport[];
  }

  async fetchReport(id: string) {
    const { data, error } = await supabase
      .from('test_reports')
      .select(`
        *,
        project:projects(*),
        template:test_report_templates(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as TestReport;
  }

  async createReport(reportData: Partial<TestReport>) {
    const profile = await this.getProfile();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    // Generate a unique report number
    const reportNumber = await this.generateReportNumber(profile.company_id);

    const newReport = {
      ...reportData,
      report_number: reportNumber,
      company_id: profile.company_id,
      created_by: user.id, // Ensure created_by is set for RLS
      status: 'draft' as ReportStatusEnum,
    };

    const { data, error } = await supabase
      .from('test_reports')
      .insert(newReport as any)
      .select()
      .single();
    
    if (error) throw error;
    return data as TestReport;
  }

  async updateReport(id: string, updates: Partial<TestReport>) {
    const { data, error } = await supabase
      .from('test_reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as TestReport;
  }

  async saveReportData(id: string, data: {
    data_json?: any;
    summary_json?: any;
    graphs_json?: any;
  }) {
    return this.updateReport(id, {
      ...data,
      updated_at: new Date().toISOString(),
    });
  }

  async submitForApproval(id: string) {
    return this.updateReport(id, {
      status: 'submitted',
    });
  }

  async approveReport(id: string) {
    return this.updateReport(id, {
      status: 'approved',
      compliance_status: 'approved',
    });
  }

  async rejectReport(id: string, notes?: string) {
    return this.updateReport(id, {
      status: 'rejected',
      compliance_status: 'rejected',
      notes,
    });
  }

  async deleteReport(id: string) {
    const { error } = await supabase
      .from('test_reports')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Auto-save functionality
  private autoSaveTimeouts = new Map<string, NodeJS.Timeout>();

  scheduleAutoSave(reportId: string, data: any, delay = 10000) {
    // Clear existing timeout
    const existingTimeout = this.autoSaveTimeouts.get(reportId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Schedule new save
    const timeout = setTimeout(() => {
      this.saveReportData(reportId, data).catch(console.error);
      this.autoSaveTimeouts.delete(reportId);
    }, delay);

    this.autoSaveTimeouts.set(reportId, timeout);
  }

  cancelAutoSave(reportId: string) {
    const timeout = this.autoSaveTimeouts.get(reportId);
    if (timeout) {
      clearTimeout(timeout);
      this.autoSaveTimeouts.delete(reportId);
    }
  }
}

export const reportService = new ReportService();