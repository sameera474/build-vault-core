import { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().trim().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  message: z.string().trim().min(1, 'Message is required').max(1000, 'Message must be less than 1000 characters'),
});

const contactInfo = [
  {
    name: 'Email',
    description: 'Send us an email',
    contact: 'hello@constructtestpro.com',
    icon: Mail,
  },
  {
    name: 'Phone',
    description: 'Call our sales team',
    contact: '+1 (555) 123-4567',
    icon: Phone,
  },
  {
    name: 'Office',
    description: 'Visit our headquarters',
    contact: '123 Construction Ave, Engineering District',
    icon: MapPin,
  },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form data
      const validatedData = contactSchema.parse(formData);
      
      // Save to database
      const { error: dbError } = await supabase
        .from('contact_submissions')
        .insert({
          name: validatedData.name,
          email: validatedData.email,
          message: validatedData.message,
        });

      if (dbError) {
        throw dbError;
      }

      // Send confirmation email
      const { error: emailError } = await supabase.functions.invoke('send-contact-confirmation', {
        body: {
          name: validatedData.name,
          email: validatedData.email,
          message: validatedData.message,
        }
      });

      if (emailError) {
        console.error('Email error:', emailError);
        // Don't throw here - form submission was successful, email is nice-to-have
      }

      // Log to console for development
      console.log('Contact form submission saved to database:', {
        name: validatedData.name,
        email: validatedData.email,
        message: validatedData.message,
        timestamp: new Date().toISOString(),
      });

      // Show success toast
      toast({
        title: "Message sent successfully!",
        description: "We'll get back to you as soon as possible. Check your email for confirmation.",
        variant: "default",
      });

      // Reset form
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.issues[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-4xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Get in{' '}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                touch
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
              Have questions about ConstructTest Pro? Our team is here to help you streamline 
              your construction materials testing workflow.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Let's work together
              </h2>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>
              
              <div className="mt-10 space-y-6">
                {contactInfo.map((item) => (
                  <div key={item.name} className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <item.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <p className="text-sm text-foreground">{item.contact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Tell us about your testing requirements..."
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="mt-2 min-h-[120px]"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    variant="hero" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send message'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}