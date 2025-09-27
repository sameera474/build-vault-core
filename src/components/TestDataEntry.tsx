import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Calculator, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  RefreshCw,
  Save,
  HelpCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TestStep {
  id: string;
  title: string;
  description: string;
  fields: TestField[];
  calculations?: Record<string, string>;
  validations?: Record<string, { min?: number; max?: number; required?: boolean }>;
}

interface TestField {
  key: string;
  label: string;
  type: 'number' | 'text' | 'select' | 'measurement';
  unit?: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  helpText?: string;
  precision?: number;
}

interface TestDataEntryProps {
  testType: string;
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  onCalculate?: (results: Record<string, any>) => void;
}

// Test configurations for different test types
const TEST_CONFIGURATIONS: Record<string, TestStep[]> = {
  sand_cone: [
    {
      id: 'preparation',
      title: 'Equipment Preparation',
      description: 'Weigh the sand cone apparatus and prepare the test hole',
      fields: [
        { 
          key: 'apparatus_weight', 
          label: 'Weight of Sand Cone Apparatus', 
          type: 'number', 
          unit: 'kg', 
          required: true,
          helpText: 'Include weight of sand, funnel, and jar',
          precision: 3
        },
        { 
          key: 'sand_density', 
          label: 'Calibrated Sand Density', 
          type: 'number', 
          unit: 'kg/m³', 
          required: true,
          helpText: 'From calibration test - typically 1400-1600 kg/m³'
        },
        { 
          key: 'funnel_volume', 
          label: 'Sand Volume in Funnel', 
          type: 'number', 
          unit: 'cm³', 
          required: true,
          helpText: 'Volume of sand that remains in funnel after test'
        }
      ]
    },
    {
      id: 'excavation',
      title: 'Hole Excavation & Measurement',
      description: 'Excavate the test hole and measure the sand required to fill it',
      fields: [
        { 
          key: 'apparatus_weight_after', 
          label: 'Weight of Apparatus After Test', 
          type: 'number', 
          unit: 'kg', 
          required: true,
          precision: 3
        },
        { 
          key: 'wet_soil_weight', 
          label: 'Weight of Excavated Wet Soil', 
          type: 'number', 
          unit: 'kg', 
          required: true,
          precision: 3
        }
      ],
      calculations: {
        sand_used: 'apparatus_weight - apparatus_weight_after',
        hole_volume: '(sand_used * 1000000) / sand_density - funnel_volume',
        wet_density: '(wet_soil_weight * 1000000) / hole_volume'
      }
    },
    {
      id: 'moisture',
      title: 'Moisture Content Determination',
      description: 'Determine the moisture content of the excavated soil',
      fields: [
        { 
          key: 'container_weight', 
          label: 'Weight of Empty Container', 
          type: 'number', 
          unit: 'g', 
          required: true
        },
        { 
          key: 'wet_soil_container_weight', 
          label: 'Weight of Wet Soil + Container', 
          type: 'number', 
          unit: 'g', 
          required: true
        },
        { 
          key: 'dry_soil_container_weight', 
          label: 'Weight of Dry Soil + Container', 
          type: 'number', 
          unit: 'g', 
          required: true
        }
      ],
      calculations: {
        wet_soil_weight_sample: 'wet_soil_container_weight - container_weight',
        dry_soil_weight_sample: 'dry_soil_container_weight - container_weight',
        moisture_content: '((wet_soil_weight_sample - dry_soil_weight_sample) / dry_soil_weight_sample) * 100',
        dry_density: 'wet_density / (1 + moisture_content / 100)'
      }
    }
  ],
  field_density: [
    {
      id: 'laboratory_values',
      title: 'Laboratory Reference Values',
      description: 'Enter the maximum dry density and optimum moisture from laboratory tests',
      fields: [
        { 
          key: 'max_dry_density', 
          label: 'Maximum Dry Density (Lab)', 
          type: 'number', 
          unit: 'kg/m³', 
          required: true,
          helpText: 'From Standard or Modified Proctor test'
        },
        { 
          key: 'optimum_moisture', 
          label: 'Optimum Moisture Content', 
          type: 'number', 
          unit: '%', 
          required: true 
        },
        { 
          key: 'test_method', 
          label: 'Laboratory Test Method', 
          type: 'select', 
          options: ['AASHTO T99 (Standard)', 'AASHTO T180 (Modified)', 'BS 1377', 'AS 1289'],
          required: true 
        }
      ]
    },
    {
      id: 'field_measurements',
      title: 'Field Measurements',
      description: 'Measure the field density and moisture content',
      fields: [
        { 
          key: 'field_wet_density', 
          label: 'Field Wet Density', 
          type: 'number', 
          unit: 'kg/m³', 
          required: true 
        },
        { 
          key: 'field_moisture', 
          label: 'Field Moisture Content', 
          type: 'number', 
          unit: '%', 
          required: true 
        },
        { 
          key: 'test_location', 
          label: 'Test Location Description', 
          type: 'text', 
          placeholder: 'e.g., Centerline, 2m from edge'
        }
      ],
      calculations: {
        field_dry_density: 'field_wet_density / (1 + field_moisture / 100)',
        degree_compaction: '(field_dry_density / max_dry_density) * 100',
        moisture_ratio: 'field_moisture / optimum_moisture'
      }
    }
  ],
  compaction: [
    {
      id: 'sample_prep',
      title: 'Sample Preparation',
      description: 'Prepare soil sample and select test method',
      fields: [
        { 
          key: 'test_method', 
          label: 'Compaction Method', 
          type: 'select', 
          options: ['Standard Proctor (AASHTO T99)', 'Modified Proctor (AASHTO T180)'],
          required: true 
        },
        { 
          key: 'mold_volume', 
          label: 'Mold Volume', 
          type: 'number', 
          unit: 'cm³', 
          required: true,
          helpText: 'Standard: 943.3 cm³, Modified: 2124 cm³'
        },
        { 
          key: 'sample_preparation', 
          label: 'Sample Preparation Method', 
          type: 'select', 
          options: ['Wet preparation', 'Dry preparation'],
          required: true 
        }
      ]
    },
    {
      id: 'compaction_tests',
      title: 'Compaction Points',
      description: 'Record data for each moisture content point (minimum 5 points)',
      fields: [
        { 
          key: 'point_number', 
          label: 'Point Number', 
          type: 'select', 
          options: ['Point 1', 'Point 2', 'Point 3', 'Point 4', 'Point 5', 'Point 6'],
          required: true 
        },
        { 
          key: 'wet_weight_soil_mold', 
          label: 'Weight of Wet Soil + Mold', 
          type: 'number', 
          unit: 'kg', 
          required: true 
        },
        { 
          key: 'mold_weight', 
          label: 'Weight of Mold', 
          type: 'number', 
          unit: 'kg', 
          required: true 
        },
        { 
          key: 'moisture_content_point', 
          label: 'Moisture Content', 
          type: 'number', 
          unit: '%', 
          required: true 
        }
      ],
      calculations: {
        wet_weight_soil: 'wet_weight_soil_mold - mold_weight',
        wet_density: '(wet_weight_soil / mold_volume) * 1000',
        dry_density: 'wet_density / (1 + moisture_content_point / 100)'
      }
    }
  ]
};

export function TestDataEntry({ testType, data, onChange, onCalculate }: TestDataEntryProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [calculatedResults, setCalculatedResults] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const testSteps = TEST_CONFIGURATIONS[testType] || [];
  const currentStep = testSteps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / testSteps.length) * 100;

  useEffect(() => {
    if (currentStep?.calculations) {
      calculateResults();
    }
  }, [data, currentStep]);

  const calculateResults = () => {
    if (!currentStep?.calculations) return;

    const results: Record<string, number> = {};
    
    Object.entries(currentStep.calculations).forEach(([key, formula]) => {
      try {
        // Simple expression evaluator - replace variables with actual values
        let expression = formula;
        Object.entries(data).forEach(([field, value]) => {
          if (typeof value === 'number') {
            expression = expression.replace(new RegExp(`\\b${field}\\b`, 'g'), value.toString());
          }
        });

        // Evaluate if expression contains only numbers and operators
        if (/^[\d\s+\-*/().]+$/.test(expression)) {
          results[key] = eval(expression);
        }
      } catch (error) {
        console.error(`Error calculating ${key}:`, error);
      }
    });

    setCalculatedResults(results);
    onCalculate?.(results);
  };

  const validateField = (field: TestField, value: any): string | null => {
    if (field.required && (value === undefined || value === '' || value === null)) {
      return `${field.label} is required`;
    }

    if (field.type === 'number' && value !== undefined && value !== '') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return `${field.label} must be a valid number`;
      }

      // Add specific validations for different fields
      if (field.key === 'moisture_content' && (numValue < 0 || numValue > 50)) {
        return 'Moisture content should be between 0% and 50%';
      }
      if (field.key.includes('density') && (numValue < 800 || numValue > 2500)) {
        return 'Density values should be between 800 and 2500 kg/m³';
      }
    }

    return null;
  };

  const handleFieldChange = (field: TestField, value: any) => {
    const error = validateField(field, value);
    
    setValidationErrors(prev => ({
      ...prev,
      [field.key]: error || ''
    }));

    const processedValue = field.type === 'number' ? parseFloat(value) || 0 : value;
    onChange({ ...data, [field.key]: processedValue });
  };

  const isStepComplete = () => {
    if (!currentStep) return false;
    
    return currentStep.fields
      .filter(field => field.required)
      .every(field => {
        const value = data[field.key];
        return value !== undefined && value !== '' && !validationErrors[field.key];
      });
  };

  const handleNextStep = () => {
    if (currentStepIndex < testSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const getComplianceStatus = () => {
    if (testType === 'field_density' && calculatedResults.degree_compaction) {
      return calculatedResults.degree_compaction >= 95 ? 'pass' : 'fail';
    }
    return 'pending';
  };

  if (!currentStep) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Test configuration not found for: {testType}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">{currentStep.title}</span>
          <span className="text-muted-foreground">Step {currentStepIndex + 1} of {testSteps.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Description */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Info className="h-5 w-5" />
            <span>{currentStep.title}</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">{currentStep.description}</p>
        </CardHeader>
      </Card>

      {/* Input Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentStep.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key} className="flex items-center space-x-1">
                  <span>{field.label}</span>
                  {field.required && <span className="text-destructive">*</span>}
                  {field.unit && <Badge variant="outline" className="text-xs">{field.unit}</Badge>}
                  {field.helpText && (
                    <div title={field.helpText}>
                      <HelpCircle 
                        className="h-3 w-3 text-muted-foreground cursor-help" 
                      />
                    </div>
                  )}
                </Label>
                
                {field.type === 'select' ? (
                  <Select 
                    value={data[field.key]?.toString() || ''} 
                    onValueChange={(value) => handleFieldChange(field, value)}
                  >
                    <SelectTrigger className={validationErrors[field.key] ? 'border-destructive' : ''}>
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
                    id={field.key}
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={data[field.key]?.toString() || ''}
                    onChange={(e) => handleFieldChange(field, e.target.value)}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                    step={field.precision ? `0.${'0'.repeat(field.precision - 1)}1` : '0.001'}
                    className={validationErrors[field.key] ? 'border-destructive' : ''}
                  />
                )}
                
                {field.helpText && (
                  <p className="text-xs text-muted-foreground">{field.helpText}</p>
                )}
                
                {validationErrors[field.key] && (
                  <p className="text-xs text-destructive flex items-center space-x-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{validationErrors[field.key]}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calculated Results */}
      {Object.keys(calculatedResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base">
              <Calculator className="h-4 w-4" />
              <span>Calculated Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(calculatedResults).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="font-mono text-sm">
                    {typeof value === 'number' ? value.toFixed(3) : value}
                  </span>
                </div>
              ))}
            </div>
            
            {testType === 'field_density' && calculatedResults.degree_compaction && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Compliance Status</span>
                  <Badge variant={getComplianceStatus() === 'pass' ? 'default' : 'destructive'}>
                    {getComplianceStatus() === 'pass' ? 
                      <><CheckCircle className="h-3 w-3 mr-1" />PASS</> : 
                      'FAIL - Below 95% compaction'
                    }
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevStep}
          disabled={currentStepIndex === 0}
        >
          Previous Step
        </Button>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={calculateResults}
            disabled={!isStepComplete()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Recalculate
          </Button>
          
          {currentStepIndex < testSteps.length - 1 ? (
            <Button
              onClick={handleNextStep}
              disabled={!isStepComplete()}
            >
              Next Step
            </Button>
          ) : (
            <Button
              onClick={() => toast({ title: "Test Complete", description: "All test steps completed successfully" })}
              disabled={!isStepComplete()}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Test
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}