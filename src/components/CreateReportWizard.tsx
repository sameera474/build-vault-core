import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
  description: string;
}

interface MaterialCategory {
  id: string;
  name: string;
}

interface WizardData {
  projectId: string;
  material: string;
  customMaterial: string;
  roadName: string;
  chainageFrom: string;
  chainageTo: string;
  side: string;
  laboratoryTestNo: string;
  coveredChainage: string;
  roadOffset: string;
  testType: string;
}

const TEST_TYPES = [
  'Proctor Compaction',
  'Field Density',
  'California Bearing Ratio (CBR)',
  'Unconfined Compressive Strength',
  'Triaxial Test',
  'Liquid Limit',
  'Plastic Limit',
  'Particle Size Distribution',
  'Moisture Content',
  'Specific Gravity'
];

const MATERIAL_OPTIONS = [
  { value: 'soil', label: 'Soil' },
  { value: 'concrete', label: 'Concrete' },
  { value: 'aggregates', label: 'Aggregates' },
  { value: 'asphalt', label: 'Asphalt' },
  { value: 'custom', label: 'Custom' }
];

const SIDE_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'middle', label: 'Middle' }
];

interface CreateReportWizardProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateReportWizard({ open, onClose }: CreateReportWizardProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [materialCategories, setMaterialCategories] = useState<MaterialCategory[]>([]);
  const [newCustomMaterial, setNewCustomMaterial] = useState('');
  const [wizardData, setWizardData] = useState<WizardData>({
    projectId: '',
    material: '',
    customMaterial: '',
    roadName: '',
    chainageFrom: '',
    chainageTo: '',
    side: '',
    laboratoryTestNo: '',
    coveredChainage: '',
    roadOffset: '',
    testType: ''
  });

  useEffect(() => {
    if (open && profile?.company_id) {
      fetchProjects();
      fetchMaterialCategories();
    }
  }, [open, profile?.company_id]);

  const fetchProjects = async () => {
    if (!profile?.company_id) return;
    
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, description')
      .eq('company_id', profile.company_id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
      return;
    }

    setProjects(data || []);
  };

  const fetchMaterialCategories = async () => {
    if (!profile?.company_id) return;
    
    const { data, error } = await supabase
      .from('material_categories')
      .select('id, name')
      .eq('company_id', profile.company_id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load custom materials",
        variant: "destructive",
      });
      return;
    }

    setMaterialCategories(data || []);
  };

  const addCustomMaterial = async () => {
    if (!newCustomMaterial.trim() || !profile?.company_id) return;

    const { data, error } = await supabase
      .from('material_categories')
      .insert({
        company_id: profile.company_id,
        name: newCustomMaterial.trim(),
        created_by: profile.user_id
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add custom material",
        variant: "destructive",
      });
      return;
    }

    setMaterialCategories(prev => [...prev, data]);
    setWizardData(prev => ({ ...prev, customMaterial: data.id }));
    setNewCustomMaterial('');
    toast({
      title: "Success",
      description: "Custom material added successfully",
    });
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!profile?.company_id) return;

    setLoading(true);
    try {
      const reportData = {
        company_id: profile.company_id,
        project_id: wizardData.projectId,
        material: wizardData.material as 'soil' | 'concrete' | 'aggregates' | 'asphalt' | 'custom',
        custom_material: wizardData.material === 'custom' ? wizardData.customMaterial : null,
        road_name: wizardData.roadName,
        chainage_from: wizardData.chainageFrom,
        chainage_to: wizardData.chainageTo,
        side: wizardData.side as 'left' | 'right' | 'middle',
        laboratory_test_no: wizardData.laboratoryTestNo,
        covered_chainage: wizardData.coveredChainage,
        road_offset: wizardData.roadOffset,
        test_type: wizardData.testType,
        report_number: `RPT-${Date.now()}`, // Generate unique report number
        test_date: new Date().toISOString().split('T')[0],
        status: 'draft' as 'draft' | 'submitted' | 'approved' | 'rejected',
        created_by: profile.user_id
      };

      const { data, error } = await supabase
        .from('test_reports')
        .insert([reportData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Test report created successfully",
      });

      onClose();
      navigate(`/test-reports/${data.id}/edit`);
    } catch (error) {
      console.error('Error creating report:', error);
      toast({
        title: "Error",
        description: "Failed to create test report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return wizardData.projectId !== '';
      case 2:
        return wizardData.material !== '' && 
               (wizardData.material !== 'custom' || wizardData.customMaterial !== '');
      case 3:
        return wizardData.roadName !== '' && 
               wizardData.chainageFrom !== '' && 
               wizardData.chainageTo !== '' && 
               wizardData.side !== '';
      case 4:
        return wizardData.testType !== '';
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Select Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={wizardData.projectId}
                onValueChange={(value) => setWizardData(prev => ({ ...prev, projectId: value }))}
              >
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={project.id} id={project.id} />
                    <Label htmlFor={project.id} className="cursor-pointer flex-1">
                      <div>
                        <div className="font-medium">{project.name}</div>
                        {project.description && (
                          <div className="text-sm text-muted-foreground">{project.description}</div>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {projects.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No projects found. Please create a project first.
                </p>
              )}
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Select Material</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={wizardData.material}
                onValueChange={(value) => setWizardData(prev => ({ ...prev, material: value, customMaterial: '' }))}
              >
                {MATERIAL_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {wizardData.material === 'custom' && (
                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label>Select Custom Material</Label>
                    <Select
                      value={wizardData.customMaterial}
                      onValueChange={(value) => setWizardData(prev => ({ ...prev, customMaterial: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a custom material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materialCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Add New Custom Material</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newCustomMaterial}
                        onChange={(e) => setNewCustomMaterial(e.target.value)}
                        placeholder="Enter new material name"
                      />
                      <Button onClick={addCustomMaterial} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Road Details & Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="roadName">Road Name *</Label>
                  <Input
                    id="roadName"
                    value={wizardData.roadName}
                    onChange={(e) => setWizardData(prev => ({ ...prev, roadName: e.target.value }))}
                    placeholder="Enter road name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="side">Side of Road *</Label>
                  <Select
                    value={wizardData.side}
                    onValueChange={(value) => setWizardData(prev => ({ ...prev, side: value }))}
                  >
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chainageFrom">Chainage From *</Label>
                  <Input
                    id="chainageFrom"
                    value={wizardData.chainageFrom}
                    onChange={(e) => setWizardData(prev => ({ ...prev, chainageFrom: e.target.value }))}
                    placeholder="e.g., 1+010"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chainageTo">Chainage To *</Label>
                  <Input
                    id="chainageTo"
                    value={wizardData.chainageTo}
                    onChange={(e) => setWizardData(prev => ({ ...prev, chainageTo: e.target.value }))}
                    placeholder="e.g., 1+020"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="laboratoryTestNo">Laboratory Test No.</Label>
                  <Input
                    id="laboratoryTestNo"
                    value={wizardData.laboratoryTestNo}
                    onChange={(e) => setWizardData(prev => ({ ...prev, laboratoryTestNo: e.target.value }))}
                    placeholder="Enter lab test number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roadOffset">Offset</Label>
                  <Input
                    id="roadOffset"
                    value={wizardData.roadOffset}
                    onChange={(e) => setWizardData(prev => ({ ...prev, roadOffset: e.target.value }))}
                    placeholder="Enter offset"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coveredChainage">Covered Chainage</Label>
                <Input
                  id="coveredChainage"
                  value={wizardData.coveredChainage}
                  onChange={(e) => setWizardData(prev => ({ ...prev, coveredChainage: e.target.value }))}
                  placeholder="Enter covered chainage"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Select Test Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={wizardData.testType}
                onValueChange={(value) => setWizardData(prev => ({ ...prev, testType: value }))}
              >
                {TEST_TYPES.map((testType) => (
                  <div key={testType} className="flex items-center space-x-2">
                    <RadioGroupItem value={testType} id={testType} />
                    <Label htmlFor={testType} className="cursor-pointer">
                      {testType}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Test Report - Step {step} of 4</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2">
            {[1, 2, 3, 4].map((stepNum) => (
              <div
                key={stepNum}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNum === step
                    ? 'bg-primary text-primary-foreground'
                    : stepNum < step
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {stepNum}
              </div>
            ))}
          </div>

          {renderStepContent()}

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {step < 4 ? (
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
                Create & Open Editor
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}