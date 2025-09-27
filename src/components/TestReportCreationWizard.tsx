import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Calendar, 
  User, 
  ClipboardList, 
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { reportService } from '@/services/reportService';

interface Project {
  id: string;
  name: string;
  description?: string;
  location?: string;
}

interface TestReportData {
  // Step 1: Project Information
  project_id: string;
  project_name: string;
  location: string;
  road_name: string;
  chainage_from: string;
  chainage_to: string;
  test_date: string;
  test_time: string;
  test_type: string;
  technician_name: string;
  technician_id: string;
  weather_conditions: string;
  site_conditions: string;
  
  // Step 2: Test Data (will be filled in test entry screen)
  test_data: Record<string, any>;
  
  // Step 3: Summary (auto-calculated)
  calculated_results: Record<string, any>;
  compliance_status: 'pass' | 'fail' | 'pending';
  remarks: string;
}

interface TestTypeConfig {
  name: string;
  description: string;
  fields: Array<{
    key: string;
    label: string;
    type: 'number' | 'text' | 'select';
    unit?: string;
    required?: boolean;
    options?: string[];
  }>;
  calculations: Record<string, string>;
}

const TEST_TYPES: Record<string, TestTypeConfig> = {
  'sand_cone': {
    name: 'Sand Cone Test',
    description: 'Field density test using sand cone method',
    fields: [
      { key: 'weight_sand_apparatus', label: 'Weight of Sand + Apparatus', type: 'number', unit: 'kg', required: true },
      { key: 'weight_sand_after_filling', label: 'Weight of Sand after Filling Hole', type: 'number', unit: 'kg', required: true },
      { key: 'moisture_content', label: 'Moisture Content', type: 'number', unit: '%', required: true },
      { key: 'wet_density', label: 'Wet Bulk Density', type: 'number', unit: 'kg/m³' },
      { key: 'dry_density', label: 'Dry Bulk Density', type: 'number', unit: 'kg/m³' },
    ],
    calculations: {
      dry_density: 'wet_density / (1 + moisture_content/100)',
      degree_compaction: '(dry_density / max_dry_density) * 100'
    }
  },
  'field_density': {
    name: 'Field Density Test',
    description: 'Standard field density determination',
    fields: [
      { key: 'max_dry_density', label: 'Maximum Dry Density (Lab)', type: 'number', unit: 'kg/m³', required: true },
      { key: 'optimum_moisture', label: 'Optimum Moisture Content', type: 'number', unit: '%', required: true },
      { key: 'field_moisture', label: 'Field Moisture Content', type: 'number', unit: '%', required: true },
      { key: 'field_density', label: 'Field Density', type: 'number', unit: 'kg/m³', required: true },
    ],
    calculations: {
      degree_compaction: '(field_density / max_dry_density) * 100'
    }
  },
  'compaction': {
    name: 'Compaction Test',
    description: 'Standard Proctor or Modified Proctor test',
    fields: [
      { key: 'test_method', label: 'Test Method', type: 'select', options: ['Standard Proctor', 'Modified Proctor'], required: true },
      { key: 'sample_mass', label: 'Sample Mass', type: 'number', unit: 'kg', required: true },
      { key: 'mold_volume', label: 'Mold Volume', type: 'number', unit: 'cm³', required: true },
      { key: 'wet_mass', label: 'Wet Mass of Soil', type: 'number', unit: 'kg', required: true },
      { key: 'moisture_content', label: 'Moisture Content', type: 'number', unit: '%', required: true },
    ],
    calculations: {
      wet_density: 'wet_mass / mold_volume * 1000',
      dry_density: 'wet_density / (1 + moisture_content/100)'
    }
  }
};

interface TestReportCreationWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function TestReportCreationWizard({ open, onClose, onSuccess }: TestReportCreationWizardProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [data, setData] = useState<TestReportData>({
    project_id: '',
    project_name: '',
    location: '',
    road_name: '',
    chainage_from: '',
    chainage_to: '',
    test_date: new Date().toISOString().split('T')[0],
    test_time: new Date().toTimeString().slice(0, 5),
    test_type: '',
    technician_name: '',
    technician_id: '',
    weather_conditions: '',
    site_conditions: '',
    test_data: {},
    calculated_results: {},
    compliance_status: 'pending',
    remarks: ''
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    if (open) {
      fetchProjects();
    }
  }, [open]);

  const fetchProjects = async () => {
    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('company_id', profile?.company_id)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setProjects(projects || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    }
  };

  const handleNext = () => {
    if (isStepValid() && currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isStepValid()) return;

    try {
      setLoading(true);
      
      // Calculate results based on test type
      const calculatedResults = calculateTestResults();
      
      const reportData = {
        project_id: data.project_id,
        material: 'soil' as const, // Default, could be made dynamic
        test_type: data.test_type,
        road_name: data.road_name,
        chainage_from: data.chainage_from,
        chainage_to: data.chainage_to,
        test_date: data.test_date,
        technician_name: data.technician_name,
        status: 'draft' as const,
        data_json: data.test_data,
        summary_json: {
          calculated_results: calculatedResults,
          weather_conditions: data.weather_conditions,
          site_conditions: data.site_conditions,
          technician_id: data.technician_id,
          remarks: data.remarks
        }
      };

      const report = await reportService.createReport(reportData);
      
      toast({
        title: "Success",
        description: "Test report created successfully",
      });
      
      onClose();
      onSuccess?.();
      navigate(`/test-reports/${report.id}/edit`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create test report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTestResults = () => {
    const testConfig = TEST_TYPES[data.test_type];
    if (!testConfig) return {};

    const results: Record<string, number> = {};
    
    // Perform calculations based on test type
    Object.entries(testConfig.calculations).forEach(([key, formula]) => {
      try {
        // Simple calculation engine - in production, use a proper expression evaluator
        let expression = formula;
        Object.entries(data.test_data).forEach(([field, value]) => {
          expression = expression.replace(new RegExp(field, 'g'), value?.toString() || '0');
        });
        
        // Evaluate simple mathematical expressions
        if (/^[\d\s+\-*/().]+$/.test(expression)) {
          results[key] = eval(expression);
        }
      } catch (error) {
        console.error(`Error calculating ${key}:`, error);
      }
    });

    // Determine compliance status
    let complianceStatus: 'pass' | 'fail' | 'pending' = 'pending';
    if (results.degree_compaction) {
      complianceStatus = results.degree_compaction >= 95 ? 'pass' : 'fail';
    }

    return { ...results, compliance_status: complianceStatus };
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return !!(data.project_id && data.road_name && data.chainage_from && data.chainage_to && 
                 data.test_date && data.test_type && data.technician_name);
      case 2:
        const testConfig = TEST_TYPES[data.test_type];
        if (!testConfig) return false;
        return testConfig.fields.filter(f => f.required).every(field => 
          data.test_data[field.key] !== undefined && data.test_data[field.key] !== ''
        );
      case 3:
        return true; // Summary is auto-generated
      case 4:
        return true; // Final review
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 text-lg font-semibold">
              <FileText className="h-5 w-5" />
              <span>General Project Information</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project">Project *</Label>
                <Select 
                  value={data.project_id} 
                  onValueChange={(value) => {
                    const project = projects.find(p => p.id === value);
                    setData(prev => ({ 
                      ...prev, 
                      project_id: value,
                      project_name: project?.name || '',
                      location: project?.location || ''
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={data.location}
                    onChange={(e) => setData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Project location"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="road_name">Road Name *</Label>
                <Input
                  value={data.road_name}
                  onChange={(e) => setData(prev => ({ ...prev, road_name: e.target.value }))}
                  placeholder="e.g., A1 Highway"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="test_type">Test Type *</Label>
                <Select 
                  value={data.test_type} 
                  onValueChange={(value) => setData(prev => ({ ...prev, test_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select test type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEST_TYPES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="chainage_from">Chainage From *</Label>
                <Input
                  value={data.chainage_from}
                  onChange={(e) => setData(prev => ({ ...prev, chainage_from: e.target.value }))}
                  placeholder="e.g., 1+010"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="chainage_to">Chainage To *</Label>
                <Input
                  value={data.chainage_to}
                  onChange={(e) => setData(prev => ({ ...prev, chainage_to: e.target.value }))}
                  placeholder="e.g., 1+020"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="test_date">Date of Test *</Label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={data.test_date}
                    onChange={(e) => setData(prev => ({ ...prev, test_date: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="test_time">Time of Test</Label>
                <Input
                  type="time"
                  value={data.test_time}
                  onChange={(e) => setData(prev => ({ ...prev, test_time: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="technician_name">Technician Name *</Label>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={data.technician_name}
                    onChange={(e) => setData(prev => ({ ...prev, technician_name: e.target.value }))}
                    placeholder="Full name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="technician_id">Technician ID</Label>
                <Input
                  value={data.technician_id}
                  onChange={(e) => setData(prev => ({ ...prev, technician_id: e.target.value }))}
                  placeholder="Employee ID"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weather_conditions">Weather Conditions</Label>
                <Select 
                  value={data.weather_conditions} 
                  onValueChange={(value) => setData(prev => ({ ...prev, weather_conditions: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select weather" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunny">Sunny</SelectItem>
                    <SelectItem value="cloudy">Cloudy</SelectItem>
                    <SelectItem value="rainy">Rainy</SelectItem>
                    <SelectItem value="windy">Windy</SelectItem>
                    <SelectItem value="hot">Hot</SelectItem>
                    <SelectItem value="cold">Cold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="site_conditions">Site Conditions</Label>
                <Textarea
                  value={data.site_conditions}
                  onChange={(e) => setData(prev => ({ ...prev, site_conditions: e.target.value }))}
                  placeholder="Describe site conditions..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        const testConfig = TEST_TYPES[data.test_type];
        if (!testConfig) {
          return (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Please select a test type first</p>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 text-lg font-semibold">
              <ClipboardList className="h-5 w-5" />
              <span>{testConfig.name} - Test Data Entry</span>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{testConfig.description}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {testConfig.fields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={field.key}>
                        {field.label} {field.required && '*'}
                        {field.unit && <span className="text-muted-foreground">({field.unit})</span>}
                      </Label>
                      {field.type === 'select' ? (
                        <Select 
                          value={data.test_data[field.key]?.toString() || ''} 
                          onValueChange={(value) => setData(prev => ({ 
                            ...prev, 
                            test_data: { ...prev.test_data, [field.key]: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={field.type}
                          value={data.test_data[field.key]?.toString() || ''}
                          onChange={(e) => setData(prev => ({ 
                            ...prev, 
                            test_data: { ...prev.test_data, [field.key]: field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }
                          }))}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        const calculatedResults = calculateTestResults();
        
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 text-lg font-semibold">
              <CheckCircle className="h-5 w-5" />
              <span>Summary & Results</span>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Test Data Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(data.test_data).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="font-mono">{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Calculated Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(calculatedResults).filter(([key]) => key !== 'compliance_status').map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="font-mono">
                        {typeof value === 'number' ? value.toFixed(2) : String(value)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Compliance Status</span>
                      <Badge variant={(calculatedResults as any).compliance_status === 'pass' ? 'default' : 'destructive'}>
                        {((calculatedResults as any).compliance_status?.toString() || 'PENDING').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks / Comments</Label>
              <Textarea
                value={data.remarks}
                onChange={(e) => setData(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Add any additional remarks or observations..."
                rows={4}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 text-lg font-semibold">
              <CheckCircle className="h-5 w-5" />
              <span>Final Review</span>
            </div>
            
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Report Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Project:</strong> {data.project_name}</div>
                    <div><strong>Road:</strong> {data.road_name}</div>
                    <div><strong>Chainage:</strong> {data.chainage_from} - {data.chainage_to}</div>
                    <div><strong>Test Type:</strong> {TEST_TYPES[data.test_type]?.name}</div>
                    <div><strong>Date:</strong> {data.test_date}</div>
                    <div><strong>Technician:</strong> {data.technician_name}</div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  By submitting this report, you confirm that all data has been entered correctly 
                  and the test was performed according to standard procedures.
                </p>
                <p className="text-sm font-medium">
                  The report will be saved as a draft and can be submitted for approval later.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Test Report - Step {currentStep} of {totalSteps}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-center space-x-4">
            {[
              { step: 1, label: 'Project Info', icon: FileText },
              { step: 2, label: 'Test Data', icon: ClipboardList },
              { step: 3, label: 'Summary', icon: CheckCircle },
              { step: 4, label: 'Review', icon: CheckCircle }
            ].map(({ step, label, icon: Icon }) => (
              <div key={step} className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : step < currentStep
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
                </div>
                <span className="text-sm font-medium hidden sm:block">{label}</span>
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex space-x-2">
              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid()}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!isStepValid() || loading}
                >
                  {loading ? 'Creating...' : 'Create Report'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}