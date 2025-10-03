import { Link } from 'react-router-dom';
import { CheckCircle, BarChart3, Shield, Users, FileText, Clock, ArrowRight, Star, Play, Zap, TrendingUp, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
      {/* Hero Section with Video */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10"></div>
          <video
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover opacity-30"
            poster={heroImage}
          >
            <source src="https://assets.mixkit.co/videos/preview/mixkit-construction-site-workers-14293-large.mp4" type="video/mp4" />
            <img src={heroImage} alt="Professional construction materials testing laboratory" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-primary/20 z-5"></div>
        </div>

        <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-6 sm:space-y-8 text-center lg:text-left animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-2 rounded-full bg-primary/10 border border-primary/20">
                <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                <span className="text-xs sm:text-sm font-medium text-primary">Trusted by 500+ Companies</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight">
                <span className="block text-foreground">Professional</span>
                <span className="block bg-gradient-primary bg-clip-text text-transparent mt-2">
                  Construction Testing
                </span>
                <span className="block text-foreground mt-2">Management</span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                Streamline your construction materials testing with AI-powered analytics, 
                real-time collaboration, and automated compliance tracking.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                <Link to="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-primary hover:opacity-90 text-primary-foreground group shadow-elegant">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/about" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto group border-2">
                    <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:scale-110" />
                    Watch Demo
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  <span className="whitespace-nowrap">14-day trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  <span className="whitespace-nowrap">No credit card</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  <span className="whitespace-nowrap">Cancel anytime</span>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-center lg:justify-start gap-3 pt-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-accent text-accent" />
                  ))}
                </div>
                <span className="text-xs sm:text-sm font-medium">4.9/5 from 500+ reviews</span>
              </div>
            </div>

            {/* Right Column - Dashboard Preview */}
            <div className="relative animate-scale-in hidden lg:block">
              <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-full"></div>
              <img
                src={dashboardPreview}
                alt="ConstructTest Pro dashboard interface"
                className="relative rounded-2xl shadow-elegant ring-1 ring-border hover-scale w-full"
              />
              <div className="absolute -bottom-6 -left-6 bg-card p-4 sm:p-6 rounded-xl shadow-lg border border-border">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Time Saved</p>
                    <p className="text-lg sm:text-2xl font-bold">75%</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 bg-card p-4 sm:p-6 rounded-xl shadow-lg border border-border">
                <div className="flex items-center gap-3">
                  <Award className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Accuracy</p>
                    <p className="text-lg sm:text-2xl font-bold">99.9%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden sm:block">
          <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-primary rounded-full animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 lg:py-32 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center animate-fade-in">
            <Badge className="mb-4">Everything you need</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Professional testing made{' '}
              <span className="bg-gradient-primary bg-clip-text text-transparent">simple</span>
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
              Our platform provides all the tools you need to manage construction materials testing 
              efficiently and accurately.
            </p>
          </div>
          <div className="mx-auto mt-12 sm:mt-16 lg:mt-20 max-w-7xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {features.map((feature, index) => (
                <Card 
                  key={feature.name} 
                  className="group border-border/50 hover:shadow-elegant hover:scale-105 transition-smooth bg-card/50 backdrop-blur-sm"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="space-y-3 sm:space-y-4">
                    <div className="rounded-xl bg-gradient-primary p-2.5 sm:p-3 w-fit group-hover:scale-110 transition-smooth shadow-glow">
                      <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-base sm:text-lg">{feature.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm sm:text-base leading-relaxed">
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
      <section className="py-16 sm:py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background -z-10"></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center animate-fade-in">
            <Badge variant="secondary" className="mb-4">Material Types</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Comprehensive testing{' '}
              <span className="bg-gradient-primary bg-clip-text text-transparent">coverage</span>
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
              Support for all major construction materials with industry-standard testing protocols.
            </p>
          </div>
          <div className="mx-auto mt-12 sm:mt-16 lg:mt-20 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-5xl">
            {materials.map((material, index) => (
              <Card 
                key={material.name} 
                className="group border-border/50 hover:shadow-elegant hover:scale-105 transition-smooth bg-gradient-to-br from-card to-card/50"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl group-hover:text-primary transition-colors">
                    {material.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm sm:text-base leading-relaxed">
                    {material.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 sm:py-24 bg-muted/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12 sm:mb-16">
            <Badge className="mb-4">Trusted by industry leaders</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Join construction professionals{' '}
              <span className="bg-gradient-primary bg-clip-text text-transparent">worldwide</span>
            </h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-2xl rounded-3xl group-hover:opacity-30 transition-opacity"></div>
              <img
                src={constructionTeam}
                alt="Construction team using ConstructTest Pro"
                className="relative rounded-2xl sm:rounded-3xl object-cover w-full shadow-elegant hover-scale"
              />
            </div>
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                  Streamlined workflows that deliver results
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Our platform has transformed how engineering teams manage materials testing, 
                  reducing report generation time by 75% and improving accuracy across all projects.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center p-4 sm:p-6 rounded-xl bg-card border border-border hover:shadow-md transition-smooth">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">75%</div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">Time saved</div>
                </div>
                <div className="text-center p-4 sm:p-6 rounded-xl bg-card border border-border hover:shadow-md transition-smooth">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">99.9%</div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">Accuracy</div>
                </div>
                <div className="text-center p-4 sm:p-6 rounded-xl bg-card border border-border hover:shadow-md transition-smooth">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">500+</div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">Companies</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-primary -z-10"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20 -z-10"></div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-6 sm:space-y-8 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-primary-foreground">
              Ready to transform your{' '}
              <span className="block sm:inline">testing workflow?</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Join construction professionals who trust ConstructTest Pro for their materials testing needs.
              Start your free trial today—no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/register" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-background text-foreground hover:bg-background/90 hover:scale-105 transition-smooth group shadow-elegant text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6"
                >
                  Start free trial today
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/contact" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto border-2 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6"
                >
                  Contact sales
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-8 text-xs sm:text-sm text-primary-foreground/80 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}