import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, Plus, Trash2, Calendar } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface User {
  user_id: string;
  name: string;
  email: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
}

interface Permission {
  id: string;
  user_id: string;
  project_id: string;
  module_name: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_approve: boolean;
  granted_at: string;
  expires_at: string | null;
  notes: string | null;
  user_name: string;
  project_name: string;
}

const MODULES = [
  'test_reports',
  'bug_reports',
  'client_feedback',
  'documents',
  'team_management',
  'project_settings',
];

export default function PermissionManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  
  // Form state
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [canView, setCanView] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canApprove, setCanApprove] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch users from same company
      const { data: usersData } = await supabase
        .from('profiles')
        .select('user_id, name, email, role')
        .eq('company_id', profile?.company_id)
        .neq('user_id', profile?.user_id);

      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .eq('company_id', profile?.company_id);

      // Fetch existing permissions
      const { data: permissionsData } = await supabase
        .from('user_project_permissions')
        .select('*')
        .in('project_id', projectsData?.map(p => p.id) || []);

      // Enrich permissions with user and project names
      const enrichedPermissions = await Promise.all(
        (permissionsData || []).map(async (p) => {
          let userName = 'Unknown';
          let projectName = 'Unknown';

          const { data: userData } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', p.user_id)
            .single();
          userName = userData?.name || 'Unknown';

          const { data: projectData } = await supabase
            .from('projects')
            .select('name')
            .eq('id', p.project_id)
            .single();
          projectName = projectData?.name || 'Unknown';

          return {
            ...p,
            user_name: userName,
            project_name: projectName,
          };
        })
      );

      setUsers(usersData || []);
      setProjects(projectsData || []);
      setPermissions(enrichedPermissions);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGrant = async () => {
    if (!selectedUser || !selectedProject || !selectedModule) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.from('user_project_permissions').insert({
        user_id: selectedUser,
        project_id: selectedProject,
        module_name: selectedModule,
        can_view: canView,
        can_create: canCreate,
        can_edit: canEdit,
        can_delete: canDelete,
        can_approve: canApprove,
        granted_by: profile?.user_id,
        expires_at: expiresAt || null,
        notes: notes || null,
      });

      if (error) throw error;

      // Log audit event
      await supabase.rpc('log_audit_event', {
        _action: 'grant_permission',
        _resource_type: 'permission',
        _details: { user_id: selectedUser, project_id: selectedProject, module_name: selectedModule },
      });

      toast({
        title: 'Success',
        description: 'Permission granted successfully',
      });

      resetForm();
      setOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRevoke = async (permissionId: string) => {
    try {
      const { error } = await supabase
        .from('user_project_permissions')
        .delete()
        .eq('id', permissionId);

      if (error) throw error;

      await supabase.rpc('log_audit_event', {
        _action: 'revoke_permission',
        _resource_type: 'permission',
        _resource_id: permissionId,
      });

      toast({
        title: 'Success',
        description: 'Permission revoked successfully',
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setSelectedUser('');
    setSelectedProject('');
    setSelectedModule('');
    setCanView(false);
    setCanCreate(false);
    setCanEdit(false);
    setCanDelete(false);
    setCanApprove(false);
    setExpiresAt('');
    setNotes('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Permission Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Grant granular module-level permissions to team members for specific projects
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Grant Permission
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Grant Module Permission</DialogTitle>
              <DialogDescription>
                Grant specific module access to a user for a particular project
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="user">User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project">Project</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="module">Module</Label>
                <Select value={selectedModule} onValueChange={setSelectedModule}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODULES.map(module => (
                      <SelectItem key={module} value={module}>
                        {module.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3">
                <Label>Permissions</Label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox checked={canView} onCheckedChange={(checked) => setCanView(!!checked)} />
                    <label className="text-sm">View</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox checked={canCreate} onCheckedChange={(checked) => setCanCreate(!!checked)} />
                    <label className="text-sm">Create</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox checked={canEdit} onCheckedChange={(checked) => setCanEdit(!!checked)} />
                    <label className="text-sm">Edit</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox checked={canDelete} onCheckedChange={(checked) => setCanDelete(!!checked)} />
                    <label className="text-sm">Delete</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox checked={canApprove} onCheckedChange={(checked) => setCanApprove(!!checked)} />
                    <label className="text-sm">Approve</label>
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expires">Expires At (Optional)</Label>
                <Input
                  id="expires"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this permission grant..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGrant}>Grant Permission</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Permissions</CardTitle>
          <CardDescription>
            View and manage all granted permissions for your company
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No permissions granted yet
                  </TableCell>
                </TableRow>
              ) : (
                permissions.map(permission => (
                  <TableRow key={permission.id}>
                    <TableCell className="font-medium">{permission.user_name}</TableCell>
                    <TableCell>{permission.project_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {permission.module_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {permission.can_view && <Badge variant="secondary">View</Badge>}
                        {permission.can_create && <Badge variant="secondary">Create</Badge>}
                        {permission.can_edit && <Badge variant="secondary">Edit</Badge>}
                        {permission.can_delete && <Badge variant="secondary">Delete</Badge>}
                        {permission.can_approve && <Badge variant="secondary">Approve</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {permission.expires_at ? (
                        <span className="text-sm flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(permission.expires_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevoke(permission.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
