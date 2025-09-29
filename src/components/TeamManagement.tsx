import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, UserPlus, Mail, Phone, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

interface TeamMember {
  user_id: string;
  company_id: string;
  role: string;
  name: string;
  phone?: string;
  department?: string;
  job_title?: string;
  employee_id?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

export function TeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile } = useAuth();
  const { userRole } = usePermissions();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: '',
    phone: '',
    job_title: '',
    department: '',
    is_active: true
  });

  const tenantRoles = [
    { value: 'admin', label: 'Company Admin' },
    { value: 'project_manager', label: 'Project Manager' },
    { value: 'quality_manager', label: 'Quality Manager' },
    { value: 'material_engineer', label: 'Material Engineer' },
    { value: 'technician', label: 'Technician' },
    { value: 'consultant_engineer', label: 'Consultant Engineer' },
    { value: 'consultant_technician', label: 'Consultant Technician' }
  ];

  useEffect(() => {
    fetchMembers();
  }, [profile?.company_id]);

  const fetchMembers = async () => {
    if (!profile?.company_id) return;

    try {
      setLoading(true);
      
      // Fetch all profiles from the same company
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          company_id,
          role,
          name,
          phone,
          department,
          job_title,
          employee_id,
          avatar_url,
          is_active,
          created_at
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast({
        title: "Error",
        description: "Failed to load team members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      role: '',
      phone: '',
      job_title: '',
      department: '',
      is_active: true
    });
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.role || !profile?.company_id) return;

    // Only admin can invite users
    if (userRole !== 'admin') {
      toast({
        title: "Permission denied",
        description: "Only Company Admins can invite team members",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create auth user with magic link flow
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        email_confirm: false,
        user_metadata: { name: formData.name || formData.email }
      });

      if (authError) throw authError;

      if (!authUser.user) {
        throw new Error('Failed to create user');
      }

      // Create profile
      const profileData = {
        user_id: authUser.user.id,
        company_id: profile.company_id,
        role: formData.role,
        name: formData.name || formData.email,
        phone: formData.phone || null,
        job_title: formData.job_title || null,
        department: formData.department || null,
        is_active: true
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData);

      if (profileError) {
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authUser.user.id);
        throw profileError;
      }

      toast({
        title: "User invited",
        description: "Team member has been invited successfully",
      });

      setIsInviteOpen(false);
      resetForm();
      fetchMembers();
    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to invite user",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      email: '',
      name: member.name || '',
      role: member.role,
      phone: member.phone || '',
      job_title: member.job_title || '',
      department: member.department || '',
      is_active: member.is_active
    });
    setIsEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !formData.role) return;

    // Only admin can edit users
    if (userRole !== 'admin') {
      toast({
        title: "Permission denied",
        description: "Only Company Admins can edit team members",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const updates = {
        role: formData.role,
        name: formData.name || editingMember.name,
        phone: formData.phone || null,
        job_title: formData.job_title || null,
        department: formData.department || null,
        is_active: formData.is_active
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', editingMember.user_id);

      if (error) throw error;

      toast({
        title: "User updated",
        description: "Team member has been updated successfully",
      });

      setIsEditOpen(false);
      setEditingMember(null);
      resetForm();
      fetchMembers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (userRole !== 'admin') {
      toast({
        title: "Permission denied",
        description: "Only Company Admins can delete team members",
        variant: "destructive",
      });
      return;
    }

    if (confirm('Are you sure you want to delete this team member?')) {
      try {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('user_id', userId);

        if (error) throw error;

        toast({
          title: "User deleted",
          description: "Team member has been deleted successfully",
        });

        fetchMembers();
      } catch (error: any) {
        console.error('Error deleting user:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to delete user",
          variant: "destructive",
        });
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'project_manager':
        return 'bg-blue-100 text-blue-800';
      case 'quality_manager':
        return 'bg-purple-100 text-purple-800';
      case 'material_engineer':
        return 'bg-green-100 text-green-800';
      case 'technician':
        return 'bg-gray-100 text-gray-800';
      case 'consultant_engineer':
        return 'bg-orange-100 text-orange-800';
      case 'consultant_technician':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Company Team Members
            </CardTitle>
            <CardDescription>
              Manage your company team members and their roles
            </CardDescription>
          </div>
          {userRole === 'admin' && (
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your team. They'll receive a magic link to set up their account.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="user@company.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="John Smith"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Role *</Label>
                      <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {tenantRoles.map(role => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+27 82 123 4567"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="job_title">Job Title</Label>
                      <Input
                        id="job_title"
                        value={formData.job_title}
                        onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                        placeholder="Senior Engineer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                        placeholder="Engineering"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsInviteOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Inviting...' : 'Send Invitation'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="text-center py-8">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No team members found</h3>
            <p className="text-muted-foreground mb-4">
              Start building your team by inviting members.
            </p>
            {userRole === 'admin' && (
              <Button onClick={() => setIsInviteOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite First Member
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              Team Members ({members.length})
            </h3>
            <div className="grid gap-4">
              {members.map((member) => (
                <Card key={member.user_id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback>
                          {member.name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{member.name || 'Unnamed User'}</h4>
                        <div className="flex items-center gap-2">
                          <Badge className={getRoleColor(member.role)}>
                            {tenantRoles.find(r => r.value === member.role)?.label || member.role}
                          </Badge>
                          {!member.is_active && (
                            <Badge variant="outline" className="text-red-600 border-red-600">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        {(member.job_title || member.department) && (
                          <p className="text-sm text-muted-foreground">
                            {[member.job_title, member.department].filter(Boolean).join(' • ')}
                          </p>
                        )}
                        {member.phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {member.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {userRole === 'admin' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(member)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(member.user_id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
              <DialogDescription>
                Update team member information and role.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role *</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenantRoles.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+27 82 123 4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-job_title">Job Title</Label>
                  <Input
                    id="edit-job_title"
                    value={formData.job_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                    placeholder="Senior Engineer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-department">Department</Label>
                <Input
                  id="edit-department"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="Engineering"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="edit-is_active" className="text-sm">
                  Active user
                </Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update Member'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}