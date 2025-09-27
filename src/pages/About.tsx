import { Link } from 'react-router-dom';
import { Award, Users, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

export default function About() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-4xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              About{' '}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                ConstructTest Pro
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-3xl mx-auto">
              We're revolutionizing construction materials testing with modern technology, 
              making it easier for engineering teams to ensure quality and compliance 
              across all their projects.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 sm:py-32 bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary">Our Mission</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Transforming construction testing
            </p>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Our mission is to provide construction professionals with the most advanced, 
              user-friendly platform for materials testing management. We believe that 
              accurate testing data and streamlined workflows are essential for building 
              safer, more durable infrastructure.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-accent">Our Values</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              What drives us forward
            </p>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              These core values guide everything we do, from product development to customer support.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
              {values.map((value) => (
                <Card key={value.name} className="border-border/50 hover:shadow-md transition-smooth">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <value.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                      </div>
                      <CardTitle className="text-xl">{value.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
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
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-center">
              Our Story
            </h2>
            <div className="mt-8 space-y-6 text-lg leading-8 text-muted-foreground">
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
              Join thousands of construction professionals who trust ConstructTest Pro.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link to="/register">
                <Button variant="secondary" size="lg" className="bg-background text-foreground hover:bg-background/90">
                  Start your free trial
                </Button>
              </Link>
              <Link to="/contact" className="text-sm font-semibold leading-6 text-primary-foreground hover:text-primary-foreground/80 transition-smooth">
                Contact us <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}