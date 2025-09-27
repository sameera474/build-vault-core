import { Link } from 'react-router-dom';
import { CheckCircle, BarChart3, Shield, Users, FileText, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    name: 'Advanced Testing Reports',
    description: 'Comprehensive digital test reports with automated calculations and compliance tracking.',
    icon: FileText,
  },
  {
    name: 'Real-time Analytics',
    description: 'Interactive charts and data visualization for construction material performance.',
    icon: BarChart3,
  },
  {
    name: 'Multi-tenant Security',
    description: 'Enterprise-grade security with role-based access control for your organization.',
    icon: Shield,
  },
  {
    name: 'Team Collaboration',
    description: 'Seamless collaboration between technicians, engineers, and project managers.',
    icon: Users,
  },
  {
    name: 'Compliance Management',
    description: 'Automated compliance checking against industry standards and specifications.',
    icon: CheckCircle,
  },
  {
    name: 'Efficient Workflows',
    description: 'Streamlined testing workflows that save time and reduce manual errors.',
    icon: Clock,
  },
];

const materials = [
  { name: 'Asphalt Testing', description: 'Marshall stability, density, and gradation analysis' },
  { name: 'Concrete Testing', description: 'Compressive strength, slump, and durability testing' },
  { name: 'Soil Analysis', description: 'Compaction, bearing capacity, and classification tests' },
  { name: 'Aggregate Testing', description: 'Gradation, specific gravity, and absorption analysis' },
];

export default function Home() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative isolate px-6 pt-14 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-primary opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
        <div className="mx-auto max-w-4xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Professional{' '}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Construction Testing
              </span>{' '}
              Management
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
              Streamline your construction materials testing with our comprehensive SaaS platform. 
              Generate reports, track compliance, and collaborate seamlessly across your organization.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link to="/register">
                <Button variant="hero" size="lg">
                  Get Started
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" size="lg">
                  See Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32 bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary">Everything you need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Professional testing made simple
            </p>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Our platform provides all the tools you need to manage construction materials testing 
              efficiently and accurately.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.name} className="border-border/50 hover:shadow-md transition-smooth">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <feature.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                      </div>
                      <CardTitle className="text-lg">{feature.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Materials Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-accent">Material Types</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Comprehensive testing coverage
            </p>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Support for all major construction materials with industry-standard testing protocols.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
            {materials.map((material) => (
              <Card key={material.name} className="border-border/50 hover:shadow-md transition-smooth">
                <CardHeader>
                  <CardTitle className="text-xl">{material.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {material.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-primary">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Ready to streamline your testing?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-foreground/90">
              Join construction professionals who trust ConstructTest Pro for their materials testing needs.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link to="/register">
                <Button variant="secondary" size="lg" className="bg-background text-foreground hover:bg-background/90">
                  Get started today
                </Button>
              </Link>
              <Link to="/contact" className="text-sm font-semibold leading-6 text-primary-foreground hover:text-primary-foreground/80 transition-smooth">
                Contact sales <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}