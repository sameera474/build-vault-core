import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Users, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface ProjectRole {
  id: string;
  user_id: string;
  role: string;
  assigned_at: string;
  profiles?: {
    name: string;
  };
}

interface TeamMember {
  user_id: string;
  name: string;
  role: string;
}

const ROLE_OPTIONS = [
  { value: 'project_manager', label: 'Project Manager', color: 'bg-blue-100 text-blue-800' },
  { value: 'quality_manager', label: 'Quality Manager', color: 'bg-purple-100 text-purple-800' },
  { value: 'materials_engineer', label: 'Materials Engineer', color: 'bg-green-100 text-green-800' },
  { value: 'technician', label: 'Technician', color: 'bg-orange-100 text-orange-800' },
  { value: 'consultant', label: 'Consultant', color: 'bg-gray-100 text-gray-800' },
];

interface ProjectRolesProps {
  projectId: string;
}

export function ProjectRoles({ projectId }: ProjectRolesProps) {
  const [roles, setRoles] = useState<ProjectRole[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    fetchRoles();
    fetchTeamMembers();
  }, [projectId]);

  const fetchRoles = async () => {
    if (!profile?.company_id) return;

    try {
      // First get the project members
      const { data: rolesData, error } = await supabase
        .from('project_members')
        .select('project_id, user_id, role, assigned_at')
        .eq('project_id', projectId)
        .order('assigned_at', { ascending: false });

      if (error) throw error;

      // Then get the profile names for these users
      if (rolesData && rolesData.length > 0) {
        const userIds = rolesData.map(role => role.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', userIds);

        // Combine the data and create composite IDs
        const rolesWithProfiles = rolesData.map(role => ({
          id: `${role.project_id}-${role.user_id}`,
          user_id: role.user_id,
          role: role.role,
          assigned_at: role.assigned_at,
          profiles: profilesData?.find(p => p.user_id === role.user_id) || { name: 'Unknown User' }
        }));

        setRoles(rolesWithProfiles);
      } else {
        setRoles([]);
      }
    } catch (error) {
      console.error('Error fetching project roles:', error);
      toast({
        title: "Error",
        description: "Failed to load project roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, tenant_role, is_super_admin')
        .eq('company_id', profile.company_id)
        .eq('is_super_admin', false); // Exclude super admins from team dropdown

      if (error) throw error;
      setTeamMembers((data || []).map(d => ({ ...d, role: d.tenant_role })) as TeamMember[]);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole || !profile?.company_id) return;

    setAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          user_id: selectedUser,
          role: selectedRole,
          assigned_by: user?.id,
        });

      if (error) throw error;

      await fetchRoles();
      setSelectedUser('');
      setSelectedRole('');
      
      toast({
        title: "Success",
        description: "Role assigned successfully",
      });
    } catch (error: any) {
      console.error('Error assigning role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign role",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    try {
      // Parse the composite ID (format: "projectId-userId")
      const [projectId, userId] = roleId.split('-');
      
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (error) throw error;

      setRoles(prev => prev.filter(role => role.id !== roleId));
      
      toast({
        title: "Success",
        description: "Role removed successfully",
      });
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: "Error",
        description: "Failed to remove role",
        variant: "destructive",
      });
    }
  };

  const getRoleColor = (roleValue: string) => {
    return ROLE_OPTIONS.find(option => option.value === roleValue)?.color || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (roleValue: string) => {
    return ROLE_OPTIONS.find(option => option.value === roleValue)?.label || roleValue;
  };

  const availableUsers = teamMembers.filter(member => 
    !roles.some(role => role.user_id === member.user_id && role.role === selectedRole)
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading team assignments...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Assignments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assign New Role */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user">Team Member</Label>
            <Select 
              value={selectedUser} 
              onValueChange={setSelectedUser}
              disabled={!selectedRole}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map(member => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    {member.name || 'Unnamed User'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button 
              onClick={handleAssignRole} 
              disabled={!selectedUser || !selectedRole || adding}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {adding ? 'Assigning...' : 'Assign Role'}
            </Button>
          </div>
        </div>

        {/* Current Assignments */}
        {roles.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-semibold mb-2">No team assignments</h4>
            <p className="text-muted-foreground">
              Assign team members to roles for this project.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="font-semibold">
              Current Assignments ({roles.length})
            </h4>
            <div className="grid gap-3">
              {ROLE_OPTIONS.map(roleOption => {
                const roleAssignments = roles.filter(role => role.role === roleOption.value);
                if (roleAssignments.length === 0) return null;

                return (
                  <div key={roleOption.value} className="space-y-2">
                    <h5 className="font-medium text-sm flex items-center gap-2">
                      <Badge className={roleOption.color}>
                        {roleOption.label}
                      </Badge>
                      <span className="text-muted-foreground">
                        ({roleAssignments.length})
                      </span>
                    </h5>
                    <div className="grid gap-2 ml-4">
                      {roleAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {assignment.profiles?.name?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">
                                {assignment.profiles?.name || 'Unknown User'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Assigned {new Date(assignment.assigned_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRole(assignment.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}