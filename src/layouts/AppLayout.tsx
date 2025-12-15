import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  HardHat, LogOut, ChevronDown, BarChart3, FileText, Users as UsersIcon, 
  Building2, Users, Settings, Package, Shield, CheckSquare, FolderOpen,
  TrendingUp, Calendar, Map, Zap, Smartphone, Download, FileSpreadsheet,
  Activity, UserCog, FileCheck, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserAvatar } from '@/components/UserAvatar';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  title: string;
  url: string;
  icon: any;
  roles?: string[]; // Allowed roles
  requireSuperAdmin?: boolean;
}

interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

// Define navigation structure with proper grouping
const getNavigationGroups = (isSuperAdmin: boolean, tenantRole: string): NavigationGroup[] => {
  const groups: NavigationGroup[] = [];

  // Main Section - Regular users see dashboard, super admins skip (they have Super Admin Dashboard)
  if (!isSuperAdmin) {
    groups.push({
      label: "Main",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
      ]
    });
  }
  // Testing & Reports - Core functionality
  groups.push({
    label: "Testing & Reports",
    items: [
      { title: "Test Reports", url: "/test-reports", icon: FileText, roles: ['technician', 'project_manager', 'quality_manager', 'admin'] },
      { title: "Templates", url: "/templates", icon: FileSpreadsheet, roles: ['project_manager', 'quality_manager', 'admin'] },
      { title: "Approvals", url: "/approvals", icon: CheckSquare, roles: ['project_manager', 'quality_manager', 'admin'] },
    ]
  });

  // Analytics & Insights
  groups.push({
    label: "Analytics & Insights",
    items: [
      { title: "Analytics", url: "/analytics", icon: TrendingUp, roles: ['project_manager', 'quality_manager', 'admin'] },
      { title: "Monthly Summaries", url: "/monthly-summaries", icon: Calendar, roles: ['technician', 'project_manager', 'quality_manager', 'admin'] },
      { title: "Chainage Charts", url: "/barchart", icon: Map, roles: ['technician', 'project_manager', 'quality_manager', 'admin'] },
    ]
  });

  // Project Management
  groups.push({
    label: "Project Management",
    items: [
      { title: "Projects", url: "/projects", icon: Building2, roles: ['project_manager', 'quality_manager', 'admin'] },
      { title: "Documents", url: "/documents", icon: FolderOpen, roles: ['project_manager', 'quality_manager', 'admin'] },
      { title: "Laboratory Inventory", url: "/laboratory-inventory", icon: Package, roles: ['admin', 'project_manager', 'quality_manager', 'technician'] },
    ]
  });

  // Company Management
  groups.push({
    label: "Company Management",
    items: [
      { title: "Team", url: "/team", icon: UsersIcon, roles: ['admin'] },
      { title: "Permissions", url: "/permissions", icon: Shield, roles: ['admin'] },
    ]
  });

  // Tools & Utilities
  groups.push({
    label: "Tools",
    items: [
      { title: "Export Data", url: "/export", icon: Download, roles: ['project_manager', 'quality_manager', 'admin'] },
      { title: "Mobile", url: "/mobile", icon: Smartphone },
    ]
  });

  // Super Admin Section - Only for super admins
  if (isSuperAdmin) {
    groups.push({
      label: "System Administration",
      items: [
        { title: "Super Admin Dashboard", url: "/super-admin", icon: Shield, requireSuperAdmin: true },
        { title: "All Companies", url: "/companies", icon: Building2, requireSuperAdmin: true },
        { title: "System Users", url: "/demo-users", icon: Users, requireSuperAdmin: true },
        { title: "Audit Logs", url: "/audit-logs", icon: AlertCircle, requireSuperAdmin: true },
        { title: "Automation", url: "/automation", icon: Zap, requireSuperAdmin: true },
      ]
    });
  }

  return groups;
};

function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { profile } = useAuth();

  const isActive = (path: string) => currentPath === path;

  // Determine user role and admin status
  const isSuperAdmin = (profile as any)?.is_super_admin || false;
  const tenantRole = (profile as any)?.tenant_role || 'user';

  const shouldShowMenuItem = (item: NavigationItem): boolean => {
    // Super admin sees everything
    if (isSuperAdmin) {
      return true;
    }

    // Check if super admin is required
    if (item.requireSuperAdmin) {
      return false;
    }

    // Check role-based access
    if (item.roles && item.roles.length > 0) {
      return item.roles.includes(tenantRole);
    }

    // Default to show if no restrictions
    return true;
  };

  const navigationGroups = getNavigationGroups(isSuperAdmin, tenantRole);

  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-4">
          <Link to={isSuperAdmin ? "/super-admin" : "/dashboard"} className="flex items-center gap-2">
            <HardHat className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">ConstructTest Pro</span>
          </Link>
        </div>
        
        {navigationGroups.map((group) => {
          const visibleItems = group.items.filter(shouldShowMenuItem);
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link 
                          to={item.url} 
                          className={cn(
                            "flex items-center gap-2 transition-colors",
                            isActive(item.url) 
                              ? "bg-muted text-primary font-medium" 
                              : "hover:bg-muted/50"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const { profile, signOut: authSignOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await authSignOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      navigate('/signin');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 sm:px-6">
            <SidebarTrigger />
            
            <div className="flex items-center gap-4">
              <ThemeToggle />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <UserAvatar 
                      avatarUrl={profile?.avatar_url}
                      userName={profile?.name}
                      size="sm"
                    />
                    <span className="hidden sm:inline">{profile?.name || 'User'}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}