import { useState } from 'react';
import { Eye, EyeOff, Copy, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DemoUser {
  name: string;
  role: string;
  email: string;
  password: string;
  company: string;
  permissions: string;
}

const demoUsers: DemoUser[] = [
  {
    name: 'John Smith - Project Manager',
    role: 'project_manager',
    email: 'john.manager@alpha.com',
    password: 'DemoPass123!',
    company: 'Alpha Construction Ltd',
    permissions: 'Project & reports',
  },
  {
    name: 'Sarah Johnson - Quality Manager',
    role: 'quality_manager',
    email: 'sarah.quality@alpha.com',
    password: 'DemoPass123!',
    company: 'Alpha Construction Ltd',
    permissions: 'Quality & templates',
  },
  {
    name: 'Mike Davis - Lab Technician',
    role: 'technician',
    email: 'mike.tech@beta.com',
    password: 'DemoPass123!',
    company: 'Alpha Construction Ltd',
    permissions: 'Create reports only',
  },
  {
    name: 'Emily Chen - Admin',
    role: 'admin',
    email: 'emily.admin@beta.com',
    password: 'DemoPass123!',
    company: 'Alpha Construction Ltd',
    permissions: 'Full company access',
  },
  {
    name: 'Robert Wilson - Site Supervisor',
    role: 'supervisor',
    email: 'robert.supervisor@gamma.com',
    password: 'DemoPass123!',
    company: 'Alpha Construction Ltd',
    permissions: 'Team & approvals',
  },
];

export default function SuperAdminDemoUsers() {
  const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set());
  const [creatingUser, setCreatingUser] = useState<string | null>(null);
  const [createdUsers, setCreatedUsers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const togglePasswordVisibility = (email: string) => {
    setRevealedPasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(email)) {
        newSet.delete(email);
      } else {
        newSet.add(email);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const createDemoUser = async (user: DemoUser) => {
    setCreatingUser(user.email);

    try {
      // Call edge function to create user
      const { data, error } = await supabase.functions.invoke('create-demo-user', {
        body: {
          email: user.email,
          password: user.password,
          name: user.name,
          role: user.role,
          company_name: user.company,
        },
      });

      if (error) throw error;

      if (data?.error) {
        if (data.error.includes('already exists') || data.error.includes('already registered')) {
          setCreatedUsers(prev => new Set(prev).add(user.email));
          toast({
            title: 'User already exists',
            description: `${user.name} is already registered`,
            variant: 'default',
          });
        } else {
          throw new Error(data.error);
        }
      } else {
        setCreatedUsers(prev => new Set(prev).add(user.email));
        toast({
          title: 'User created!',
          description: `${user.name} has been created successfully`,
        });
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      setCreatingUser(null);
    }
  };

  const createAllUsers = async () => {
    for (const user of demoUsers) {
      if (!createdUsers.has(user.email)) {
        await createDemoUser(user);
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      project_manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      quality_manager: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      technician: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      supervisor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    };

    const labels: Record<string, string> = {
      project_manager: 'PROJECT MANAGER',
      quality_manager: 'QUALITY MANAGER',
      technician: 'TECHNICIAN',
      admin: 'ADMIN',
      supervisor: 'SUPERVISOR',
    };

    return (
      <Badge className={colors[role] || 'bg-muted'}>
        {labels[role] || role.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Demo User Accounts</CardTitle>
              <CardDescription>
                Pre-configured demo users for testing role-based access
              </CardDescription>
            </div>
            <Button onClick={createAllUsers} variant="outline">
              <UserPlus className="h-4 w-4 mr-2" />
              Create All Users
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name & Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demoUsers.map((user) => (
                  <TableRow key={user.email}>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <span className="font-medium">{user.name}</span>
                        {getRoleBadge(user.role)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{user.email}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(user.email, 'Email')}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {revealedPasswords.has(user.email) ? user.password : '••••••••'}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => togglePasswordVisibility(user.email)}
                          className="h-6 w-6 p-0"
                        >
                          {revealedPasswords.has(user.email) ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(user.password, 'Password')}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.company}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.permissions}
                    </TableCell>
                    <TableCell className="text-right">
                      {createdUsers.has(user.email) ? (
                        <Badge variant="secondary">Already exists</Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => createDemoUser(user)}
                          disabled={creatingUser === user.email}
                        >
                          {creatingUser === user.email ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Create User
                            </>
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
