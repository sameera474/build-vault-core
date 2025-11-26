import { Link } from 'react-router-dom';
import { Check, X, Zap, Building2, Sparkles, ArrowRight, HelpCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

const tiers = [
  {
    name: 'Starter',
    id: 'starter',
    href: '/register',
    price: { monthly: 99, annually: 999 },
    description: 'Perfect for small testing labs and individual consultants.',
    icon: Zap,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    features: [
      { name: 'Up to 5 users', included: true },
      { name: '100 test reports per month', included: true },
      { name: 'Basic templates', included: true },
      { name: 'Email support', included: true },
      { name: 'Standard reporting', included: true },
      { name: 'Mobile access', included: true },
      { name: 'Advanced analytics', included: false },
      { name: 'API access', included: false },
      { name: 'Custom integrations', included: false },
    ],
    mostPopular: false,
  },
  {
    name: 'Professional',
    id: 'professional',
    href: '/register',
    price: { monthly: 299, annually: 2999 },
    description: 'Ideal for growing engineering firms and construction companies.',
    icon: Building2,
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
    features: [
      { name: 'Up to 25 users', included: true },
      { name: 'Unlimited test reports', included: true },
      { name: 'Advanced templates', included: true },
      { name: 'Priority support', included: true },
      { name: 'Custom reporting', included: true },
      { name: 'Mobile access', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'API access', included: true },
      { name: 'Compliance management', included: true },
    ],
    mostPopular: true,
  },
  {
    name: 'Enterprise',
    id: 'enterprise',
    href: '/contact',
    price: { monthly: 'Custom', annually: 'Custom' },
    description: 'For large organizations with complex requirements.',
    icon: Sparkles,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    features: [
      { name: 'Unlimited users', included: true },
      { name: 'Unlimited test reports', included: true },
      { name: 'Custom templates', included: true },
      { name: 'Dedicated support', included: true },
      { name: 'White-label reports', included: true },
      { name: 'SSO integration', included: true },
      { name: 'Advanced security', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'Dedicated account manager', included: true },
    ],
    mostPopular: false,
  },
];

const faqs = [
  {
    question: 'Can I change plans at any time?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle, and we\'ll prorate any differences.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Absolutely! We offer a 14-day free trial for all plans so you can explore our platform and see how it fits your workflow before committing.',
  },
  {
    question: 'What kind of support do you offer?',
    answer: 'All plans include email support. Professional plans get priority support with faster response times. Enterprise customers receive dedicated phone support and a personal account manager.',
  },
  {
    question: 'Do you offer volume discounts?',
    answer: 'Yes! For teams with more than 50 users, we offer custom pricing with significant discounts. Contact our sales team for a personalized quote.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, ACH transfers, and wire transfers for annual plans. Enterprise customers can also pay via purchase order.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes, you can cancel your subscription at any time. For monthly plans, you\'ll have access until the end of your billing period. Annual plans are non-refundable but you can choose not to renew.',
  },
];

export default function Pricing() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annually'>('monthly');
  const annualDiscount = 17; // 17% discount for annual billing

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden px-6 pt-14 lg:px-8">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.1),transparent_50%)]" />
        </div>
        
        <div className="mx-auto max-w-4xl py-20 sm:py-32 lg:py-40">
          <div className="text-center space-y-8 animate-fade-in">
            <Badge className="mb-4" variant="secondary">
              Transparent Pricing
            </Badge>
            
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              Simple,{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                transparent
              </span>
              {' '}pricing
            </h1>
            
            <p className="mt-6 text-lg sm:text-xl leading-8 text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that's right for your organization. All plans include our core 
              testing management features with no hidden fees.
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <span className={`text-sm font-medium ${billingInterval === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'annually' : 'monthly')}
                className="relative inline-flex h-8 w-14 items-center rounded-full bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    billingInterval === 'annually' ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${billingInterval === 'annually' ? 'text-foreground' : 'text-muted-foreground'}`}>
                Annually
              </span>
              {billingInterval === 'annually' && (
                <Badge variant="secondary" className="ml-2 bg-green-500/10 text-green-600 dark:text-green-400">
                  Save {annualDiscount}%
                </Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-6">
            {tiers.map((tier, index) => (
              <Card
                key={tier.id}
                className={`relative flex flex-col ${
                  tier.mostPopular
                    ? 'ring-2 ring-primary shadow-2xl scale-105 lg:scale-110 z-10'
                    : 'border-border/50 hover:shadow-xl'
                } transition-all duration-300 animate-fade-in`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {tier.mostPopular && (
                  <div className="absolute -top-5 left-0 right-0 mx-auto w-fit">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1.5 text-sm font-semibold shadow-lg">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8 pt-10">
                  <div className={`mx-auto mb-4 rounded-2xl ${tier.iconBg} p-4 w-fit`}>
                    <tier.icon className={`h-8 w-8 ${tier.iconColor}`} />
                  </div>
                  
                  <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                  
                  <div className="mt-6">
                    {typeof tier.price.monthly === 'number' ? (
                      <>
                        <div className="flex items-baseline justify-center gap-x-2">
                          <span className="text-5xl font-bold tracking-tight text-foreground">
                            ${billingInterval === 'monthly' ? tier.price.monthly : Math.floor(tier.price.annually / 12)}
                          </span>
                          <span className="text-sm font-semibold text-muted-foreground">
                            /month
                          </span>
                        </div>
                        {billingInterval === 'annually' && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            ${tier.price.annually} billed annually
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="text-4xl font-bold text-foreground">
                        {tier.price.monthly}
                      </div>
                    )}
                  </div>
                  
                  <CardDescription className="mt-4 text-base">
                    {tier.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-6 pb-8">
                  <Link to={tier.href} className="block">
                    <Button
                      variant={tier.mostPopular ? 'default' : 'outline'}
                      size="lg"
                      className="w-full group"
                    >
                      {tier.id === 'enterprise' ? 'Contact Sales' : 'Get Started'}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">What's included:</p>
                    <ul className="space-y-2.5">
                      {tier.features.map((feature) => (
                        <li key={feature.name} className="flex items-start gap-3 text-sm">
                          {feature.included ? (
                            <Check className="h-5 w-5 flex-none text-green-500" />
                          ) : (
                            <X className="h-5 w-5 flex-none text-muted-foreground/30" />
                          )}
                          <span className={feature.included ? 'text-foreground' : 'text-muted-foreground/50'}>
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Trust Badges */}
          <div className="mt-16 text-center">
            <p className="text-sm text-muted-foreground mb-6">Trusted by construction professionals worldwide</p>
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>24/7 support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-24 bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">
                <HelpCircle className="h-3 w-3 mr-1" />
                FAQ
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Frequently asked questions
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Everything you need to know about our pricing and plans
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              {faqs.map((faq, index) => (
                <Card
                  key={index}
                  className="border-border/50 hover:shadow-lg transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-4">Still have questions?</p>
              <Link to="/contact">
                <Button variant="outline" size="lg">
                  Contact our sales team
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-900 dark:via-purple-900 dark:to-pink-900" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        
        <div className="relative mx-auto max-w-4xl px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Ready to get started?
          </h2>
          <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
            Start your free trial today and see how ConstructTest Pro can transform your testing workflow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button 
                size="lg" 
                variant="secondary"
                className="h-12 px-8 text-base font-medium hover:scale-105 transition-transform"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button 
                size="lg" 
                variant="outline"
                className="h-12 px-8 text-base font-medium bg-transparent text-white border-white/30 hover:bg-white/10"
              >
                Talk to Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
