import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const tiers = [
  {
    name: 'Starter',
    id: 'starter',
    href: '/register',
    price: { monthly: '$99', annually: '$999' },
    description: 'Perfect for small testing labs and individual consultants.',
    features: [
      'Up to 5 users',
      '100 test reports per month',
      'Basic templates',
      'Email support',
      'Standard reporting',
      'Mobile access',
    ],
    mostPopular: false,
  },
  {
    name: 'Professional',
    id: 'professional',
    href: '/register',
    price: { monthly: '$299', annually: '$2,999' },
    description: 'Ideal for growing engineering firms and construction companies.',
    features: [
      'Up to 25 users',
      'Unlimited test reports',
      'Advanced templates',
      'Priority support',
      'Custom reporting',
      'API access',
      'Advanced analytics',
      'Compliance management',
    ],
    mostPopular: true,
  },
  {
    name: 'Enterprise',
    id: 'enterprise',
    href: '/contact',
    price: { monthly: 'Custom', annually: 'Custom' },
    description: 'For large organizations with complex requirements.',
    features: [
      'Unlimited users',
      'Unlimited test reports',
      'Custom templates',
      'Dedicated support',
      'White-label reports',
      'SSO integration',
      'Advanced security',
      'Custom integrations',
      'Dedicated account manager',
    ],
    mostPopular: false,
  },
];

export default function Pricing() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-4xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Simple,{' '}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                transparent
              </span>{' '}
              pricing
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that's right for your organization. All plans include our core 
              testing management features with no hidden fees.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {tiers.map((tier) => (
              <Card
                key={tier.id}
                className={`${
                  tier.mostPopular
                    ? 'ring-2 ring-primary shadow-lg scale-105'
                    : 'border-border/50'
                } relative hover:shadow-md transition-all duration-300`}
              >
                {tier.mostPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground">
                      Most popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-xl font-semibold">{tier.name}</CardTitle>
                  <div className="mt-4 flex items-baseline justify-center gap-x-2">
                    <span className="text-4xl font-bold tracking-tight text-foreground">
                      {tier.price.monthly}
                    </span>
                    {tier.price.monthly !== 'Custom' && (
                      <span className="text-sm font-semibold leading-6 tracking-wide text-muted-foreground">
                        /month
                      </span>
                    )}
                  </div>
                  <CardDescription className="mt-4">
                    {tier.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <Link to={tier.href}>
                    <Button
                      variant={tier.mostPopular ? 'hero' : 'outline'}
                      className="w-full"
                    >
                      {tier.id === 'enterprise' ? 'Contact sales' : 'Get started'}
                    </Button>
                  </Link>

                  <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex gap-x-3">
                        <Check className="h-6 w-5 flex-none text-primary" aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 sm:py-32 bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-center">
              Frequently asked questions
            </h2>
            <div className="mt-16 space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Can I change plans at any time?
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Yes, you can upgrade or downgrade your plan at any time. Changes will be 
                  reflected in your next billing cycle.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Is there a free trial?
                </h3>
                <p className="mt-2 text-muted-foreground">
                  We offer a 14-day free trial for all plans so you can explore our platform 
                  and see how it fits your workflow.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  What kind of support do you offer?
                </h3>
                <p className="mt-2 text-muted-foreground">
                  All plans include email support. Professional and Enterprise plans include 
                  priority support and phone support. Enterprise customers get a dedicated 
                  account manager.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-primary">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-foreground/90">
              Start your free trial today and see how ConstructTest Pro can transform your testing workflow.
            </p>
            <div className="mt-10">
              <Link to="/register">
                <Button variant="secondary" size="lg" className="bg-background text-foreground hover:bg-background/90">
                  Start free trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}