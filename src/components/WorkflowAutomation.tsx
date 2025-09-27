import { useState, useEffect } from 'react';
import { Bell, Clock, CheckCircle, AlertTriangle, Mail, Calendar, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  type: 'deadline' | 'approval' | 'compliance' | 'team';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  created_at: string;
  action_url?: string;
}

interface WorkflowSettings {
  email_notifications: boolean;
  deadline_reminders: boolean;
  approval_notifications: boolean;
  compliance_alerts: boolean;
  reminder_days: number;
}

export function WorkflowAutomation() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<WorkflowSettings>({
    email_notifications: true,
    deadline_reminders: true,
    approval_notifications: true,
    compliance_alerts: true,
    reminder_days: 7
  });
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
    fetchSettings();
    
    // Set up real-time notifications
    const channel = supabase
      .channel('workflow-notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'test_reports'
      }, (payload) => {
        handleRealTimeUpdate(payload);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [profile?.company_id]);

  const fetchNotifications = async () => {
    if (!profile?.company_id) return;

    try {
      // Simulate notifications based on current data
      const { data: reports } = await supabase
        .from('test_reports')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('company_id', profile.company_id);

      // Generate workflow notifications
      const generatedNotifications: Notification[] = [];

      // Pending approvals
      const pendingReports = reports?.filter(r => r.compliance_status === 'pending') || [];
      if (pendingReports.length > 0) {
        generatedNotifications.push({
          id: 'pending-approvals',
          type: 'approval',
          title: 'Pending Approvals',
          message: `${pendingReports.length} test reports awaiting approval`,
          priority: pendingReports.length > 5 ? 'high' : 'medium',
          read: false,
          created_at: new Date().toISOString(),
          action_url: '/approvals'
        });
      }

      // Compliance alerts
      const failedReports = reports?.filter(r => r.compliance_status === 'fail') || [];
      if (failedReports.length > 0) {
        generatedNotifications.push({
          id: 'compliance-alerts',
          type: 'compliance',
          title: 'Compliance Issues',
          message: `${failedReports.length} reports with compliance failures`,
          priority: 'high',
          read: false,
          created_at: new Date().toISOString(),
          action_url: '/test-reports'
        });
      }

      // Project deadlines
      const overdueProjects = projects?.filter(p => {
        if (!p.end_date || p.status !== 'active') return false;
        return new Date(p.end_date) < new Date();
      }) || [];

      if (overdueProjects.length > 0) {
        generatedNotifications.push({
          id: 'project-deadlines',
          type: 'deadline',
          title: 'Project Deadlines',
          message: `${overdueProjects.length} projects are overdue`,
          priority: 'high',
          read: false,
          created_at: new Date().toISOString(),
          action_url: '/projects'
        });
      }

      // Recent activity
      const recentReports = reports?.filter(r => {
        const reportDate = new Date(r.created_at);
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);
        return reportDate > dayAgo;
      }) || [];

      if (recentReports.length > 0) {
        generatedNotifications.push({
          id: 'recent-activity',
          type: 'team',
          title: 'Recent Activity',
          message: `${recentReports.length} new test reports created today`,
          priority: 'low',
          read: false,
          created_at: new Date().toISOString(),
          action_url: '/test-reports'
        });
      }

      setNotifications(generatedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    // In a real app, these would be stored in the database
    const savedSettings = localStorage.getItem('workflow-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const handleRealTimeUpdate = (payload: any) => {
    // Handle real-time updates for workflow automation
    console.log('Real-time update:', payload);
    
    if (payload.eventType === 'INSERT') {
      toast({
        title: "New Test Report",
        description: `Test report ${payload.new.report_number} has been created`,
      });
    }
    
    // Refresh notifications
    fetchNotifications();
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const updateSettings = (key: keyof WorkflowSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('workflow-settings', JSON.stringify(newSettings));
    
    toast({
      title: "Settings updated",
      description: "Workflow automation settings have been saved",
    });
  };

  const sendTestNotification = async () => {
    try {
      const { error } = await supabase.functions.invoke('send-workflow-notification', {
        body: {
          type: 'test',
          title: 'Test Notification',
          message: 'This is a test notification from your workflow automation',
          recipient_email: profile?.name || 'test@example.com'
        }
      });

      if (error) throw error;

      toast({
        title: "Test notification sent",
        description: "Check your email for the test notification",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send test notification",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deadline': return <Calendar className="h-4 w-4" />;
      case 'approval': return <CheckCircle className="h-4 w-4" />;
      case 'compliance': return <AlertTriangle className="h-4 w-4" />;
      case 'team': return <User className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Workflow Automation</h2>
        <p className="text-muted-foreground">
          Automated notifications, approvals, and deadline tracking
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Active Notifications
            </CardTitle>
            <CardDescription>
              Current workflow alerts and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-3 border rounded-lg ${
                      notification.read ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="mt-1">
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <Badge className={getPriorityColor(notification.priority)}>
                              {notification.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active notifications</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Automation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Automation Settings
            </CardTitle>
            <CardDescription>
              Configure your workflow automation preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <Switch
                  id="email-notifications"
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => updateSettings('email_notifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="deadline-reminders">Deadline Reminders</Label>
                <Switch
                  id="deadline-reminders"
                  checked={settings.deadline_reminders}
                  onCheckedChange={(checked) => updateSettings('deadline_reminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="approval-notifications">Approval Notifications</Label>
                <Switch
                  id="approval-notifications"
                  checked={settings.approval_notifications}
                  onCheckedChange={(checked) => updateSettings('approval_notifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="compliance-alerts">Compliance Alerts</Label>
                <Switch
                  id="compliance-alerts"
                  checked={settings.compliance_alerts}
                  onCheckedChange={(checked) => updateSettings('compliance_alerts', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder-days">Reminder Days Before Deadline</Label>
                <Select 
                  value={settings.reminder_days.toString()} 
                  onValueChange={(value) => updateSettings('reminder_days', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={sendTestNotification}
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Test Notification
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Automated Workflow Rules</CardTitle>
          <CardDescription>
            Current automation rules and triggers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <h4 className="font-medium">Auto-Approval</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Automatically approve test reports that meet predefined criteria
              </p>
              <Badge className="mt-2 bg-green-100 text-green-800">Active</Badge>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <h4 className="font-medium">Compliance Monitoring</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Monitor test results for compliance violations and alert team
              </p>
              <Badge className="mt-2 bg-green-100 text-green-800">Active</Badge>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium">Deadline Tracking</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Track project deadlines and send reminders to team members
              </p>
              <Badge className="mt-2 bg-green-100 text-green-800">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}