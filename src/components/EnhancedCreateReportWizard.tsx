import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TemplatePicker } from './TemplatePicker';
import { MaterialEnum, SideEnum, TestReportTemplate } from '@/services/templateService';
import { reportService } from '@/services/reportService';

interface Project {
  id: string;
  name: string;
  description?: string;
  location?: string;
}

interface MaterialCategory {
  id: string;
  name: string;
}

interface WizardData {
  project_id: string;
  material: MaterialEnum | '';
  custom_material: string;
  road_name: string;
  chainage_from: string;
  chainage_to: string;
  side: SideEnum | '';
  laboratory_test_no: string;
  covered_chainage: string;
  road_offset: string;
  test_type: string;
  test_date: string;
  technician_name: string;
  template_id: string;
  selectedTemplate?: TestReportTemplate;
}

interface EnhancedCreateReportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const MATERIAL_OPTIONS: { value: MaterialEnum; label: string }[] = [
  { value: 'soil', label: 'Soil' },
  { value: 'concrete', label: 'Concrete' },
  { value: 'aggregates', label: 'Aggregates' },
  { value: 'asphalt', label: 'Asphalt' },
  { value: 'custom', label: 'Custom' },
];

const SIDE_OPTIONS: { value: SideEnum; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'middle', label: 'Middle' },
];

const TEST_TYPES = {
  soil: ['Proctor', 'Field Density', 'CBR', 'Sieve Analysis', 'Atterberg Limits', 'Moisture Content'],
  concrete: ['Slump', 'Cube Strength', 'Core Test', 'Rebound Hammer', 'UPV Test'],
  aggregates: ['Sieve Analysis', 'Los Angeles Abrasion', 'Impact Value', 'Crushing Value'],
  asphalt: ['Marshall Stability', 'Density Test', 'Binder Content', 'Penetration Test'],
  custom: ['Custom Test']
};

export function EnhancedCreateReportWizard({ open, onOpenChange, onSuccess }: EnhancedCreateReportWizardProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [projects, setProjects] = useState<Project[]>([]);
  const [materialCategories, setMaterialCategories] = useState<MaterialCategory[]>([]);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showNewMaterialDialog, setShowNewMaterialDialog] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [data, setData] = useState<WizardData>({
    project_id: '',
    material: '',
    custom_material: '',
    road_name: '',
    chainage_from: '',
    chainage_to: '',
    side: '',
    laboratory_test_no: '',
    covered_chainage: '',
    road_offset: '',
    test_type: '',
    test_date: new Date().toISOString().split('T')[0],
    technician_name: '',
    template_id: '',
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    if (open) {
      fetchProjects();
      fetchMaterialCategories();
    }
  }, [open]);

  const fetchProjects = async () => {
    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setProjects(projects || []);
    } catch (error) {
      toast.error('Failed to load projects');
      console.error('Error fetching projects:', error);
    }
  };

  const fetchMaterialCategories = async () => {
    try {
      const { data: categories, error } = await supabase
        .from('material_categories')
        .select('*')
        .eq('company_id', profile?.company_id)
        .order('name');

      if (error) throw error;
      setMaterialCategories(categories || []);
    } catch (error) {
      toast.error('Failed to load material categories');
      console.error('Error fetching material categories:', error);
    }
  };

  const addCustomMaterial = async () => {
    if (!newMaterialName.trim()) {
      toast.error('Please enter a material name');
      return;
    }

    try {
      const { data: newCategory, error } = await supabase
        .from('material_categories')
        .insert({
          name: newMaterialName.trim(),
          company_id: profile?.company_id,
          created_by: profile?.user_id,
        })
        .select()
        .single();

      if (error) throw error;

      setMaterialCategories(prev => [...prev, newCategory]);
      setData(prev => ({ ...prev, custom_material: newMaterialName.trim() }));
      setNewMaterialName('');
      setShowNewMaterialDialog(false);
      toast.success('Custom material added');
    } catch (error) {
      toast.error('Failed to add custom material');
      console.error('Error adding material:', error);
    }
  };

  const handleNext = () => {
    if (isStepValid()) {
      if (currentStep === 4) {
        setShowTemplatePicker(true);
      } else {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleTemplateSelect = (template: TestReportTemplate) => {
    setData(prev => ({
      ...prev,
      template_id: template.id,
      selectedTemplate: template,
    }));
    setShowTemplatePicker(false);
    setCurrentStep(5);
  };

  const handleSubmit = async () => {
    if (!isStepValid()) return;

    try {
      setLoading(true);
      
      // Create the test report
      const reportData = {
        project_id: data.project_id,
        template_id: data.template_id || undefined,
        material: data.material as MaterialEnum,
        custom_material: data.material === 'custom' ? data.custom_material : undefined,
        test_type: data.test_type,
        road_name: data.road_name,
        chainage_from: data.chainage_from,
        chainage_to: data.chainage_to,
        side: data.side as SideEnum,
        laboratory_test_no: data.laboratory_test_no,
        covered_chainage: data.covered_chainage,
        road_offset: data.road_offset,
        test_date: data.test_date,
        technician_name: data.technician_name,
        status: 'draft' as const,
      };

      const report = await reportService.createReport(reportData);
      
      toast.success('Test report created successfully');
      onOpenChange(false);
      onSuccess?.();
      
      // Navigate to the editor
      navigate(`/test-reports/${report.id}/edit`);
    } catch (error) {
      toast.error('Failed to create test report');
      console.error('Error creating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return data.project_id !== '';
      case 2:
        return data.material !== '' && (data.material !== 'custom' || data.custom_material !== '');
      case 3:
        return data.road_name !== '' && data.chainage_from !== '' && data.chainage_to !== '';
      case 4:
        return data.test_type !== '';
      case 5:
        return data.template_id !== '';
      default:
        return false;
    }
  };

  const getAvailableTestTypes = () => {
    if (!data.material || data.material === 'custom') return TEST_TYPES.custom;
    return TEST_TYPES[data.material] || [];
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Project</h3>
            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <Select value={data.project_id} onValueChange={(value) => setData(prev => ({ ...prev, project_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a project" />
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
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Material Type</h3>
            <div className="grid grid-cols-2 gap-3">
              {MATERIAL_OPTIONS.map((option) => (
                <Card
                  key={option.value}
                  className={`cursor-pointer transition-all ${
                    data.material === option.value ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setData(prev => ({ ...prev, material: option.value }))}
                >
                  <CardContent className="p-4 text-center">
                    <span className="font-medium">{option.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {data.material === 'custom' && (
              <div className="space-y-3">
                <Label>Custom Material</Label>
                <div className="flex gap-2">
                  <Select value={data.custom_material} onValueChange={(value) => setData(prev => ({ ...prev, custom_material: value }))}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select or add custom material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materialCategories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewMaterialDialog(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Road & Location Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="road_name">Road Name *</Label>
                <Input
                  id="road_name"
                  value={data.road_name}
                  onChange={(e) => setData(prev => ({ ...prev, road_name: e.target.value }))}
                  placeholder="e.g., A1 Highway"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="side">Side</Label>
                <Select value={data.side} onValueChange={(value: SideEnum) => setData(prev => ({ ...prev, side: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select side" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIDE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="chainage_from">Chainage From *</Label>
                <Input
                  id="chainage_from"
                  value={data.chainage_from}
                  onChange={(e) => setData(prev => ({ ...prev, chainage_from: e.target.value }))}
                  placeholder="e.g., 1+010"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chainage_to">Chainage To *</Label>
                <Input
                  id="chainage_to"
                  value={data.chainage_to}
                  onChange={(e) => setData(prev => ({ ...prev, chainage_to: e.target.value }))}
                  placeholder="e.g., 1+020"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="laboratory_test_no">Laboratory Test No.</Label>
                <Input
                  id="laboratory_test_no"
                  value={data.laboratory_test_no}
                  onChange={(e) => setData(prev => ({ ...prev, laboratory_test_no: e.target.value }))}
                  placeholder="e.g., LAB-2024-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="covered_chainage">Covered Chainage</Label>
                <Input
                  id="covered_chainage"
                  value={data.covered_chainage}
                  onChange={(e) => setData(prev => ({ ...prev, covered_chainage: e.target.value }))}
                  placeholder="e.g., 1+010 to 1+020"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="road_offset">Offset</Label>
                <Input
                  id="road_offset"
                  value={data.road_offset}
                  onChange={(e) => setData(prev => ({ ...prev, road_offset: e.target.value }))}
                  placeholder="e.g., CL+2.5m"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test_date">Test Date</Label>
                <Input
                  id="test_date"
                  type="date"
                  value={data.test_date}
                  onChange={(e) => setData(prev => ({ ...prev, test_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="technician_name">Technician Name</Label>
              <Input
                id="technician_name"
                value={data.technician_name}
                onChange={(e) => setData(prev => ({ ...prev, technician_name: e.target.value }))}
                placeholder="Enter technician name"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Type</h3>
            <div className="grid grid-cols-2 gap-3">
              {getAvailableTestTypes().map((testType) => (
                <Card
                  key={testType}
                  className={`cursor-pointer transition-all ${
                    data.test_type === testType ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setData(prev => ({ ...prev, test_type: testType }))}
                >
                  <CardContent className="p-4 text-center">
                    <span className="font-medium">{testType}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Selected Template</h3>
            {data.selectedTemplate ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {data.selectedTemplate.name}
                    <Badge>{data.selectedTemplate.material}</Badge>
                  </CardTitle>
                  <CardDescription>
                    {data.selectedTemplate.test_type} • v{data.selectedTemplate.version} • {data.selectedTemplate.units}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Standard:</span> {data.selectedTemplate.standard || 'None'}
                    </div>
                    <div>
                      <span className="font-medium">Columns:</span> {data.selectedTemplate.schema_json.columns.length}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-3"
                    onClick={() => setShowTemplatePicker(true)}
                  >
                    Change Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No template selected</p>
                <Button onClick={() => setShowTemplatePicker(true)}>
                  Select Template
                </Button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={open && !showTemplatePicker} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Test Report</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Step {currentStep} of {totalSteps}</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Step Content */}
            <div className="min-h-[300px]">
              {renderStepContent()}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>

              {currentStep < 4 ? (
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid()}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : currentStep === 4 ? (
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid()}
                >
                  Select Template
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!isStepValid() || loading}
                >
                  {loading ? 'Creating...' : 'Create & Open Editor'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Picker */}
      <TemplatePicker
        open={showTemplatePicker}
        onOpenChange={setShowTemplatePicker}
        onSelectTemplate={handleTemplateSelect}
        preselectedMaterial={data.material as MaterialEnum}
        preselectedTestType={data.test_type}
      />

      {/* New Material Dialog */}
      <Dialog open={showNewMaterialDialog} onOpenChange={setShowNewMaterialDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Material</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_material">Material Name</Label>
              <Input
                id="new_material"
                value={newMaterialName}
                onChange={(e) => setNewMaterialName(e.target.value)}
                placeholder="Enter material name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewMaterialDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addCustomMaterial}>
                Add Material
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}