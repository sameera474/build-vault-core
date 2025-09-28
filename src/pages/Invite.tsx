import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function Invite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    // noop: could validate token via function if needed
  }, [token]);

  const accept = async () => {
    if (!token) return;
    setAccepting(true);
    try {
      const { data, error } = await supabase.functions.invoke('accept-team-invitation', {
        body: { token },
      });
      if (error) throw error;
      toast({ title: 'Invitation accepted', description: 'You have joined the team.' });
      navigate('/team');
    } catch (e: any) {
      console.error('Accept invite error:', e);
      toast({ title: 'Unable to accept invitation', description: e.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setAccepting(false);
    }
  };

  if (!token) {
    return (
      <Card className="max-w-xl mx-auto mt-10">
        <CardHeader>
          <CardTitle>Invalid invitation</CardTitle>
          <CardDescription>The invitation link is missing or invalid.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!profile?.user_id) {
    return (
      <Card className="max-w-xl mx-auto mt-10">
        <CardHeader>
          <CardTitle>Join the team</CardTitle>
          <CardDescription>
            Please sign in or create an account, then return to this page to accept the invitation.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Link to="/sign-in"><Button variant="outline">Sign in</Button></Link>
          <Link to="/register"><Button>Register</Button></Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-xl mx-auto mt-10">
      <CardHeader>
        <CardTitle>Accept Invitation</CardTitle>
        <CardDescription>Click the button below to join your team's workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={accept} disabled={accepting}>{accepting ? 'Accepting...' : 'Accept Invitation'}</Button>
      </CardContent>
    </Card>
  );
}
