import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Building2, User, Mail, Lock, Phone, Briefcase, MapPin, HardHat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { getRoleRedirect } from '@/lib/rbac';

interface Company {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  city: string | null;
  country: string | null;
}

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  role: z.string().default('admin'),
  companyOption: z.enum(['existing', 'new']),
  existingCompanyId: z.string().optional(),
  newCompanyName: z.string().optional(),
  newCompanyDescription: z.string().optional(),
  newCompanyWebsite: z.string().optional(),
  newCompanyCity: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.companyOption === 'existing') {
    return data.existingCompanyId && data.existingCompanyId.length > 0;
  }
  return data.newCompanyName && data.newCompanyName.length > 0;
}, {
  message: "Company selection or name is required",
  path: ["companyOption"],
});

export default function Register() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    jobTitle: '',
    department: '',
    role: 'admin',
    companyOption: 'existing' as 'existing' | 'new',
    existingCompanyId: '',
    newCompanyName: '',
    newCompanyDescription: '',
    newCompanyWebsite: '',
    newCompanyCity: '',
  });

  // Redirect already authenticated users away from register page
  useEffect(() => {
    if (!authLoading && user) {
      let redirectPath = '/dashboard';
      if (profile?.is_super_admin) {
        redirectPath = '/super-admin';
      } else if (profile?.tenant_role) {
        redirectPath = getRoleRedirect(profile.tenant_role);
      }
      navigate(redirectPath, { replace: true });
    }
  }, [user, profile, authLoading, navigate]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, description, website, city, country')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: "Warning",
        description: "Could not load companies. You can still create a new company.",
        variant: "destructive",
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      const validatedData = registerSchema.parse(formData);

      // Prepare metadata for Supabase
      const metadata: Record<string, any> = {
        name: validatedData.name,
        role: validatedData.role,
        phone: validatedData.phone || '',
        job_title: validatedData.jobTitle || '',
        department: validatedData.department || '',
      };

      // Add company information based on selection
      if (validatedData.companyOption === 'existing') {
        metadata.company_id = validatedData.existingCompanyId;
      } else {
        metadata.company_name = validatedData.newCompanyName;
        metadata.company_description = validatedData.newCompanyDescription || '';
        metadata.company_website = validatedData.newCompanyWebsite || '';
        metadata.company_city = validatedData.newCompanyCity || '';
      }

      const redirectUrl = `${window.location.origin}/dashboard`;

      const { error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: metadata,
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Registration successful!",
        description: "Please check your email to verify your account.",
      });

      navigate('/signin');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.issues[0]?.message || "Please check your input",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration failed",
          description: error.message || "An error occurred during registration",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Don't render the form if user is authenticated (will redirect)
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <HardHat className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">ConstructTest Pro</h1>
          </div>
          <CardTitle>Create Your Account</CardTitle>
          <CardDescription>
            Join thousands of construction professionals using our testing platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    placeholder="John Smith"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    placeholder="john@company.com"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    placeholder="Minimum 8 characters"
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                    placeholder="Repeat your password"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+27 12 345 6789"
                  />
                </div>
                
                <div>
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    placeholder="Site Engineer, Lab Technician, etc."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="Quality Control, Testing, Engineering, etc."
                />
              </div>
            </div>

            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </h3>

              <Tabs 
                value={formData.companyOption} 
                onValueChange={(value) => handleInputChange('companyOption', value)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="existing">Join Existing Company</TabsTrigger>
                  <TabsTrigger value="new">Create New Company</TabsTrigger>
                </TabsList>
                
                <TabsContent value="existing" className="space-y-4">
                  <div>
                    <Label htmlFor="existingCompany">Select Your Company *</Label>
                    {loadingCompanies ? (
                      <div className="flex items-center justify-center h-10 border rounded-md">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      </div>
                    ) : (
                      <Select 
                        value={formData.existingCompanyId}
                        onValueChange={(value) => handleInputChange('existingCompanyId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a company from the list" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{company.name}</span>
                                {company.description && (
                                  <span className="text-sm text-muted-foreground">
                                    {company.description}
                                  </span>
                                )}
                                {company.city && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {company.city}, {company.country}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      Select your company from the list of registered organizations
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="new" className="space-y-4">
                  <div>
                    <Label htmlFor="newCompanyName">Company Name *</Label>
                    <Input
                      id="newCompanyName"
                      type="text"
                      value={formData.newCompanyName}
                      onChange={(e) => handleInputChange('newCompanyName', e.target.value)}
                      placeholder="ABC Construction Ltd"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="newCompanyDescription">Company Description</Label>
                    <Textarea
                      id="newCompanyDescription"
                      value={formData.newCompanyDescription}
                      onChange={(e) => handleInputChange('newCompanyDescription', e.target.value)}
                      placeholder="Brief description of your company's services and expertise"
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="newCompanyWebsite">Website</Label>
                      <Input
                        id="newCompanyWebsite"
                        type="url"
                        value={formData.newCompanyWebsite}
                        onChange={(e) => handleInputChange('newCompanyWebsite', e.target.value)}
                        placeholder="https://www.company.com"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="newCompanyCity">City</Label>
                      <Input
                        id="newCompanyCity"
                        type="text"
                        value={formData.newCompanyCity}
                        onChange={(e) => handleInputChange('newCompanyCity', e.target.value)}
                        placeholder="Johannesburg, Cape Town, etc."
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/signin" className="text-primary hover:underline font-medium">
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}