import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getUserProfile } from '@/lib/auth';

interface Profile {
  user_id: string;
  company_id: string;
  name: string | null;
  role: string;
  created_at: string;
  company_name?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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
            
            // Fetch company name
            if (profileData?.company_id) {
              const { data: companyData } = await supabase
                .from('companies')
                .select('name')
                .eq('id', profileData.company_id)
                .single();
              
              if (companyData) {
                setProfile({ ...profileData, company_name: companyData.name } as typeof profileData & { company_name: string });
                return;
              }
            }
            
            setProfile(profileData);
          }, 0);
        } else {
          setProfile(null);
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
          
          // Fetch company name
          if (profileData?.company_id) {
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
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signOut: handleSignOut,
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