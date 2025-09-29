import { useState, useEffect } from 'react';
import { Building, Users, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

interface CompanyUser {
  user_id: string;
  name: string;
  role: string;
  tenant_role: string;
  created_at: string;
  is_super_admin?: boolean;
  email?: string;
  phone?: string;
  department?: string;
  job_title?: string;
  is_active?: boolean;
  company_id: string;
  company_name?: string;
}

interface Company {
  id: string;
  name: string;
  is_active: boolean;
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-800',
  project_manager: 'bg-blue-100 text-blue-800',
  quality_manager: 'bg-purple-100 text-purple-800',
  material_engineer: 'bg-green-100 text-green-800',
  technician: 'bg-orange-100 text-orange-800',
  consultant_engineer: 'bg-cyan-100 text-cyan-800',
  consultant_technician: 'bg-teal-100 text-teal-800',
};

export function SuperAdminTeamManagement() {
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { isSuperAdmin } = usePermissions();

  useEffect(() => {
    if (isSuperAdmin) {
      fetchCompanies();
      fetchAllUsers();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAllUsers();
    }
  }, [selectedCompany]);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('profiles')
        .select(`
          user_id, 
          name, 
          role, 
          tenant_role, 
          created_at, 
          is_super_admin, 
          phone, 
          department, 
          company_id,
          job_title,
          is_active,
          companies(name)
        `)
        .order('name');

      if (selectedCompany && selectedCompany !== 'all') {
        query = query.eq('company_id', selectedCompany);
      }

      const { data: users, error } = await query;

      if (error) throw error;

      const formattedUsers = users?.map(user => ({
        ...user,
        company_name: (user as any).companies?.name || 'Unknown Company'
      })) || [];

      setCompanyUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ');
  };

  const getRoleColor = (role: string) => {
    return ROLE_COLORS[role] || 'bg-gray-100 text-gray-800';
  };

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Access Denied
          </CardTitle>
          <CardDescription>
            This section is only available to super administrators.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Company Users Management
        </CardTitle>
        <CardDescription>
          View and manage users across all companies (Super Admin Only)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="company-filter">Filter by Company</Label>
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="All companies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All companies</SelectItem>
              {companies.map(company => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div>
            <h4 className="text-sm font-medium mb-3">
              Users ({companyUsers.length})
            </h4>
            {companyUsers.length > 0 ? (
              <div className="space-y-2">
                {companyUsers.map((user) => (
                  <div key={user.user_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-blue-500" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.name || 'Unknown User'}</p>
                          {!user.is_active && (
                            <Badge variant="outline" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {user.company_name} • {formatRole(user.tenant_role || user.role)}
                        </p>
                        {user.job_title && (
                          <p className="text-xs text-muted-foreground">
                            {user.job_title}
                          </p>
                        )}
                        {user.department && (
                          <p className="text-xs text-muted-foreground">
                            Dept: {user.department}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleColor(user.tenant_role || user.role)}>
                        {formatRole(user.tenant_role || user.role)}
                      </Badge>
                      {user.is_super_admin && (
                        <Badge className="bg-red-100 text-red-800">
                          Super Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No users found for the selected company.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}