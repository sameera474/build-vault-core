import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Download, BarChart3 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function MonthlySummaries() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Monthly Summaries</h1>
        <Button>
          <BarChart3 className="h-4 w-4 mr-2" />
          Generate Summary
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Monthly Summaries</h3>
          <p className="text-muted-foreground mt-2 text-center">
            Generate monthly summaries from approved reports.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}