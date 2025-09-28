import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, Mail, Key, Eye, EyeOff, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DemoUser {
  email: string;
  password: string;
  name: string;
  role: string;
  tenant_role: string;
  company_name: string;
}

interface RolePermission {
  id: string;
  role: string;
  permission: string;
  created_at: string;
}

const DEMO_USERS: DemoUser[] = [
  {
    email: 'john.manager@alpha.com',
    password: 'DemoPass123!',
    name: 'John Smith - Project Manager',
    role: 'project_manager',
    tenant_role: 'project_manager',
    company_name: 'Alpha Construction Ltd'
  },
  {
    email: 'sarah.quality@alpha.com',
    password: 'DemoPass123!',
    name: 'Sarah Johnson - Quality Manager',
    role: 'quality_manager',
    tenant_role: 'quality_manager',
    company_name: 'Alpha Construction Ltd'
  },
  {
    email: 'mike.tech@beta.com',
    password: 'DemoPass123!',
    name: 'Mike Davis - Lab Technician',
    role: 'technician',
    tenant_role: 'technician',
    company_name: 'Beta Engineering Corp'
  },
  {
    email: 'emily.admin@beta.com',
    password: 'DemoPass123!',
    name: 'Emily Chen - Admin',
    role: 'admin',
    tenant_role: 'project_manager',
    company_name: 'Beta Engineering Corp'
  },
  {
    email: 'robert.supervisor@gamma.com',
    password: 'DemoPass123!',
    name: 'Robert Wilson - Site Supervisor',
    role: 'supervisor',
    tenant_role: 'technician',
    company_name: 'Gamma Materials Inc'
  }
];

export default function DemoUsers() {
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});
  const [creating, setCreating] = useState<{[key: string]: boolean}>({});
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRolePermissions();
  }, []);

  const fetchRolePermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .order('role', { ascending: true })
        .order('permission', { ascending: true });

      if (error) throw error;
      setRolePermissions(data || []);
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      toast({
        title: "Error",
        description: "Failed to load role permissions",
        variant: "destructive",
      });
    } finally {
      setLoadingPermissions(false);
    }
  };

  const togglePasswordVisibility = (email: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [email]: !prev[email]
    }));
  };

  const createDemoUser = async (user: DemoUser) => {
    setCreating(prev => ({ ...prev, [user.email]: true }));
    
    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            name: user.name,
            company_name: user.company_name
          }
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Demo user created",
        description: `${user.name} has been created successfully`,
      });

    } catch (error: any) {
      console.error('Error creating demo user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create demo user",
        variant: "destructive",
      });
    } finally {
      setCreating(prev => ({ ...prev, [user.email]: false }));
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'project_manager':
        return 'bg-blue-100 text-blue-800';
      case 'quality_manager':
        return 'bg-green-100 text-green-800';
      case 'supervisor':
        return 'bg-yellow-100 text-yellow-800';
      case 'technician':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Demo Users</h1>
          <p className="text-muted-foreground">
            Create demo users for testing role-based access control
          </p>
        </div>
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          <Shield className="h-4 w-4 mr-1" />
          Demo Environment
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Demo User Accounts</CardTitle>
          <CardDescription>
            Pre-configured user accounts with different roles and permissions for testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name & Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEMO_USERS.map((user) => (
                <TableRow key={user.email}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <Badge 
                        variant="secondary" 
                        className={`mt-1 ${getRoleBadgeColor(user.role)}`}
                      >
                        {user.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {user.email}
                      </code>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {showPasswords[user.email] ? user.password : '••••••••••••'}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => togglePasswordVisibility(user.email)}
                      >
                        {showPasswords[user.email] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{user.company_name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {user.role === 'admin' && 'Full company access'}
                      {user.role === 'project_manager' && 'Project & reports'}
                      {user.role === 'quality_manager' && 'Quality & templates'}
                      {user.role === 'supervisor' && 'Team & approvals'}
                      {user.role === 'technician' && 'Create reports only'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => createDemoUser(user)}
                      disabled={creating[user.email]}
                    >
                      {creating[user.email] ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Create User
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Permissions Overview</CardTitle>
          <CardDescription>
            Understanding what each role can access in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Super Admin</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <div>✓ View all companies</div>
                <div>✓ Manage all users</div>
                <div>✓ System analytics</div>
                <div>✓ System settings</div>
                <div>✓ All permissions</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Admin</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <div>✓ Manage company users</div>
                <div>✓ View company reports</div>
                <div>✓ Manage projects</div>
                <div>✓ View analytics</div>
                <div>✓ Export data</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Project Manager</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <div>✓ View company reports</div>
                <div>✓ Manage projects</div>
                <div>✓ View analytics</div>
                <div>✓ Approve reports</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Quality Manager</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <div>✓ View company reports</div>
                <div>✓ Approve reports</div>
                <div>✓ Manage templates</div>
                <div>✓ View analytics</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Supervisor</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <div>✓ View company reports</div>
                <div>✓ Approve reports</div>
                <div>✓ Manage team reports</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Technician</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <div>✓ Create reports</div>
                <div>✓ View own reports</div>
                <div>✓ Edit own reports</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Role Permissions
          </CardTitle>
          <CardDescription>
            Current role permissions stored in the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPermissions ? (
            <div className="flex items-center justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Permission</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rolePermissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={`${getRoleBadgeColor(permission.role)}`}
                      >
                        {permission.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {permission.permission}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground">
                        {permission.id.substring(0, 8)}...
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(permission.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}