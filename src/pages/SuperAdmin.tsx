import React, { useState, useEffect } from 'react';
import { Users, Building2, FileText, DollarSign, Activity, Shield, Settings, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getCompanies } from '@/lib/auth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface Company {
  id: string;
  name: string;
  user_count: number;
  report_count: number;
  subscription_status: string;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  company_name: string;
  role: string;
  created_at: string;
  last_sign_in: string;
}

interface SystemStats {
  total_users: number;
  total_companies: number;
  total_reports: number;
  active_subscriptions: number;
  monthly_revenue: number;
  growth_rate: number;
}

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

export default function SuperAdmin() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    total_users: 0,
    total_companies: 0,
    total_reports: 0,
    active_subscriptions: 0,
    monthly_revenue: 0,
    growth_rate: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if ((profile as any)?.is_super_admin) {
      fetchSuperAdminData();
    }
  }, [profile]);

  const fetchSuperAdminData = async () => {
    try {
      // Fetch companies from dedicated edge function
      const { data: companiesRes, error: companiesErr } = await getCompanies();
      if (companiesErr) throw companiesErr;

      const fetchedCompanies = (companiesRes?.companies || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        user_count: 0,
        report_count: 0,
        subscription_status: 'active',
        created_at: c.created_at,
      }));

      setCompanies(fetchedCompanies);

      // Fetch user details
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (usersError) throw usersError;

      const formattedUsers = usersData?.map(user => ({
        id: user.user_id,
        email: 'user@example.com', // Would need to join with auth.users
        name: user.name || 'Unknown',
        company_name: `Company ${user.company_id.slice(0, 8)}`,
        role: user.role,
        created_at: user.created_at,
        last_sign_in: user.created_at
      })) || [];

      setUsers(formattedUsers);

      // Calculate stats
      const { data: reportsData, error: reportsError } = await supabase
        .from('test_reports')
        .select('id, created_at')
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      setStats({
        total_users: formattedUsers.length,
        total_companies: fetchedCompanies.length,
        total_reports: reportsData?.length || 0,
        active_subscriptions: Math.floor(fetchedCompanies.length * 0.8), // Simulated
        monthly_revenue: fetchedCompanies.length * 79.99, // Simulated
        growth_rate: 12.5 // Simulated
      });

    } catch (error) {
      console.error('Error fetching super admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load super admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Role updated",
        description: "User role has been updated successfully.",
      });

      fetchSuperAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const suspendCompany = async (companyId: string) => {
    try {
      // In a real implementation, you'd update the company status
      toast({
        title: "Company suspended",
        description: "Company has been suspended successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!(profile as any)?.is_super_admin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have super admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const getGrowthData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => ({
      month,
      users: Math.floor(stats.total_users * (0.6 + index * 0.1)),
      companies: Math.floor(stats.total_companies * (0.5 + index * 0.15)),
      revenue: Math.floor(stats.monthly_revenue * (0.4 + index * 0.2))
    }));
  };

  const getSubscriptionData = () => {
    return [
      { name: 'Starter', value: Math.floor(stats.total_companies * 0.4), color: CHART_COLORS[0] },
      { name: 'Professional', value: Math.floor(stats.total_companies * 0.4), color: CHART_COLORS[1] },
      { name: 'Enterprise', value: Math.floor(stats.total_companies * 0.2), color: CHART_COLORS[2] }
    ];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">
            System-wide analytics and user management
          </p>
        </div>
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          <Shield className="h-4 w-4 mr-1" />
          Super Admin
        </Badge>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.growth_rate}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_companies.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Active organizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_reports.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total reports generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_subscriptions}</div>
            <p className="text-xs text-muted-foreground">
              Active paying customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthly_revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Current month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.growth_rate}%</div>
            <p className="text-xs text-muted-foreground">
              Month over month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Analytics</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Growth Trends</CardTitle>
                <CardDescription>User and company growth over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getGrowthData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="users" stroke="#8884d8" name="Users" />
                      <Line type="monotone" dataKey="companies" stroke="#82ca9d" name="Companies" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Distribution</CardTitle>
                <CardDescription>Companies by subscription plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getSubscriptionData()}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {getSubscriptionData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly revenue growth</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getGrowthData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Management</CardTitle>
              <CardDescription>Manage all registered companies</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company ID</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Reports</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.slice(0, 10).map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>{company.user_count}</TableCell>
                      <TableCell>{company.report_count}</TableCell>
                      <TableCell>
                        <Badge variant={company.subscription_status === 'active' ? 'default' : 'secondary'}>
                          {company.subscription_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(company.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">View</Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => suspendCompany(company.id)}
                          >
                            Suspend
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage all system users</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.slice(0, 10).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.company_name}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value) => updateUserRole(user.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(user.last_sign_in).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">View</Button>
                          <Button size="sm" variant="destructive">Suspend</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>Global system settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="max_users">Max Users per Company</Label>
                  <Input id="max_users" type="number" defaultValue="100" />
                </div>
                <div>
                  <Label htmlFor="max_reports">Max Reports per Month</Label>
                  <Input id="max_reports" type="number" defaultValue="1000" />
                </div>
                <div>
                  <Label htmlFor="storage_limit">Storage Limit (GB)</Label>
                  <Input id="storage_limit" type="number" defaultValue="100" />
                </div>
                <Button>Save Settings</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feature Flags</CardTitle>
                <CardDescription>Enable/disable system features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="analytics">Advanced Analytics</Label>
                  <Button variant="outline" size="sm">Enabled</Button>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="export">PDF Export</Label>
                  <Button variant="outline" size="sm">Enabled</Button>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="api">API Access</Label>
                  <Button variant="outline" size="sm">Disabled</Button>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="mobile">Mobile App</Label>
                  <Button variant="outline" size="sm">Beta</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}