import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HardHat, LogOut, User, ChevronDown, BarChart3, FileText, Users as UsersIcon } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
  { title: "Test Reports", url: "/test-reports", icon: FileText },
  { title: "Monthly Summaries", url: "/monthly-summaries", icon: BarChart3 },
  { title: "Chainage Charts", url: "/barchart", icon: BarChart3 },
  { title: "Approvals", url: "/approvals", icon: FileText },
  { title: "Projects", url: "/projects", icon: UsersIcon, disabled: true },
  { title: "Templates", url: "/templates", icon: FileText, disabled: true },
];

function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

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
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild disabled={item.disabled}>
                    {item.disabled ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        <span className="text-xs ml-auto">Soon</span>
                      </div>
                    ) : (
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
                    )}
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
          <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6">
            <SidebarTrigger />
            
            <div className="flex items-center gap-4">
              <ThemeToggle />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{profile?.name || 'User'}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}