import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ImageUpload } from '@/components/projects/ImageUpload';
import { ProjectRoads } from '@/components/projects/ProjectRoads';
import { ProjectRoles } from '@/components/projects/ProjectRoles';
import { ArrowLeft, Save, Building, Users, MapPin, Settings, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { projectService } from '@/services/projectService';
import { toast } from '@/hooks/use-toast';
import type { Project } from '@/services/projectService';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  contract_number: z.string().max(100).optional(),
  contractor_name: z.string().max(255).optional(),
  client_name: z.string().max(255).optional(),
  consultant_name: z.string().max(255).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  project_prefix: z.string().max(10).optional(),
  region_code: z.string().max(10).optional(),
  lab_code: z.string().max(10).optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface Company {
  id: string;
  name: string;
}

interface ProjectFormProps {
  project?: Project | null;
  onSave: (data: Partial<Project> & { company_id: string }) => void;
  onCancel: () => void;
  saveError?: string | null;
}

export function ProjectForm({ project, onSave, onCancel, saveError }: ProjectFormProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [companyId, setCompanyId] = useState<string>(project?.company_id || '');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [logoUrls, setLogoUrls] = useState({
    contractor_logo: project?.contractor_logo || '',
    client_logo: project?.client_logo || '',
    consultant_logo: project?.consultant_logo || '',
  });

  const isSuper = (profile as any)?.is_super_admin;

  // Initialize active tab from query param if provided (e.g., ?tab=roads)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, []);

  // Set company_id for non-super admin users
  useEffect(() => {
    if (!isSuper && profile?.company_id) {
      setCompanyId(profile.company_id);
    }
  }, [isSuper, profile]);

  // Fetch companies for super admin
  useEffect(() => {
    if (isSuper) {
      fetchCompanies();
    }
  }, [isSuper]);

  const fetchCompanies = async () => {
    try {
      const companiesData = await projectService.fetchAllCompanies();
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: "Error",
        description: "Failed to load companies",
        variant: "destructive",
      });
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name || '',
      contract_number: project?.contract_number || '',
      contractor_name: project?.contractor_name || '',
      client_name: project?.client_name || '',
      consultant_name: project?.consultant_name || '',
      description: project?.description || '',
      location: project?.location || '',
      start_date: project?.start_date || '',
      end_date: project?.end_date || '',
      project_prefix: project?.project_prefix || 'PU2',
      region_code: project?.region_code || 'R1',
      lab_code: project?.lab_code || 'LAB',
    }
  });

  const onSubmit = async (data: ProjectFormData) => {
    if (!companyId) {
      toast({
        title: "Error",
        description: "Please select a company",
        variant: "destructive",
      });
      return;
    }

    console.log('Form submission data:', data);
    console.log('Logo URLs:', logoUrls);
    await onSave({
      ...data,
      ...logoUrls,
      company_id: companyId,
    });
  };

  const handleLogoUpload = (type: keyof typeof logoUrls, url: string) => {
    setLogoUrls(prev => ({ ...prev, [type]: url }));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {project ? 'Edit Project' : 'Create New Project'}
            </h1>
            <p className="text-muted-foreground">
              {project 
                ? 'Update project details and manage team assignments' 
                : 'Set up a new construction project with all necessary details'
              }
            </p>
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Saving...' : 'Save Project'}
        </Button>
      </div>

      {/* Error Alert - Shows detailed Supabase errors */}
      {saveError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to Save Project</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="font-mono text-sm">{saveError}</p>
            <p className="mt-2 text-sm">
              If you continue to see this error, please check:
            </p>
            <ul className="list-disc list-inside text-sm mt-1 space-y-1">
              <li>You have permission to create projects</li>
              <li>All required fields are filled correctly</li>
              <li>Your account and company settings are configured properly</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="roads" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Roads
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isSuper && (
                  <div className="space-y-2">
                    <Label htmlFor="company">Company *</Label>
                    <Select value={companyId} onValueChange={setCompanyId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name *</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="Enter project name"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contract_number">Contract Number *</Label>
                    <Input
                      id="contract_number"
                      {...register('contract_number')}
                      placeholder="Enter contract number"
                    />
                    {errors.contract_number && (
                      <p className="text-sm text-destructive">{errors.contract_number.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      {...register('location')}
                      placeholder="Project location"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder="Project description"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      {...register('start_date')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      {...register('end_date')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stakeholders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Contractor */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Contractor Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="contractor_name">Contractor Name *</Label>
                      <Input
                        id="contractor_name"
                        {...register('contractor_name')}
                        placeholder="Enter contractor name"
                      />
                      {errors.contractor_name && (
                        <p className="text-sm text-destructive">{errors.contractor_name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Contractor Logo</Label>
                      <ImageUpload
                        value={logoUrls.contractor_logo}
                        onUpload={(url) => handleLogoUpload('contractor_logo', url)}
                        folder="contractor"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Client */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Client Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="client_name">Client Name *</Label>
                      <Input
                        id="client_name"
                        {...register('client_name')}
                        placeholder="Enter client name"
                      />
                      {errors.client_name && (
                        <p className="text-sm text-destructive">{errors.client_name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Client Logo</Label>
                      <ImageUpload
                        value={logoUrls.client_logo}
                        onUpload={(url) => handleLogoUpload('client_logo', url)}
                        folder="client"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Consultant */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Consultant Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="consultant_name">Consultant Name *</Label>
                      <Input
                        id="consultant_name"
                        {...register('consultant_name')}
                        placeholder="Enter consultant name"
                      />
                      {errors.consultant_name && (
                        <p className="text-sm text-destructive">{errors.consultant_name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Consultant Logo</Label>
                      <ImageUpload
                        value={logoUrls.consultant_logo}
                        onUpload={(url) => handleLogoUpload('consultant_logo', url)}
                        folder="consultant"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roads" className="space-y-6">
            {project && <ProjectRoads projectId={project.id} />}
            {!project && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    Save the project first to manage roads
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            {project && <ProjectRoles projectId={project.id} />}
            {!project && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    Save the project first to assign team members
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Report Numbering Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="project_prefix">Project Prefix *</Label>
                    <Input
                      id="project_prefix"
                      {...register('project_prefix')}
                      placeholder="e.g., PU2"
                      maxLength={10}
                    />
                    {errors.project_prefix && (
                      <p className="text-sm text-destructive">{errors.project_prefix.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region_code">Region Code *</Label>
                    <Input
                      id="region_code"
                      {...register('region_code')}
                      placeholder="e.g., R1"
                      maxLength={10}
                    />
                    {errors.region_code && (
                      <p className="text-sm text-destructive">{errors.region_code.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lab_code">Lab Code *</Label>
                    <Input
                      id="lab_code"
                      {...register('lab_code')}
                      placeholder="e.g., LAB"
                      maxLength={10}
                    />
                    {errors.lab_code && (
                      <p className="text-sm text-destructive">{errors.lab_code.message}</p>
                    )}
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Report Number Preview</h4>
                  <p className="text-sm text-muted-foreground">
                    Reports will be numbered as: <code className="bg-background px-2 py-1 rounded">
                      {watch('project_prefix') || 'PU2'}-{watch('region_code') || 'R1'}-{watch('lab_code') || 'LAB'}-[DOC_CODE]-[YYMMDD]-[SEQ]
                    </code>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Example: PU2-R1-LAB-FD-250127-01
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </form>
  );
}