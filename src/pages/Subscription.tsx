import React, { useState, useEffect } from 'react';
import { Check, Crown, Zap, Building2, Star, CreditCard, Users, FileText, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  max_users: number;
  max_reports: number;
  max_storage_gb: number;
  is_active: boolean;
}

interface UserSubscription {
  id: string;
  plan_id: string;
  status: string;
  current_period_end: string;
  plan?: SubscriptionPlan;
}

export default function Subscription() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
  }, [profile?.company_id]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      setPlans((data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features as string[] : []
      })));
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive",
      });
    }
  };

  const fetchCurrentSubscription = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('company_subscriptions')
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq('company_id', profile.company_id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setCurrentSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCheckoutSession = async (planId: string) => {
    if (!profile?.user_id) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe",
        variant: "destructive",
      });
      return;
    }

    setSubscribing(planId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          planId,
          billingCycle,
          successUrl: `${window.location.origin}/subscription?success=true`,
          cancelUrl: `${window.location.origin}/subscription?canceled=true`
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    } finally {
      setSubscribing(null);
    }
  };

  const manageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: { 
          returnUrl: `${window.location.origin}/subscription`
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open customer portal",
        variant: "destructive",
      });
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'starter':
        return <Zap className="h-6 w-6" />;
      case 'professional':
        return <Crown className="h-6 w-6" />;
      case 'enterprise':
        return <Building2 className="h-6 w-6" />;
      default:
        return <Star className="h-6 w-6" />;
    }
  };

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.plan_id === planId;
  };

  const formatPrice = (plan: SubscriptionPlan) => {
    const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
    const period = billingCycle === 'monthly' ? '/month' : '/year';
    return `$${price}${period}`;
  };

  const getSavingsText = (plan: SubscriptionPlan) => {
    if (billingCycle === 'yearly' && plan.price_yearly && plan.price_monthly) {
      const yearlyMonthly = plan.price_yearly / 12;
      const savings = ((plan.price_monthly - yearlyMonthly) / plan.price_monthly * 100).toFixed(0);
      return `Save ${savings}%`;
    }
    return '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Unlock powerful construction testing features with our flexible subscription plans
        </p>
        
        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 p-1 bg-muted rounded-lg max-w-xs mx-auto">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'monthly' 
                ? 'bg-background text-foreground shadow' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
              billingCycle === 'yearly' 
                ? 'bg-background text-foreground shadow' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Yearly
            <Badge className="absolute -top-2 -right-2 text-xs bg-green-500">Save 20%</Badge>
          </button>
        </div>
      </div>

      {/* Current Subscription Status */}
      {currentSubscription && (
        <Card className="max-w-2xl mx-auto border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-800">Current Subscription</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-800">{currentSubscription.plan?.name} Plan</p>
                <p className="text-sm text-green-600">
                  Active until {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                </p>
              </div>
              <Button onClick={manageSubscription} variant="outline">
                <CreditCard className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Cards */}
      <div className="grid gap-6 lg:grid-cols-3 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const isPopular = plan.name === 'Professional';
          const isCurrent = isCurrentPlan(plan.id);
          
          return (
            <Card 
              key={plan.id} 
              className={`relative ${
                isPopular ? 'ring-2 ring-primary shadow-lg' : ''
              } ${isCurrent ? 'border-green-500 bg-green-50' : ''}`}
            >
              {isPopular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    plan.name === 'Starter' ? 'bg-blue-100 text-blue-600' :
                    plan.name === 'Professional' ? 'bg-purple-100 text-purple-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {getPlanIcon(plan.name)}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{formatPrice(plan)}</span>
                    {getSavingsText(plan) && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        {getSavingsText(plan)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Per company • Billed {billingCycle}
                  </p>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4 py-4 border-y">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-sm font-medium">
                      <Users className="h-4 w-4" />
                      {plan.max_users === 100 ? '100+' : plan.max_users} Users
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-sm font-medium">
                      <FileText className="h-4 w-4" />
                      {plan.max_reports >= 1000 ? plan.max_reports === 10000 ? '10K+' : '1K+' : plan.max_reports} Reports
                    </div>
                  </div>
                  <div className="text-center col-span-2">
                    <div className="flex items-center justify-center gap-1 text-sm font-medium">
                      <Database className="h-4 w-4" />
                      {plan.max_storage_gb}GB Storage
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <h4 className="font-medium">Features included:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <div className="pt-4">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button 
                      className={`w-full ${isPopular ? 'bg-primary' : ''}`}
                      onClick={() => createCheckoutSession(plan.id)}
                      disabled={subscribing === plan.id}
                    >
                      {subscribing === plan.id ? 'Processing...' : `Get ${plan.name}`}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-center">Frequently Asked Questions</h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Can I change plans anytime?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately with prorated billing.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We accept all major credit cards, debit cards, and ACH transfers through our secure Stripe payment system.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Is there a free trial?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes, all plans come with a 14-day free trial. No credit card required to start your trial.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Absolutely. Cancel anytime from your account settings. You'll continue to have access until your billing period ends.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enterprise Contact */}
      <Card className="max-w-2xl mx-auto text-center">
        <CardHeader>
          <CardTitle>Need Something Custom?</CardTitle>
          <CardDescription>
            Contact us for enterprise solutions, custom integrations, or special pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="lg">
            Contact Sales
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}