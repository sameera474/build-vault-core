import { Link } from 'react-router-dom';
import { CheckCircle, BarChart3, Shield, Users, FileText, Clock, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import heroImage from '@/assets/hero-testing-lab.jpg';
import constructionTeam from '@/assets/construction-team.jpg';
import dashboardPreview from '@/assets/dashboard-preview.jpg';

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
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img 
            src={heroImage} 
            alt="Professional construction materials testing laboratory" 
            className="h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/70"></div>
        </div>
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl">
            <div className="mb-8 flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">Trusted by 500+ construction professionals</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Professional{' '}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Construction Testing
              </span>{' '}
              Management
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Streamline your construction materials testing with our comprehensive SaaS platform. 
              Generate reports, track compliance, and collaborate seamlessly across your organization.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link to="/register">
                <Button variant="hero" size="lg" className="group">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" size="lg">
                  See Demo
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-x-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>
          <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
            <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
              <img
                src={dashboardPreview}
                alt="ConstructTest Pro dashboard preview"
                width={800}
                height={600}
                className="w-[76rem] rounded-xl shadow-2xl ring-1 ring-border"
              />
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

      {/* Social Proof Section */}
      <section className="py-16 bg-muted/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <p className="text-base font-semibold leading-7 text-primary">Trusted by industry leaders</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Join construction professionals worldwide
            </h2>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-2">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <img
                src={constructionTeam}
                alt="Construction team using ConstructTest Pro"
                className="aspect-[4/3] w-full rounded-2xl object-cover lg:max-w-sm"
              />
              <div className="lg:max-w-xl">
                <h3 className="mt-6 text-lg font-semibold leading-8 tracking-tight text-foreground">
                  Streamlined workflows
                </h3>
                <p className="mt-2 text-base leading-7 text-muted-foreground">
                  Our platform has transformed how engineering teams manage materials testing, 
                  reducing report generation time by 75% and improving accuracy across all projects.
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">75%</div>
                    <div className="text-sm text-muted-foreground">Time saved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">99.9%</div>
                    <div className="text-sm text-muted-foreground">Accuracy rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">500+</div>
                    <div className="text-sm text-muted-foreground">Companies</div>
                  </div>
                </div>
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
              Ready to transform your testing workflow?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-foreground/90">
              Join construction professionals who trust ConstructTest Pro for their materials testing needs.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link to="/register">
                <Button variant="secondary" size="lg" className="bg-background text-foreground hover:bg-background/90 group">
                  Start free trial today
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
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