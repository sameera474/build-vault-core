import { useState, useEffect } from 'react';
import { Building, Users, Shield, Edit, Trash2, UserX, UserCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
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
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<CompanyUser | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    role: '',
    tenant_role: '',
    department: '',
    job_title: '',
    company_id: '',
  });
  const { profile } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const { toast } = useToast();

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
          tenant_role, 
          created_at, 
          is_super_admin, 
          phone, 
          department, 
          company_id,
          job_title,
          is_active,
          companies(name),
          user_roles(role)
        `)
        .order('name');

      if (selectedCompany && selectedCompany !== 'all') {
        query = query.eq('company_id', selectedCompany);
      }

      const { data: users, error } = await query;

      if (error) throw error;

      const formattedUsers = users?.map(user => ({
        ...user,
        role: (user as any).user_roles?.[0]?.role || user.tenant_role || 'technician',
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

  const handleEditClick = (user: CompanyUser) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      role: user.role || '',
      tenant_role: user.tenant_role || '',
      department: user.department || '',
      job_title: user.job_title || '',
      company_id: user.company_id || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editForm.name,
          department: editForm.department,
          job_title: editForm.job_title,
          company_id: editForm.company_id,
        })
        .eq('user_id', editingUser.user_id);

      if (error) throw error;

      // Update user_roles if role changed
      if (editForm.role !== editingUser.role) {
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', editingUser.user_id);

        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: editingUser.user_id,
            role: editForm.role as any, // Cast to app_role enum
          });

        if (roleError) {
          console.error('Error updating role:', roleError);
        }
      }

      toast({
        title: "User updated",
        description: `${editForm.name} has been updated successfully.`,
      });

      setEditingUser(null);
      fetchAllUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (user: CompanyUser) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !user.is_active })
        .eq('user_id', user.user_id);

      if (error) throw error;

      toast({
        title: user.is_active ? "User deactivated" : "User activated",
        description: `${user.name} has been ${user.is_active ? 'deactivated' : 'activated'}.`,
      });

      fetchAllUsers();
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      // Delete user roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', deletingUser.user_id);

      // Delete profile
      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', deletingUser.user_id);

      // Delete auth user (requires service role - may fail if using anon key)
      // This will be handled by CASCADE if RLS is properly configured

      toast({
        title: "User deleted",
        description: `${deletingUser.name} has been removed from the system.`,
      });

      setDeletingUser(null);
      fetchAllUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
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
                    <div className="flex items-center gap-3 flex-1">
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
                      
                      {/* Action Buttons */}
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditClick(user)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(user)}
                        >
                          {user.is_active ? (
                            <UserX className="h-3 w-3" />
                          ) : (
                            <UserCheck className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeletingUser(user)}
                          disabled={user.is_super_admin}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
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

        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and role
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="job_title">Job Title</Label>
                <Input
                  id="job_title"
                  value={editForm.job_title}
                  onChange={(e) => setEditForm({ ...editForm, job_title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Select value={editForm.company_id} onValueChange={(value) => setEditForm({ ...editForm, company_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="project_manager">Project Manager</SelectItem>
                    <SelectItem value="quality_manager">Quality Manager</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="technician">Technician</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {deletingUser?.name} from the system. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}