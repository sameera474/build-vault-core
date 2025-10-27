import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HardHat, LogOut, User, ChevronDown, BarChart3, FileText, Users as UsersIcon, Building2, Users, Settings, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
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
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { canSeeMenuItem } from '@/lib/rbac';

interface AppLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  title: string;
  url: string;
  icon: any;
  requiredPermissions?: string[];
  requireSuperAdmin?: boolean;
}

const navigationItems: NavigationItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
  { title: "Test Reports", url: "/test-reports", icon: FileText, requiredPermissions: ['create_reports', 'view_company_reports', 'view_own_reports'] },
  { title: "Analytics", url: "/analytics", icon: BarChart3, requiredPermissions: ['view_analytics', 'view_system_analytics'] },
  { title: "Monthly Summaries", url: "/monthly-summaries", icon: BarChart3, requiredPermissions: ['view_analytics', 'view_company_reports'] },
  { title: "Chainage Charts", url: "/barchart", icon: BarChart3, requiredPermissions: ['view_analytics', 'view_company_reports'] },
  { title: "Approvals", url: "/approvals", icon: FileText, requiredPermissions: ['approve_reports'] },
  { title: "Documents", url: "/documents", icon: FileText, requiredPermissions: ['view_company_reports', 'export_data'] },
  { title: "Laboratory Inventory", url: "/laboratory-inventory", icon: Package, requiredPermissions: ['manage_company_users', 'view_company_reports'] },
  { title: "Team", url: "/team", icon: UsersIcon, requiredPermissions: ['manage_company_users'] },
  { title: "Projects", url: "/projects", icon: UsersIcon, requiredPermissions: ['manage_projects', 'view_company_reports'] },
  { title: "Companies", url: "/companies", icon: Building2, requireSuperAdmin: true },
  { title: "Users", url: "/demo-users", icon: Users, requireSuperAdmin: true },
  { title: "Fix Demo Users", url: "/fix-demo-users", icon: Users, requireSuperAdmin: true },
  { title: "Super Admin", url: "/super-admin", icon: Building2, requireSuperAdmin: true },
  { title: "Automation", url: "/automation", icon: FileText, requiredPermissions: ['manage_system_settings'] },
  { title: "Mobile", url: "/mobile", icon: FileText },
  { title: "Export", url: "/export", icon: FileText, requiredPermissions: ['export_data'] },
  { title: "Templates", url: "/templates", icon: FileText, requiredPermissions: ['manage_templates', 'view_company_reports'] },
];

function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { profile } = useAuth();
  const { hasPermission, hasAnyPermission, isSuperAdmin } = usePermissions();

  const isActive = (path: string) => currentPath === path;

  const shouldShowMenuItem = (item: NavigationItem) => {
    // Super admin can see everything
    if (isSuperAdmin) {
      return true;
    }

    // Check if super admin is required
    if (item.requireSuperAdmin) {
      return false;
    }

    // Role-based menu filtering using RBAC
    const userRole = profile?.role;
    if (userRole && !canSeeMenuItem(userRole, item.title)) {
      return false;
    }

    // Check permissions
    if (item.requiredPermissions) {
      return hasAnyPermission(item.requiredPermissions);
    }

    // Default to show if no restrictions
    return true;
  };

  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <HardHat className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">ConstructTest Pro</span>
          </Link>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>Testing Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems
                .filter(shouldShowMenuItem)
                .map((item) => (
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
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 sm:px-6">
            <SidebarTrigger />
            
            <div className="flex items-center gap-4">
              <ThemeToggle />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
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
          
          <main className="flex-1 p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}