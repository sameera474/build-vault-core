import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function CreateSuperAdmin() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createSuperAdmin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-super-admin', {
        body: {
          email: 'sameera474@gmail.com',
          password: 'Csw@275752',
          name: 'Sameera Chaturanga Wagaarachchige'
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Super admin account created successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create super admin',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Create Super Admin</CardTitle>
          <CardDescription>
            Create the super admin account with the specified credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm"><strong>Email:</strong> sameera474@gmail.com</p>
              <p className="text-sm"><strong>Name:</strong> Sameera Chaturanga Wagaarachchige</p>
            </div>
            <Button onClick={createSuperAdmin} disabled={loading} className="w-full">
              {loading ? 'Creating...' : 'Create Super Admin Account'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
