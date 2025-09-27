import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface FieldDensityTestProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function FieldDensityTest({ data, onUpdate }: FieldDensityTestProps) {
  const [testData, setTestData] = useState({
    // Basic Test Information
    test_location: '',
    side: '',
    offset_m: '',
    depth_mm: '',
    hole_depth_mm: '',
    
    // Container and Soil Weights
    container_weight_g: '',
    soil_container_weight_g: '',
    soil_weight_g: '',
    
    // Sand Cone Data
    sand_cone_no: '',
    sand_before_pouring_g: '',
    sand_after_pouring_g: '',
    sand_in_hole_cone_baseplate_g: '',
    sand_in_cone_baseplate_g: '',
    sand_in_hole_g: '',
    bulk_density_sand_g_cm3: '',
    volume_hole_cm3: '',
    
    // Calculated Values
    wet_density_g_cm3: '',
    
    // Moisture Content Block
    moisture_container_no: '',
    wet_soil_container_g: '',
    dry_soil_container_g: '',
    container_weight_moisture_g: '',
    moisture_content_percent: '',
    dry_density_g_cm3: '',
    
    // Reference Lab Values
    proctor_report_no: '',
    max_dry_density_g_cm3: '',
    optimum_moisture_percent: '',
    
    // Specification Requirements
    degree_compaction_spec: '95', // Default to 95%
    
    ...data
  });

  useEffect(() => {
    setTestData(prev => ({ ...prev, ...data }));
  }, [data]);

  const updateField = (field: string, value: string) => {
    const updated = { ...testData, [field]: value };
    setTestData(updated);
    
    // Perform calculations when relevant fields change
    performCalculations(updated);
  };

  const performCalculations = (data: any) => {
    let updated = { ...data };
    
    // Calculate soil weight from hole
    if (data.soil_container_weight_g && data.container_weight_g) {
      const soilWeight = parseFloat(data.soil_container_weight_g) - parseFloat(data.container_weight_g);
      updated.soil_weight_g = soilWeight.toFixed(1);
    }
    
    // Calculate sand in hole
    if (data.sand_in_hole_cone_baseplate_g && data.sand_in_cone_baseplate_g) {
      const sandInHole = parseFloat(data.sand_in_hole_cone_baseplate_g) - parseFloat(data.sand_in_cone_baseplate_g);
      updated.sand_in_hole_g = sandInHole.toFixed(1);
    }
    
    // Calculate volume of hole
    if (data.sand_in_hole_g && data.bulk_density_sand_g_cm3) {
      const volume = parseFloat(data.sand_in_hole_g) / parseFloat(data.bulk_density_sand_g_cm3);
      updated.volume_hole_cm3 = volume.toFixed(1);
    }
    
    // Calculate wet density
    if (data.soil_weight_g && data.volume_hole_cm3) {
      const wetDensity = parseFloat(data.soil_weight_g) / parseFloat(data.volume_hole_cm3);
      updated.wet_density_g_cm3 = wetDensity.toFixed(3);
    }
    
    // Calculate moisture content
    if (data.wet_soil_container_g && data.dry_soil_container_g && data.container_weight_moisture_g) {
      const wetSoil = parseFloat(data.wet_soil_container_g) - parseFloat(data.container_weight_moisture_g);
      const drySoil = parseFloat(data.dry_soil_container_g) - parseFloat(data.container_weight_moisture_g);
      if (drySoil > 0) {
        const moisture = ((wetSoil - drySoil) / drySoil) * 100;
        updated.moisture_content_percent = moisture.toFixed(2);
      }
    }
    
    // Calculate dry density
    if (data.wet_density_g_cm3 && data.moisture_content_percent) {
      const wetDensity = parseFloat(data.wet_density_g_cm3);
      const moisture = parseFloat(data.moisture_content_percent);
      const dryDensity = wetDensity / (1 + (moisture / 100));
      updated.dry_density_g_cm3 = dryDensity.toFixed(3);
    }
    
    setTestData(updated);
    onUpdate(updated);
  };

  const getComplianceStatus = () => {
    if (!testData.dry_density_g_cm3 || !testData.max_dry_density_g_cm3 || !testData.degree_compaction_spec) {
      return { status: 'PENDING', color: 'secondary' };
    }
    
    const fieldDryDensity = parseFloat(testData.dry_density_g_cm3);
    const maxDryDensity = parseFloat(testData.max_dry_density_g_cm3);
    const requiredPercent = parseFloat(testData.degree_compaction_spec);
    
    const achievedPercent = (fieldDryDensity / maxDryDensity) * 100;
    
    return achievedPercent >= requiredPercent 
      ? { status: 'PASS', color: 'default' as const }
      : { status: 'FAIL', color: 'destructive' as const };
  };

  const compliance = getComplianceStatus();

  return (
    <div className="space-y-6">
      {/* Test Location and Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Test Location Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Test Location</Label>
              <Input
                value={testData.test_location}
                onChange={(e) => updateField('test_location', e.target.value)}
                placeholder="e.g., Chainage 5+250"
              />
            </div>
            <div className="space-y-2">
              <Label>Side</Label>
              <Select value={testData.side} onValueChange={(value) => updateField('side', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Left">Left</SelectItem>
                  <SelectItem value="Right">Right</SelectItem>
                  <SelectItem value="Middle">Middle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Offset (m)</Label>
              <Input
                type="number"
                step="0.1"
                value={testData.offset_m}
                onChange={(e) => updateField('offset_m', e.target.value)}
                placeholder="e.g., 2.5"
              />
            </div>
            <div className="space-y-2">
              <Label>Depth (mm)</Label>
              <Input
                type="number"
                value={testData.depth_mm}
                onChange={(e) => updateField('depth_mm', e.target.value)}
                placeholder="e.g., 150"
              />
            </div>
            <div className="space-y-2">
              <Label>Hole Depth (mm)</Label>
              <Input
                type="number"
                value={testData.hole_depth_mm}
                onChange={(e) => updateField('hole_depth_mm', e.target.value)}
                placeholder="e.g., 200"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Container and Soil Weights */}
      <Card>
        <CardHeader>
          <CardTitle>Container and Soil Weights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Container Weight (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={testData.container_weight_g}
                onChange={(e) => updateField('container_weight_g', e.target.value)}
                placeholder="e.g., 250.5"
              />
            </div>
            <div className="space-y-2">
              <Label>Weight of Soil from hole + container (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={testData.soil_container_weight_g}
                onChange={(e) => updateField('soil_container_weight_g', e.target.value)}
                placeholder="e.g., 3250.5"
              />
            </div>
            <div className="space-y-2">
              <Label>Weight of Soil from hole (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={testData.soil_weight_g}
                readOnly
                className="bg-muted"
                placeholder="Calculated automatically"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sand Cone Data */}
      <Card>
        <CardHeader>
          <CardTitle>Sand Cone Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Sand cone No.</Label>
              <Input
                value={testData.sand_cone_no}
                onChange={(e) => updateField('sand_cone_no', e.target.value)}
                placeholder="e.g., SC-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Weight of standard sand before pouring (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={testData.sand_before_pouring_g}
                onChange={(e) => updateField('sand_before_pouring_g', e.target.value)}
                placeholder="e.g., 5500.0"
              />
            </div>
            <div className="space-y-2">
              <Label>after pouring (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={testData.sand_after_pouring_g}
                onChange={(e) => updateField('sand_after_pouring_g', e.target.value)}
                placeholder="e.g., 2800.0"
              />
            </div>
            <div className="space-y-2">
              <Label>Bulk density of standard sand (g/cm³)</Label>
              <Input
                type="number"
                step="0.001"
                value={testData.bulk_density_sand_g_cm3}
                onChange={(e) => updateField('bulk_density_sand_g_cm3', e.target.value)}
                placeholder="e.g., 1.625"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>in hole + cone (+ base plate) (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={testData.sand_in_hole_cone_baseplate_g}
                onChange={(e) => updateField('sand_in_hole_cone_baseplate_g', e.target.value)}
                placeholder="e.g., 2700.0"
              />
            </div>
            <div className="space-y-2">
              <Label>in cone + base plate (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={testData.sand_in_cone_baseplate_g}
                onChange={(e) => updateField('sand_in_cone_baseplate_g', e.target.value)}
                placeholder="e.g., 1350.0"
              />
            </div>
            <div className="space-y-2">
              <Label>in hole (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={testData.sand_in_hole_g}
                readOnly
                className="bg-muted"
                placeholder="Calculated automatically"
              />
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Volume of hole (cm³)</Label>
              <Input
                type="number"
                step="0.1"
                value={testData.volume_hole_cm3}
                readOnly
                className="bg-muted"
                placeholder="Calculated automatically"
              />
            </div>
            <div className="space-y-2">
              <Label>Wet Density of Soil/ABC (g/cm³)</Label>
              <Input
                type="number"
                step="0.001"
                value={testData.wet_density_g_cm3}
                readOnly
                className="bg-muted"
                placeholder="Calculated automatically"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Moisture Content Block */}
      <Card>
        <CardHeader>
          <CardTitle>Moisture Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Container No.</Label>
              <Input
                value={testData.moisture_container_no}
                onChange={(e) => updateField('moisture_container_no', e.target.value)}
                placeholder="e.g., MC-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Weight of wet Soil/ABC + container (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={testData.wet_soil_container_g}
                onChange={(e) => updateField('wet_soil_container_g', e.target.value)}
                placeholder="e.g., 850.5"
              />
            </div>
            <div className="space-y-2">
              <Label>Weight of dry Soil/ABC + container (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={testData.dry_soil_container_g}
                onChange={(e) => updateField('dry_soil_container_g', e.target.value)}
                placeholder="e.g., 795.2"
              />
            </div>
            <div className="space-y-2">
              <Label>Weight of container (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={testData.container_weight_moisture_g}
                onChange={(e) => updateField('container_weight_moisture_g', e.target.value)}
                placeholder="e.g., 125.0"
              />
            </div>
            <div className="space-y-2">
              <Label>Moisture content (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={testData.moisture_content_percent}
                readOnly
                className="bg-muted"
                placeholder="Calculated automatically"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dry density (g/cm³)</Label>
            <Input
              type="number"
              step="0.001"
              value={testData.dry_density_g_cm3}
              readOnly
              className="bg-muted"
              placeholder="Calculated automatically"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reference Lab Values */}
      <Card>
        <CardHeader>
          <CardTitle>Reference Lab Value (from Proctor)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Proctor Report Number</Label>
              <Select 
                value={testData.proctor_report_no} 
                onValueChange={(value) => updateField('proctor_report_no', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Proctor report..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRO-001">PRO-001 - Standard Proctor</SelectItem>
                  <SelectItem value="PRO-002">PRO-002 - Modified Proctor</SelectItem>
                  <SelectItem value="PRO-003">PRO-003 - Standard Proctor (Sample 2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Max Dry Density (g/cm³)</Label>
              <Input
                type="number"
                step="0.001"
                value={testData.max_dry_density_g_cm3}
                onChange={(e) => updateField('max_dry_density_g_cm3', e.target.value)}
                placeholder="e.g., 2.150"
              />
            </div>
            <div className="space-y-2">
              <Label>Optimum Moisture Content (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={testData.optimum_moisture_percent}
                onChange={(e) => updateField('optimum_moisture_percent', e.target.value)}
                placeholder="e.g., 8.5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Specification Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Specification Requirement
            <Badge variant={compliance.color === 'default' ? 'default' : 'destructive'} className="ml-2">
              {compliance.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Degree of Compaction</Label>
            <Select 
              value={testData.degree_compaction_spec} 
              onValueChange={(value) => updateField('degree_compaction_spec', value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="98">98%</SelectItem>
                <SelectItem value="95">95%</SelectItem>
                <SelectItem value="93">93%</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {testData.degree_compaction_spec === 'custom' && (
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="Enter custom percentage..."
                className="w-48 mt-2"
                onChange={(e) => updateField('degree_compaction_spec', e.target.value)}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}