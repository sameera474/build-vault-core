import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getUserProfile } from '@/lib/auth';

interface SubscriptionStatus {
  subscribed: boolean;
  product_id?: string | null;
  subscription_end?: string | null;
  is_trial?: boolean;
  trial_used?: boolean;
  trial_reports_remaining?: number;
}

interface Profile {
  user_id: string;
  company_id: string | null;
  name: string | null;
  tenant_role: string;
  created_at: string;
  company_name?: string;
  avatar_url?: string | null;
  phone?: string | null;
  job_title?: string | null;
  department?: string | null;
  employee_id?: string | null;
  hire_date?: string | null;
  is_active?: boolean;
  is_super_admin?: boolean;
  email?: string | null;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  subscriptionStatus: SubscriptionStatus | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSubscriptionStatus(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscriptionStatus(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        console.log('[Auth] onAuthStateChange', { event, hasSession: !!session, userId: session?.user?.id });

        // Update state for runtime changes
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer fetching profile to avoid blocking the auth callback
          setTimeout(async () => {
            if (!mounted) return;
            const { data: profileData } = await getUserProfile(session.user.id);
            
            // Fetch company name only for non-super-admins with company_id
            if (profileData?.company_id && !profileData?.is_super_admin) {
              const { data: companyData } = await supabase
                .from('companies')
                .select('name')
                .eq('id', profileData.company_id)
                .single();
              
              if (companyData) {
                setProfile({ ...profileData, company_name: companyData.name } as typeof profileData & { company_name: string });
              } else {
                setProfile(profileData);
              }
            } else {
              // Super admins or users without company_id
              setProfile(profileData);
            }
            
            // Check subscription status
            refreshSubscription();
          }, 0);
        } else {
          setProfile(null);
          setSubscriptionStatus(null);
        }

        // Avoid flipping loading during initial bootstrap
        if (event && event !== 'INITIAL_SESSION') {
          setLoading(false);
        }
      }
    );

    // THEN check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      console.log('[Auth] getSession', { hasSession: !!session, userId: session?.user?.id });

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        getUserProfile(session.user.id).then(async ({ data: profileData }) => {
          if (!mounted) return;
          
          // Fetch company name only for non-super-admins with company_id
          if (profileData?.company_id && !profileData?.is_super_admin) {
            const { data: companyData } = await supabase
              .from('companies')
              .select('name')
              .eq('id', profileData.company_id)
              .single();
            
            if (companyData) {
              profileData = { ...profileData, company_name: companyData.name } as typeof profileData & { company_name: string };
            }
          }
          
          setProfile(profileData);
          refreshSubscription();
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Auto-refresh subscription every minute
    const interval = setInterval(() => {
      if (user) {
        refreshSubscription();
      }
    }, 60000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    profile,
    subscriptionStatus,
    loading,
    signOut: handleSignOut,
    refreshSubscription,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}