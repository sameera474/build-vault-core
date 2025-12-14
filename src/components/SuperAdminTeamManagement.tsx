import { useState, useEffect } from 'react';
import { Building, Users, Shield, Edit, Trash2, UserX, UserCheck, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  project_manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  quality_manager: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  material_engineer: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  technician: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  consultant_engineer: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  consultant_technician: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
};

export function SuperAdminTeamManagement() {
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [superAdmins, setSuperAdmins] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<CompanyUser | null>(null);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
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

      if (error) {
        console.error('Error fetching companies:', error);
        return;
      }
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, get all users
      let userQuery = supabase
        .from('profiles')
        .select('user_id, name, tenant_role, created_at, is_super_admin, phone, department, company_id')
        .order('name');

      if (selectedCompany && selectedCompany !== 'all') {
        userQuery = userQuery.eq('company_id', selectedCompany);
      }

      const { data: users, error: usersError } = await userQuery;

      if (usersError) {
        console.error('Error fetching users:', usersError);
        setError('Failed to fetch users. Please try again.');
        setCompanyUsers([]);
        setLoading(false);
        return;
      }

      if (!users || users.length === 0) {
        setCompanyUsers([]);
        setLoading(false);
        return;
      }

      // Fetch user roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const rolesMap = new Map(userRoles?.map(ur => [ur.user_id, ur.role]) || []);

      // Fetch company names separately
      const companyIds = [...new Set(users.map(u => u.company_id).filter(Boolean))];
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, name')
        .in('id', companyIds);

      const companiesMap = new Map(companiesData?.map(c => [c.id, c.name]) || []);

      // Separate super admins from regular users
      const allFormattedUsers = (users as any[]).map(user => ({
        ...user,
        role: rolesMap.get(user.user_id) || user.tenant_role || 'technician',
        company_name: companiesMap.get(user.company_id) || 'Unknown Company',
      }));

      // Filter super admins into separate list
      const superAdminUsers = allFormattedUsers.filter(user => user.is_super_admin);
      const regularUsers = allFormattedUsers.filter(user => !user.is_super_admin);

      setSuperAdmins(superAdminUsers);
      setCompanyUsers(regularUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('An unexpected error occurred. Please try again.');
      setCompanyUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const formatRole = (role: string) => {
    if (!role) return 'Unknown';
    return role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ');
  };

  const getRoleColor = (role: string) => {
    return ROLE_COLORS[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
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
          tenant_role: editForm.tenant_role as any,
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
            role: editForm.role as any,
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
        .update({ tenant_role: user.is_super_admin ? 'technician' : user.tenant_role })
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
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', deletingUser.user_id);

      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', deletingUser.user_id);

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

  const groupedByCompany = companyUsers.reduce((acc, user) => {
    const companyId = user.company_id || 'unknown';
    const companyName = user.company_name || 'Unknown Company';
    
    if (!acc[companyId]) {
      acc[companyId] = {
        companyId,
        companyName,
        users: []
      };
    }
    
    acc[companyId].users.push(user);
    return acc;
  }, {} as Record<string, { companyId: string; companyName: string; users: CompanyUser[] }>);

  const companyGroups = Object.values(groupedByCompany).sort((a, b) => 
    a.companyName.localeCompare(b.companyName)
  );

  const toggleCompany = (companyId: string) => {
    setExpandedCompanies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(companyId)) {
        newSet.delete(companyId);
      } else {
        newSet.add(companyId);
      }
      return newSet;
    });
  };

  return (
    <Card className="animate-fade-in">
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

        {error && (
          <div className="flex items-center gap-2 p-4 text-sm text-red-800 bg-red-50 dark:bg-red-900/20 dark:text-red-200 rounded-lg border border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchAllUsers}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Loading users...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Super Admins Section */}
            {superAdmins.length > 0 && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Super Admins</CardTitle>
                    <Badge variant="secondary" className="ml-auto">
                      {superAdmins.length}
                    </Badge>
                  </div>
                  <CardDescription>
                    Website owners - Cannot be deleted
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {superAdmins.map((user) => (
                    <div key={user.user_id} className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium truncate">{user.name || 'Unknown User'}</p>
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                              Super Admin
                            </Badge>
                          </div>
                          {user.department && (
                            <p className="text-xs text-muted-foreground truncate">
                              Dept: {user.department}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(user);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={true}
                          title="Super admin accounts cannot be deleted"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Company Users Section */}
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                {companyGroups.length} {companyGroups.length === 1 ? 'Company' : 'Companies'} • {companyUsers.length} Total Users
              </h4>
              {companyGroups.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (expandedCompanies.size === companyGroups.length) {
                      setExpandedCompanies(new Set());
                    } else {
                      setExpandedCompanies(new Set(companyGroups.map(g => g.companyId)));
                    }
                  }}
                >
                  {expandedCompanies.size === companyGroups.length ? 'Collapse All' : 'Expand All'}
                </Button>
              )}
            </div>

            {companyGroups.length > 0 ? (
              <div className="space-y-3">
                {companyGroups.map((group) => (
                  <Collapsible
                    key={group.companyId}
                    open={expandedCompanies.has(group.companyId)}
                    onOpenChange={() => toggleCompany(group.companyId)}
                  >
                    <Card className="overflow-hidden">
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <Building className="h-5 w-5 text-primary" />
                            <div className="text-left">
                              <h5 className="font-semibold">{group.companyName}</h5>
                              <p className="text-sm text-muted-foreground">
                                {group.users.length} {group.users.length === 1 ? 'User' : 'Users'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-sm">
                              {group.users.length}
                            </Badge>
                            {expandedCompanies.has(group.companyId) ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="border-t">
                          <div className="p-4 space-y-2">
                            {group.users.map((user) => (
                              <div key={user.user_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-medium truncate">{user.name || 'Unknown User'}</p>
                                      {!user.is_active && (
                                        <Badge variant="outline" className="text-xs">Inactive</Badge>
                                      )}
                                      {user.is_super_admin && (
                                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs">
                                          Super Admin
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {formatRole(user.tenant_role || user.role)}
                                    </p>
                                    {user.job_title && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        {user.job_title}
                                      </p>
                                    )}
                                    {user.department && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        Dept: {user.department}
                                      </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                      Joined {new Date(user.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Badge className={getRoleColor(user.tenant_role || user.role)}>
                                    {formatRole(user.tenant_role || user.role)}
                                  </Badge>
                                  
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditClick(user);
                                      }}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleActive(user);
                                      }}
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
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletingUser(user);
                                      }}
                                      disabled={user.is_super_admin}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No users found for the selected company.</p>
              </div>
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
                <Label htmlFor="tenant_role">Designation</Label>
                <Select value={editForm.tenant_role} onValueChange={(value) => setEditForm({ ...editForm, tenant_role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technician">Technician</SelectItem>
                    <SelectItem value="project_manager">Project Manager</SelectItem>
                    <SelectItem value="quality_manager">Quality Manager</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="material_engineer">Material Engineer</SelectItem>
                    <SelectItem value="consultant_engineer">Consultant Engineer</SelectItem>
                    <SelectItem value="consultant_technician">Consultant Technician</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="role">App Role (RBAC)</Label>
                <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="client_admin">Client Admin</SelectItem>
                    <SelectItem value="project_manager">Project Manager</SelectItem>
                    <SelectItem value="quality_manager">Quality Manager</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="consultant_engineer">Consultant Engineer</SelectItem>
                    <SelectItem value="consultant_technician">Consultant Technician</SelectItem>
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
