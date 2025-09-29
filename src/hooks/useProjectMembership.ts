import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectMember } from '@/types/auth';

export function useProjectMembership() {
  const { profile } = useAuth();
  const [memberships, setMemberships] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.user_id) {
      fetchMemberships();
    }
  }, [profile?.user_id]);

  const fetchMemberships = async () => {
    if (!profile?.user_id) return;
    
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select('*')
        .eq('user_id', profile.user_id);

      if (error) throw error;
      setMemberships((data || []) as ProjectMember[]);
    } catch (error) {
      console.error('Error fetching project memberships:', error);
      setMemberships([]);
    } finally {
      setLoading(false);
    }
  };

  const isProjectMember = (projectId: string): boolean => {
    return memberships.some(m => m.project_id === projectId);
  };

  const getProjectRole = (projectId: string): string | null => {
    const membership = memberships.find(m => m.project_id === projectId);
    return membership?.role || null;
  };

  const assignedProjectIds = memberships.map(m => m.project_id);

  return {
    memberships,
    loading,
    isProjectMember,
    getProjectRole,
    assignedProjectIds,
    refetch: fetchMemberships
  };
}