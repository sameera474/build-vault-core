import { Link } from 'react-router-dom';
import { CheckCircle, BarChart3, Shield, Users, FileText, Clock, ArrowRight, Star, Play, Zap, TrendingUp, Award, Target, Lightbulb, Rocket, Database, Cloud, Lock, Settings, Package, GitBranch, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import heroImage from '@/assets/hero-testing-lab.jpg';
import constructionTeam from '@/assets/construction-team.jpg';
import dashboardPreview from '@/assets/dashboard-preview.jpg';
import teamSuccess from '@/assets/team-success.jpg';

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

const howItWorks = [
  {
    step: '01',
    title: 'Create Your Project',
    description: 'Set up your construction project with all relevant details, locations, and team members in minutes.',
    icon: Target,
  },
  {
    step: '02',
    title: 'Conduct Tests',
    description: 'Perform material tests using our comprehensive templates and guided workflows for accuracy.',
    icon: FileText,
  },
  {
    step: '03',
    title: 'Generate Reports',
    description: 'Automatically generate professional, compliant reports with calculations and visualizations.',
    icon: BarChart3,
  },
  {
    step: '04',
    title: 'Collaborate & Approve',
    description: 'Share reports with your team, get approvals, and maintain complete audit trails.',
    icon: Users,
  },
];

const benefits = [
  {
    title: 'Save Time & Money',
    description: 'Reduce report generation time by 75% and eliminate manual calculation errors that cost projects thousands.',
    icon: Clock,
    stat: '75%',
    statLabel: 'Time Saved',
  },
  {
    title: 'Ensure Compliance',
    description: 'Automatically check against industry standards (ASTM, AASHTO) and maintain complete audit trails.',
    icon: Shield,
    stat: '100%',
    statLabel: 'Compliant',
  },
  {
    title: 'Improve Accuracy',
    description: 'Eliminate human errors with automated calculations and built-in quality checks.',
    icon: Award,
    stat: '99.9%',
    statLabel: 'Accurate',
  },
  {
    title: 'Scale Efficiently',
    description: 'Handle multiple projects and unlimited team members with enterprise-grade infrastructure.',
    icon: TrendingUp,
    stat: '500+',
    statLabel: 'Companies',
  },
];

const technologies = [
  { name: 'Cloud Infrastructure', icon: Cloud, description: 'Powered by enterprise-grade cloud services' },
  { name: 'Secure Database', icon: Database, description: 'Military-grade encryption for your data' },
  { name: 'API Integration', icon: GitBranch, description: 'Seamlessly integrate with your existing tools' },
  { name: 'Real-time Sync', icon: Zap, description: 'Instant updates across all devices' },
];

const testimonials = [
  {
    quote: "ConstructTest Pro has revolutionized our testing workflow. We've cut report generation time by 80% and our clients love the professional reports.",
    author: 'Sarah Johnson',
    role: 'Quality Manager',
    company: 'BuildTech Engineering',
    rating: 5,
  },
  {
    quote: "The automated compliance checking alone has saved us from countless headaches. This platform is a game-changer for construction QA.",
    author: 'Michael Chen',
    role: 'Senior Engineer',
    company: 'Pacific Construction Group',
    rating: 5,
  },
  {
    quote: "Best investment we've made for our lab. The team collaboration features and mobile app make field testing so much easier.",
    author: 'David Martinez',
    role: 'Laboratory Director',
    company: 'Premier Materials Testing',
    rating: 5,
  },
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

      {/* How It Works Section */}
      <section className="py-16 sm:py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 -z-10"></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center animate-fade-in mb-16">
            <Badge className="mb-4">Simple Process</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              How ConstructTest Pro{' '}
              <span className="text-gradient">works</span>
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-muted-foreground">
              Get started in minutes with our intuitive workflow designed for construction professionals.
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6 lg:gap-8">
            {howItWorks.map((step, index) => (
              <div
                key={step.step}
                className="relative group animate-fade-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent"></div>
                )}
                <Card className="h-full border-border/50 hover:shadow-elegant transition-smooth bg-card/80 backdrop-blur-sm">
                  <CardHeader className="text-center space-y-4">
                    <div className="mx-auto rounded-2xl bg-gradient-primary p-4 w-fit group-hover:scale-110 transition-smooth shadow-glow">
                      <step.icon className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div className="text-4xl font-bold text-gradient">{step.step}</div>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="text-base leading-relaxed">
                      {step.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link to="/register">
              <Button size="lg" className="group shadow-elegant">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
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

      {/* Benefits Section */}
      <section className="py-16 sm:py-24 lg:py-32 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center animate-fade-in mb-16">
            <Badge variant="secondary" className="mb-4">Why Choose Us</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Built for construction{' '}
              <span className="text-gradient">excellence</span>
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
              Discover how ConstructTest Pro helps teams deliver better results, faster.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {benefits.map((benefit, index) => (
              <Card
                key={benefit.title}
                className="group relative overflow-hidden border-border/50 hover:shadow-elegant transition-smooth animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-primary opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-opacity"></div>
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="rounded-xl bg-gradient-primary p-3 w-fit group-hover:scale-110 transition-smooth shadow-glow">
                      <benefit.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gradient">{benefit.stat}</div>
                      <div className="text-xs text-muted-foreground mt-1">{benefit.statLabel}</div>
                    </div>
                  </div>
                  <CardTitle className="text-xl">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-16 sm:py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background -z-10"></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-slide-in-left">
              <div className="space-y-4">
                <Badge className="mb-2">Enterprise Technology</Badge>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                  Built on{' '}
                  <span className="text-gradient">modern infrastructure</span>
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  ConstructTest Pro leverages cutting-edge technology to ensure reliability, security, and performance at scale.
                </p>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-primary opacity-10 blur-3xl rounded-3xl"></div>
                <img
                  src={teamSuccess}
                  alt="Team collaborating with ConstructTest Pro"
                  className="relative rounded-2xl object-cover w-full shadow-elegant hover-scale"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 lg:gap-6">
              {technologies.map((tech, index) => (
                <Card
                  key={tech.name}
                  className="group border-border/50 hover:shadow-elegant hover:scale-105 transition-smooth animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="space-y-4">
                    <div className="rounded-xl bg-gradient-primary p-3 w-fit group-hover:scale-110 transition-smooth shadow-glow">
                      <tech.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-lg">{tech.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {tech.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
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

      {/* Testimonials Section */}
      <section className="py-16 sm:py-24 lg:py-32 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center animate-fade-in mb-16">
            <Badge className="mb-4">Customer Stories</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Trusted by construction{' '}
              <span className="text-gradient">professionals</span>
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-muted-foreground">
              See what our customers have to say about transforming their testing workflows.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={testimonial.author}
                className="group border-border/50 hover:shadow-elegant hover:scale-105 transition-smooth animate-fade-in bg-card/80 backdrop-blur-sm"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <CardHeader className="space-y-4">
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                    ))}
                  </div>
                  <Quote className="h-8 w-8 text-primary/20" />
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-base text-muted-foreground leading-relaxed italic">
                    "{testimonial.quote}"
                  </p>
                  <div className="pt-4 border-t border-border">
                    <p className="font-semibold text-foreground">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    <p className="text-sm text-primary">{testimonial.company}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-primary -z-10"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20 -z-10"></div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-6 sm:space-y-8 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-on-primary">
              Ready to transform your{' '}
              <span className="block sm:inline">testing workflow?</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-on-primary/90 max-w-2xl mx-auto">
              Join construction professionals who trust ConstructTest Pro for their materials testing needs.
              Start your free trial today—no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/register" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-on-primary-surface text-primary hover:bg-on-primary-surface/90 hover:scale-105 transition-smooth group shadow-elegant text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6"
                >
                  Start free trial today
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/contact" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto border-2 border-on-primary/30 text-on-primary hover:bg-on-primary-surface/10 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6"
                >
                  Contact sales
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-8 text-xs sm:text-sm text-on-primary/90 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-on-primary" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-on-primary" />
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-on-primary" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}