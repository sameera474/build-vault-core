import { Link } from 'react-router-dom';
import { Award, Users, Target, Zap, ArrowRight, Building2, Globe, TrendingUp, Shield, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import teamSuccess from '@/assets/team-success.jpg';
import constructionTeam from '@/assets/construction-team.jpg';

const values = [
  {
    name: 'Excellence',
    description: 'We strive for the highest standards in construction materials testing and reporting.',
    icon: Award,
  },
  {
    name: 'Collaboration',
    description: 'Empowering teams to work together efficiently and effectively.',
    icon: Users,
  },
  {
    name: 'Precision',
    description: 'Accurate testing and reliable data you can trust for critical decisions.',
    icon: Target,
  },
  {
    name: 'Innovation',
    description: 'Continuously improving our platform with cutting-edge technology.',
    icon: Zap,
  },
];

const stats = [
  { label: 'Active Companies', value: '500+', icon: Building2 },
  { label: 'Countries Served', value: '25+', icon: Globe },
  { label: 'Tests Processed', value: '1M+', icon: CheckCircle },
  { label: 'Uptime', value: '99.9%', icon: TrendingUp },
];

const achievements = [
  {
    title: 'Industry Recognition',
    description: 'Awarded Best Construction Software Solution 2024 by Construction Tech Magazine.',
    year: '2024',
  },
  {
    title: 'Trusted by Leaders',
    description: 'Partnered with top 10 construction firms in North America.',
    year: '2023',
  },
  {
    title: 'Global Expansion',
    description: 'Expanded operations to 25+ countries across 5 continents.',
    year: '2023',
  },
  {
    title: 'Product Launch',
    description: 'Successfully launched ConstructTest Pro with revolutionary testing automation.',
    year: '2022',
  },
];

export default function About() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden px-6 pt-14 lg:px-8">
        {/* Stylish Gradient Background like Pricing/Contact */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.1),transparent_50%)]" />
        </div>
        
        <div className="mx-auto max-w-4xl py-20 sm:py-32 lg:py-40">
          <div className="text-center space-y-8 animate-fade-in">
            <Badge className="mb-4" variant="secondary">
              Our Story
            </Badge>
            
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              About{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                ConstructTest Pro
              </span>
            </h1>
            
            <p className="mt-6 text-lg sm:text-xl leading-8 text-muted-foreground max-w-2xl mx-auto">
              We're revolutionizing construction materials testing with modern technology, 
              making it easier for engineering teams to ensure quality and compliance 
              across all their projects.
            </p>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="animate-scale-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Card className="text-center border-border/50 hover:shadow-elegant transition-smooth bg-card/80 backdrop-blur-sm">
                    <CardContent className="pt-6 space-y-2">
                      <stat.icon className="h-8 w-8 mx-auto text-primary mb-2" />
                      <div className="text-3xl font-bold text-gradient">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 sm:py-32 bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-slide-in-left">
              <div className="space-y-4">
                <Badge variant="secondary">Our Mission</Badge>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Transforming construction{' '}
                  <span className="text-gradient">testing</span>
                </h2>
                <p className="text-lg leading-8 text-muted-foreground">
                  Our mission is to provide construction professionals with the most advanced, 
                  user-friendly platform for materials testing management. We believe that 
                  accurate testing data and streamlined workflows are essential for building 
                  safer, more durable infrastructure.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 mt-1">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Safety First</h3>
                    <p className="text-muted-foreground">Ensuring structural integrity through accurate testing and reliable data.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 mt-1">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Efficiency</h3>
                    <p className="text-muted-foreground">Streamlining workflows to save time and reduce costs across projects.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 mt-1">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Quality Excellence</h3>
                    <p className="text-muted-foreground">Maintaining the highest standards in testing and reporting accuracy.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group animate-fade-in">
              <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-3xl group-hover:opacity-30 transition-opacity"></div>
              <img
                src={constructionTeam}
                alt="Construction professionals using ConstructTest Pro"
                className="relative rounded-2xl object-cover w-full shadow-elegant hover-scale"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center animate-fade-in mb-16">
            <Badge className="mb-4">Our Values</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              What drives us{' '}
              <span className="text-gradient">forward</span>
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              These core values guide everything we do, from product development to customer support.
            </p>
          </div>
          <div className="mx-auto max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-6 lg:max-w-none lg:grid-cols-2">
              {values.map((value, index) => (
                <Card
                  key={value.name}
                  className="border-border/50 hover:shadow-elegant transition-smooth animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-gradient-primary p-3 shadow-glow">
                        <value.icon className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
                      </div>
                      <CardTitle className="text-xl">{value.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {value.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 sm:py-32 bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-none lg:grid lg:grid-cols-2 lg:gap-x-16 lg:gap-y-6 xl:grid-cols-1 xl:grid-rows-1 xl:gap-x-8">
            <div className="space-y-8 animate-slide-in-left">
              <div>
                <Badge className="mb-4">Our Journey</Badge>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Our <span className="text-gradient">Story</span>
                </h2>
              </div>
              <div className="space-y-6 text-lg leading-8 text-muted-foreground">
                <p>
                  Founded by construction industry veterans, ConstructTest Pro was born from 
                  the frustration of managing testing data across spreadsheets, paper forms, 
                  and disconnected systems. We saw an opportunity to bring modern technology 
                  to an industry that deserves better tools.
                </p>
                <p>
                  Today, we serve construction companies, engineering firms, and testing 
                  laboratories around the world, helping them streamline their workflows, 
                  improve accuracy, and make data-driven decisions that lead to better 
                  construction outcomes.
                </p>
                <p>
                  As we continue to grow, our commitment remains the same: to provide the 
                  most reliable, intuitive, and comprehensive platform for construction 
                  materials testing management.
                </p>
              </div>
            </div>
            <div className="relative group animate-fade-in mt-10 lg:mt-0">
              <div className="absolute inset-0 bg-gradient-primary opacity-10 blur-3xl rounded-3xl"></div>
              <img
                src={teamSuccess}
                alt="ConstructTest Pro team celebrating success"
                className="relative aspect-[6/5] w-full max-w-lg rounded-2xl object-cover shadow-elegant hover-scale xl:row-span-2 xl:row-end-2"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Timeline/Achievements Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center animate-fade-in mb-16">
            <Badge variant="secondary" className="mb-4">Milestones</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Our <span className="text-gradient">achievements</span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              Key milestones in our journey to revolutionize construction testing.
            </p>
          </div>

          <div className="space-y-8 max-w-3xl mx-auto">
            {achievements.map((achievement, index) => (
              <div
                key={achievement.title}
                className="relative pl-8 pb-8 border-l-2 border-primary/20 last:border-l-0 last:pb-0 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-primary shadow-glow"></div>
                <div className="flex items-center gap-4 mb-2">
                  <Badge variant="outline" className="font-mono">{achievement.year}</Badge>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{achievement.title}</h3>
                <p className="text-muted-foreground">{achievement.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-primary">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
        <div className="relative px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center animate-fade-in">
            <h2 className="text-3xl font-bold tracking-tight text-on-primary sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-on-primary/90">
              Join thousands of construction professionals who trust ConstructTest Pro for accurate testing and streamlined workflows.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto bg-on-primary-surface text-primary hover:bg-on-primary-surface/90 hover:scale-105 transition-smooth group shadow-elegant">
                  Start your free trial
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-on-primary/30 text-on-primary hover:bg-on-primary-surface/10">
                  Contact us
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 text-sm text-on-primary/90 pt-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-on-primary" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-on-primary" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}