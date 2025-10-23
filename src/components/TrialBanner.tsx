import { AlertTriangle, Crown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';

export function TrialBanner() {
  const navigate = useNavigate();
  const { getTrialStatus } = useSubscriptionLimits();

  if (getTrialStatus.isSubscribed) {
    return null;
  }

  if (getTrialStatus.isTrial) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-800">Trial Account</AlertTitle>
        <AlertDescription className="text-orange-700 flex items-center justify-between">
          <span>{getTrialStatus.message}</span>
          <Button 
            size="sm" 
            onClick={() => navigate('/subscription')}
            className="ml-4"
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade Now
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>No Active Subscription</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>Subscribe to create test reports and access full features.</span>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => navigate('/subscription')}
          className="ml-4 bg-white"
        >
          View Plans
        </Button>
      </AlertDescription>
    </Alert>
  );
}
