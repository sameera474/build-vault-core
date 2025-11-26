import { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().trim().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  company: z.string().trim().max(100, 'Company name must be less than 100 characters').optional(),
  phone: z.string().trim().max(20, 'Phone must be less than 20 characters').optional(),
  message: z.string().trim().min(1, 'Message is required').max(1000, 'Message must be less than 1000 characters'),
});

const contactInfo = [
  {
    name: 'Email Us',
    description: 'Reach out anytime',
    contact: 'hello@constructtestpro.com',
    icon: Mail,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
  },
  {
    name: 'Call Us',
    description: 'Mon-Fri 9am-6pm EST',
    contact: '+1 (555) 123-4567',
    icon: Phone,
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-500',
  },
  {
    name: 'Visit Us',
    description: 'Our headquarters',
    contact: '123 Construction Ave\nEngineering District, CA 94105',
    icon: MapPin,
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
  },
];

const faqs = [
  {
    question: 'How quickly will I get a response?',
    answer: 'We typically respond to all inquiries within 24 hours during business days.',
  },
  {
    question: 'Can I schedule a demo?',
    answer: 'Yes! Contact us and our team will set up a personalized demo at your convenience.',
  },
  {
    question: 'Do you offer training?',
    answer: 'All plans include comprehensive onboarding and training for your team.',
  },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validatedData = contactSchema.parse(formData);
      
      const { error: dbError } = await supabase
        .from('contact_submissions')
        .insert({
          name: validatedData.name,
          email: validatedData.email,
          company: validatedData.company,
          phone: validatedData.phone,
          message: validatedData.message,
        });

      if (dbError) throw dbError;

      console.log('Contact form submission:', validatedData);

      toast({
        title: "Message sent successfully!",
        description: "We'll get back to you as soon as possible.",
      });

      setFormData({ name: '', email: '', company: '', phone: '', message: '' });
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
    <div className="bg-background min-h-screen">
      {/* Hero Section with animated gradient */}
      <section className="relative isolate overflow-hidden px-6 pt-14 lg:px-8">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.1),transparent_50%)]" />
        </div>
        
        <div className="mx-auto max-w-4xl py-20 sm:py-32 lg:py-40">
          <div className="text-center space-y-8 animate-fade-in">
            <Badge className="mb-4 text-sm" variant="secondary">
              <MessageSquare className="h-3 w-3 mr-1" />
              We're here to help
            </Badge>
            
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              Let's{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                talk
              </span>
            </h1>
            
            <p className="mt-6 text-lg sm:text-xl leading-8 text-muted-foreground max-w-2xl mx-auto">
              Have questions about ConstructTest Pro? We're here to help you transform
              your construction materials testing workflow.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Response within 24h</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Free consultation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>No commitment</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
            {/* Left Column - Contact Info & FAQs */}
            <div className="lg:col-span-2 space-y-12">
              {/* Contact Methods */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Contact Information
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    Reach out through any of these channels
                  </p>
                </div>
                
                <div className="space-y-4">
                  {contactInfo.map((item, index) => (
                    <Card
                      key={item.name}
                      className="group border-border/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start gap-4">
                          <div className={`rounded-xl ${item.iconBg} p-3 group-hover:scale-110 transition-transform duration-300`}>
                            <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-foreground">{item.name}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                            <p className="text-sm text-foreground mt-2 whitespace-pre-line">{item.contact}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Business Hours */}
              <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Business Hours</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monday - Friday</span>
                    <span className="font-medium">9:00 AM - 6:00 PM EST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saturday</span>
                    <span className="font-medium">10:00 AM - 2:00 PM EST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sunday</span>
                    <span className="font-medium">Closed</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick FAQs */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Quick Answers</h3>
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-border/50 bg-card/50 hover:bg-card transition-colors animate-fade-in"
                    style={{ animationDelay: `${(index + 3) * 100}ms` }}
                  >
                    <h4 className="font-medium text-foreground text-sm mb-1">{faq.question}</h4>
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div className="lg:col-span-3">
              <Card className="border-border/50 shadow-2xl sticky top-24">
                <CardHeader>
                  <CardTitle className="text-2xl">Send us a message</CardTitle>
                  <CardDescription className="text-base">
                    Fill out the form below and we'll get back to you within 24 hours.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">
                          Full Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="h-11"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email Address <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="john@company.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="company" className="text-sm font-medium">
                          Company Name
                        </Label>
                        <Input
                          id="company"
                          name="company"
                          type="text"
                          placeholder="Your Company"
                          value={formData.company}
                          onChange={handleChange}
                          className="h-11"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={formData.phone}
                          onChange={handleChange}
                          className="h-11"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium">
                        Message <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Tell us about your testing requirements, questions, or how we can help..."
                        value={formData.message}
                        onChange={handleChange}
                        required
                        className="min-h-[160px] resize-none"
                      />
                      <p className="text-xs text-muted-foreground">
                        {formData.message.length}/1000 characters
                      </p>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base font-medium group"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="animate-pulse">Sending...</span>
                        </>
                      ) : (
                        <>
                          Send Message
                          <Send className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </Button>
                    
                    <p className="text-xs text-center text-muted-foreground">
                      By submitting this form, you agree to our privacy policy and terms of service.
                    </p>
                  </form>
                </CardContent>
              </Card>
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
            Prefer a live conversation?
          </h2>
          <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
            Schedule a personalized demo and see how ConstructTest Pro can transform your testing workflow.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="h-12 px-8 text-base font-medium hover:scale-105 transition-transform"
          >
            Schedule a Demo
          </Button>
        </div>
      </section>
    </div>
  );
}
