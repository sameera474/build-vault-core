import { useState, useEffect } from 'react';
import { Plus, Users, Mail, Trash2, UserCheck, Edit, Building, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TeamMember {
  user_id: string;
  name: string;
  role: string;
  tenant_role: string;
  created_at: string;
  is_super_admin?: boolean;
}

interface ProjectAssignment {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  assigned_at: string;
  project_name: string;
  user_name: string;
}

interface Project {
  id: string;
  name: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}

const TENANT_ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full system access' },
  { value: 'project_manager', label: 'Project Manager', description: 'Manages projects and teams' },
  { value: 'quality_manager', label: 'Quality Manager', description: 'Oversees quality control' },
  { value: 'material_engineer', label: 'Material Engineer', description: 'Material testing expert' },
  { value: 'technician', label: 'Technician', description: 'Performs testing work' },
  { value: 'consultant_engineer', label: 'Consultant Engineer', description: 'External engineering consultant' },
  { value: 'consultant_technician', label: 'Consultant Technician', description: 'External technical consultant' },
];

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-800',
  project_manager: 'bg-blue-100 text-blue-800',
  quality_manager: 'bg-purple-100 text-purple-800',
  material_engineer: 'bg-green-100 text-green-800',
  technician: 'bg-orange-100 text-orange-800',
  consultant_engineer: 'bg-cyan-100 text-cyan-800',
  consultant_technician: 'bg-teal-100 text-teal-800',
};

export function TeamManagement() {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('technician');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedRole, setSelectedRole] = useState('technician');
  const [isInviting, setIsInviting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectAssignments, setProjectAssignments] = useState<ProjectAssignment[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchTeamData();
    fetchProjects();
    fetchProjectAssignments();
  }, [profile?.company_id]);

  const fetchTeamData = async () => {
    if (!profile?.company_id) return;

    try {
      // Fetch team members (exclude super admin from display)
      const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('user_id, name, role, tenant_role, created_at, is_super_admin')
        .eq('company_id', profile.company_id);

      if (membersError) throw membersError;

      // Filter out super admin from team display
      const filteredMembers = members?.filter(member => !member.is_super_admin) || [];
      setTeamMembers(filteredMembers);

      // Fetch pending invitations
      const { data: invites, error: invitesError } = await supabase
        .from('team_invitations')
        .select('id, email, role, created_at, expires_at, accepted_at')
        .eq('company_id', profile.company_id)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString());

      if (invitesError) throw invitesError;

      setInvitations(invites || []);
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    if (!profile?.company_id) return;

    try {
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('company_id', profile.company_id)
        .order('name');

      if (error) throw error;
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchProjectAssignments = async () => {
    if (!profile?.company_id) return;

    try {
      const { data: assignments, error } = await supabase
        .from('project_roles')
        .select(`
          id,
          project_id,
          user_id,
          role,
          assigned_at
        `)
        .eq('company_id', profile.company_id);

      if (error) throw error;

      // Get projects and users separately to avoid join issues
      const projectIds = [...new Set(assignments?.map(a => a.project_id))];
      const userIds = [...new Set(assignments?.map(a => a.user_id))];

      const [projectsRes, usersRes] = await Promise.all([
        supabase.from('projects').select('id, name').in('id', projectIds),
        supabase.from('profiles').select('user_id, name').in('user_id', userIds)
      ]);

      const projectsMap = new Map(projectsRes.data?.map(p => [p.id, p.name]) || []);
      const usersMap = new Map(usersRes.data?.map(u => [u.user_id, u.name]) || []);

      const formattedAssignments = assignments?.map(assignment => ({
        id: assignment.id,
        project_id: assignment.project_id,
        user_id: assignment.user_id,
        role: assignment.role,
        assigned_at: assignment.assigned_at,
        project_name: projectsMap.get(assignment.project_id) || 'Unknown Project',
        user_name: usersMap.get(assignment.user_id) || 'Unknown User',
      })) || [];

      setProjectAssignments(formattedAssignments);
    } catch (error) {
      console.error('Error fetching project assignments:', error);
    }
  };

  const sendInvitation = async () => {
    if (!inviteEmail.trim() || !profile?.company_id) return;

    setIsInviting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-team-invitation', {
        body: {
          email: inviteEmail.trim(),
          role: inviteRole,
          company_name: profile.name || 'ConstructTest Pro Team',
          company_id: profile.company_id,
        },
      });

      if (error) throw error;

      if (data?.invitation_url) {
        try {
          await navigator.clipboard.writeText(data.invitation_url);
          toast({
            title: "Invitation sent",
            description: "Invite link copied to clipboard in case the email is delayed.",
          });
        } catch {
          toast({
            title: "Invitation sent",
            description: `If email is delayed, share this link: ${data.invitation_url}`,
          });
        }
      } else {
        toast({
          title: "Invitation sent!",
          description: `An invitation has been sent to ${inviteEmail}`,
        });
      }

      setInviteEmail('');
      setInviteRole('technician');
      setIsInviteOpen(false);
      fetchTeamData();
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Failed to send invitation",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const assignToProject = async () => {
    if (!selectedProject || !selectedMember || !profile?.company_id) return;

    setIsAssigning(true);

    try {
      const { error } = await supabase
        .from('project_roles')
        .insert({
          company_id: profile.company_id,
          project_id: selectedProject,
          user_id: selectedMember,
          role: selectedRole,
          assigned_by: profile.user_id,
        });

      if (error) throw error;

      toast({
        title: "Assignment successful",
        description: "Team member has been assigned to the project.",
      });

      setSelectedProject('');
      setSelectedMember('');
      setSelectedRole('technician');
      setIsAssignOpen(false);
      fetchProjectAssignments();
    } catch (error: any) {
      console.error('Error assigning to project:', error);
      toast({
        title: "Failed to assign",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const removeAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('project_roles')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Assignment removed",
        description: "Team member has been removed from the project.",
      });

      fetchProjectAssignments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: "Invitation cancelled",
        description: "The invitation has been removed.",
      });

      fetchTeamData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatRole = (role: string) => {
    return TENANT_ROLES.find(r => r.value === role)?.label || role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getRoleColor = (role: string) => {
    return ROLE_COLORS[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Management
            </CardTitle>
            <CardDescription>
              Manage team members, roles, and project assignments
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your ConstructTest Pro team with specific role privileges.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Tenant Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TENANT_ROLES.map(role => (
                          <SelectItem key={role.value} value={role.value}>
                            <div className="flex flex-col">
                              <span>{role.label}</span>
                              <span className="text-xs text-muted-foreground">{role.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsInviteOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={sendInvitation}
                      disabled={!inviteEmail.trim() || isInviting}
                    >
                      {isInviting ? 'Sending...' : 'Send Invitation'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Building className="h-4 w-4 mr-2" />
                  Assign to Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign to Project</DialogTitle>
                  <DialogDescription>
                    Assign a team member to a specific project with a defined role.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="project">Project</Label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a project" />
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
                  <div>
                    <Label htmlFor="member">Team Member</Label>
                    <Select value={selectedMember} onValueChange={setSelectedMember}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map(member => (
                          <SelectItem key={member.user_id} value={member.user_id}>
                            {member.name} ({formatRole(member.tenant_role || member.role)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="projectRole">Project Role</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TENANT_ROLES.map(role => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsAssignOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={assignToProject}
                      disabled={!selectedProject || !selectedMember || isAssigning}
                    >
                      {isAssigning ? 'Assigning...' : 'Assign'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Members
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Project Assignments
            </TabsTrigger>
            <TabsTrigger value="invitations" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Pending Invitations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-3">Team Members ({teamMembers.length})</h4>
              {teamMembers.length > 0 ? (
                <div className="space-y-2">
                  {teamMembers.map((member) => (
                    <div key={member.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <UserCheck className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="font-medium">{member.name || 'Unknown User'}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatRole(member.tenant_role || member.role)} • Joined {new Date(member.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge className={getRoleColor(member.tenant_role || member.role)}>
                        {formatRole(member.tenant_role || member.role)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No team members found.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-3">Project Assignments ({projectAssignments.length})</h4>
              {projectAssignments.length > 0 ? (
                <div className="space-y-2">
                  {projectAssignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Building className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="font-medium">{assignment.project_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {assignment.user_name} • {formatRole(assignment.role)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleColor(assignment.role)}>
                          {formatRole(assignment.role)}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeAssignment(assignment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No project assignments found.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="invitations" className="space-y-4">
            {invitations.length > 0 ? (
              <div>
                <h4 className="text-sm font-medium mb-3">Pending Invitations ({invitations.length})</h4>
                <div className="space-y-2">
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg border-yellow-200 bg-yellow-50">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-yellow-600" />
                        <div>
                          <p className="font-medium">{invitation.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Invited {new Date(invitation.created_at).toLocaleDateString()} • 
                            Expires {new Date(invitation.expires_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {formatRole(invitation.role)}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteInvitation(invitation.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No pending invitations.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}