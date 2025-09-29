import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, UserPlus, Building, Users, Eye } from 'lucide-react';
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

interface Company {
  id: string;
  name: string;
  is_active: boolean;
}

export function SuperAdminTeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile } = useAuth();
  const { isSuperAdmin } = usePermissions();
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
    if (isSuperAdmin) {
      fetchCompanies();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (selectedCompany) {
      fetchMembers();
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
      
      if (data && data.length > 0 && !selectedCompany) {
        setSelectedCompany(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: "Error",
        description: "Failed to load companies",
        variant: "destructive",
      });
    }
  };

  const fetchMembers = async () => {
    if (!selectedCompany) return;

    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('admin-list-company-users', {
        body: { company_id: selectedCompany },
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });

      if (error) throw error;

      const result = data as any;
      if (result.error) throw new Error(result.error);

      setMembers(result.users || []);
    } catch (error: any) {
      console.error('Error fetching team members:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load team members",
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
    if (!formData.email || !formData.role || !selectedCompany) return;

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('admin-invite-company-user', {
        body: {
          company_id: selectedCompany,
          email: formData.email,
          role: formData.role,
          name: formData.name,
          phone: formData.phone,
          job_title: formData.job_title,
          department: formData.department
        },
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });

      if (error) throw error;

      const result = data as any;
      if (result.error) throw new Error(result.error);

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
    if (!editingMember || !formData.role || !selectedCompany) return;

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

      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('admin-update-company-user', {
        body: {
          company_id: selectedCompany,
          user_id: editingMember.user_id,
          updates
        },
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });

      if (error) throw error;

      const result = data as any;
      if (result.error) throw new Error(result.error);

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

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Super Admin Team Management
        </CardTitle>
        <CardDescription>
          Manage team members across all companies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Company Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-select">Company</Label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a company" />
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
          </div>
          
          {selectedCompany && (
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
                    Send an invitation to join the selected company team.
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

        {/* Members List */}
        {selectedCompany && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No team members found</h3>
                <p className="text-muted-foreground mb-4">
                  This company doesn't have any team members yet.
                </p>
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
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(member)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
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