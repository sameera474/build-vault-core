import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ReportNumberData {
  report_number: string;
  yymmdd: string;
  seq: number;
  project_prefix: string;
  region_code: string;
  lab_code: string;
}

export const useReportNumber = (
  projectId: string | undefined,
  docCode: string | undefined,
  testDate: Date | undefined
) => {
  const [reportNumber, setReportNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || !docCode || !testDate) {
      setReportNumber('');
      return;
    }

    const generateReportNumber = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get user profile for company_id
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('user_id', user.id)
          .single();

        if (!profile) throw new Error('Profile not found');

        // Call the allocate_report_number function
        const { data, error } = await supabase.rpc('allocate_report_number', {
          _company: profile.company_id,
          _project: projectId,
          _doc_code: docCode,
          _date: testDate.toISOString().split('T')[0]
        });

        if (error) throw error;

        if (data && data.length > 0) {
          setReportNumber(data[0].report_number);
        }
      } catch (err) {
        console.error('Error generating report number:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate report number');
      } finally {
        setIsLoading(false);
      }
    };

    generateReportNumber();
  }, [projectId, docCode, testDate]);

  return { reportNumber, isLoading, error };
};