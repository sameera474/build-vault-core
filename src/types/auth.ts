export type UserRole = 'super_admin' | 'company_admin' | 'staff' | 'project_manager' | 'admin';

export interface Profile {
  user_id: string;
  company_id: string;
  name: string | null;
  role: UserRole;
  created_at: string;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: 'company_admin' | 'staff' | 'project_manager';
  assigned_at: string;
  assigned_by?: string;
}