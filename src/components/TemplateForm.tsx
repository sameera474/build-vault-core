import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TestReportTemplate, MaterialEnum, templateService } from '@/services/templateService';
import { toast } from 'sonner';

interface TemplateFormProps {
  template?: TestReportTemplate;
  onSave: (template: Partial<TestReportTemplate>) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const MATERIAL_OPTIONS: { value: MaterialEnum; label: string }[] = [
  { value: 'soil', label: 'Soil' },
  { value: 'concrete', label: 'Concrete' },
  { value: 'aggregates', label: 'Aggregates' },
  { value: 'asphalt', label: 'Asphalt' },
  { value: 'custom', label: 'Custom' },
];

const STANDARD_OPTIONS = [
  { value: 'bs_en', label: 'BS EN' },
  { value: 'aashto', label: 'AASHTO' },
  { value: 'astm', label: 'ASTM' },
  { value: 'none', label: 'None' },
];

const TEST_TYPES = {
  soil: ['Proctor', 'Field Density', 'CBR', 'Sieve Analysis', 'Atterberg Limits', 'Moisture Content'],
  concrete: ['Slump', 'Cube Strength', 'Core Test', 'Rebound Hammer', 'UPV Test'],
  aggregates: ['Sieve Analysis', 'Los Angeles Abrasion', 'Impact Value', 'Crushing Value'],
  asphalt: ['Marshall Stability', 'Density Test', 'Binder Content', 'Penetration Test'],
  custom: ['Custom Test']
};

export function TemplateForm({ template, onSave, onCancel, isEditing = false }: TemplateFormProps) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    material: template?.material || 'soil' as MaterialEnum,
    custom_material: template?.custom_material || '',
    test_type: template?.test_type || '',
    standard: template?.standard || '',
    road_class: template?.road_class || '',
    units: template?.units || 'SI',
    description: template?.description || '',
    schema_json: JSON.stringify(template?.schema_json || templateService.getExampleSchemas().field_density, null, 2),
    rules_json: JSON.stringify(template?.rules_json || templateService.getExampleRules().field_density, null, 2),
    visibility_roles: template?.visibility_roles || ['technician', 'quality_manager', 'project_manager'],
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    }

    if (!formData.test_type.trim()) {
      newErrors.test_type = 'Test type is required';
    }

    if (formData.material === 'custom' && !formData.custom_material.trim()) {
      newErrors.custom_material = 'Custom material name is required';
    }

    try {
      JSON.parse(formData.schema_json);
    } catch (error) {
      newErrors.schema_json = 'Invalid JSON format';
    }

    try {
      if (formData.rules_json.trim()) {
        JSON.parse(formData.rules_json);
      }
    } catch (error) {
      newErrors.rules_json = 'Invalid JSON format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    try {
      const templateData: Partial<TestReportTemplate> = {
        ...template,
        name: formData.name.trim(),
        material: formData.material,
        custom_material: formData.material === 'custom' ? formData.custom_material.trim() : undefined,
        test_type: formData.test_type.trim(),
        standard: formData.standard || undefined,
        road_class: formData.road_class || undefined,
        units: formData.units as 'SI' | 'Imperial',
        description: formData.description || undefined,
        schema_json: JSON.parse(formData.schema_json),
        rules_json: formData.rules_json.trim() ? JSON.parse(formData.rules_json) : undefined,
        visibility_roles: formData.visibility_roles,
      };

      onSave(templateData);
    } catch (error) {
      toast.error('Failed to save template');
      console.error('Error saving template:', error);
    }
  };

  const loadExampleSchema = (type: string) => {
    const examples = templateService.getExampleSchemas();
    const rules = templateService.getExampleRules();
    
    if (type in examples) {
      setFormData(prev => ({
        ...prev,
        schema_json: JSON.stringify(examples[type as keyof typeof examples], null, 2),
        rules_json: JSON.stringify(rules[type as keyof typeof rules], null, 2),
      }));
      toast.success(`Loaded ${type} example schema`);
    }
  };

  const getAvailableTestTypes = () => {
    return TEST_TYPES[formData.material] || TEST_TYPES.custom;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Standard Field Density Test"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="material">Material *</Label>
              <Select 
                value={formData.material} 
                onValueChange={(value: MaterialEnum) => setFormData(prev => ({ ...prev, material: value, test_type: '' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.material === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="custom_material">Custom Material *</Label>
                <Input
                  id="custom_material"
                  value={formData.custom_material}
                  onChange={(e) => setFormData(prev => ({ ...prev, custom_material: e.target.value }))}
                  placeholder="Enter custom material name"
                  className={errors.custom_material ? 'border-destructive' : ''}
                />
                {errors.custom_material && <p className="text-sm text-destructive">{errors.custom_material}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="test_type">Test Type *</Label>
              <Select 
                value={formData.test_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, test_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableTestTypes().map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.test_type && <p className="text-sm text-destructive">{errors.test_type}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="standard">Standard</Label>
              <Select value={formData.standard} onValueChange={(value) => setFormData(prev => ({ ...prev, standard: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select standard" />
                </SelectTrigger>
                <SelectContent>
                  {STANDARD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="road_class">Road Class</Label>
              <Input
                id="road_class"
                value={formData.road_class}
                onChange={(e) => setFormData(prev => ({ ...prev, road_class: e.target.value }))}
                placeholder="e.g., Highway, Urban, Rural"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="units">Units</Label>
              <Select value={formData.units} onValueChange={(value) => setFormData(prev => ({ ...prev, units: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SI">SI (Metric)</SelectItem>
                  <SelectItem value="Imperial">Imperial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description of this template"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Schema Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Schema Configuration
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => loadExampleSchema('field_density')}
              >
                Load Field Density Example
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => loadExampleSchema('proctor')}
              >
                Load Proctor Example
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Define the columns, data types, and validation rules for the spreadsheet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schema_json">Schema JSON *</Label>
            <Textarea
              id="schema_json"
              value={formData.schema_json}
              onChange={(e) => setFormData(prev => ({ ...prev, schema_json: e.target.value }))}
              className={`font-mono text-sm ${errors.schema_json ? 'border-destructive' : ''}`}
              rows={12}
            />
            {errors.schema_json && <p className="text-sm text-destructive">{errors.schema_json}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rules_json">Rules JSON (Optional)</Label>
            <Textarea
              id="rules_json"
              value={formData.rules_json}
              onChange={(e) => setFormData(prev => ({ ...prev, rules_json: e.target.value }))}
              className={`font-mono text-sm ${errors.rules_json ? 'border-destructive' : ''}`}
              rows={8}
            />
            {errors.rules_json && <p className="text-sm text-destructive">{errors.rules_json}</p>}
            <p className="text-xs text-muted-foreground">
              Define pass/fail conditions and calculations
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {isEditing ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
}