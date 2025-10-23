import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useSubscriptionLimits() {
  const { subscriptionStatus } = useAuth();
  const { toast } = useToast();

  const canCreateReport = () => {
    // If subscribed, always allow
    if (subscriptionStatus?.subscribed) {
      return true;
    }

    // If on trial and hasn't used it
    if (subscriptionStatus?.is_trial && !subscriptionStatus?.trial_used) {
      return true;
    }

    return false;
  };

  const showLimitError = () => {
    if (subscriptionStatus?.is_trial && subscriptionStatus?.trial_used) {
      toast({
        title: "Trial Limit Reached",
        description: "You've used your free trial report. Please subscribe to create more reports.",
        variant: "destructive",
      });
    } else if (!subscriptionStatus?.subscribed) {
      toast({
        title: "Subscription Required",
        description: "Please subscribe to create test reports.",
        variant: "destructive",
      });
    }
  };

  const getTrialStatus = () => {
    if (subscriptionStatus?.subscribed) {
      return { isSubscribed: true, message: 'Active Subscription' };
    }

    if (subscriptionStatus?.is_trial) {
      const remaining = subscriptionStatus.trial_reports_remaining || 0;
      return {
        isSubscribed: false,
        isTrial: true,
        reportsRemaining: remaining,
        message: `Trial: ${remaining} report${remaining !== 1 ? 's' : ''} remaining`
      };
    }

    return { isSubscribed: false, message: 'No active subscription' };
  };

  return {
    canCreateReport: canCreateReport(),
    showLimitError,
    getTrialStatus: getTrialStatus(),
    subscriptionStatus,
  };
}
