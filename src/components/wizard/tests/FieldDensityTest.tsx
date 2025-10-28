import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FieldDensityTestProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function FieldDensityTest({ data, onUpdate }: FieldDensityTestProps) {
  const [proctorReports, setProctorReports] = useState<any[]>([]);
  const [testData, setTestData] = useState({
    // Test Location
    test_location: data.test_location || '',
    side: data.side || '',
    offset_m: data.offset_m || '',
    depth_mm: data.depth_mm || '',
    hole_depth_mm: data.hole_depth_mm || '',
    
    // Container Weight
    container_weight_g: data.container_weight_g || '',
    
    // Soil Weights
    soil_container_weight_g: data.soil_container_weight_g || '',
    soil_from_hole_weight_g: data.soil_from_hole_weight_g || '',
    
    // Sand Cone Data
    sand_cone_no: data.sand_cone_no || '',
    sand_before_pouring_g: data.sand_before_pouring_g || '',
    sand_after_pouring_g: data.sand_after_pouring_g || '',
    sand_in_hole_cone_base_g: data.sand_in_hole_cone_base_g || '',
    sand_in_cone_base_g: data.sand_in_cone_base_g || '',
    sand_in_hole_g: data.sand_in_hole_g || '',
    
    // Bulk Density
    bulk_density_sand_g_cm3: data.bulk_density_sand_g_cm3 || '',
    volume_hole_cm3: data.volume_hole_cm3 || '',
    wet_density_g_cm3: data.wet_density_g_cm3 || '',
    
    // Moisture Content
    container_no: data.container_no || '',
    wet_soil_container_g: data.wet_soil_container_g || '',
    dry_soil_container_g: data.dry_soil_container_g || '',
    container_weight_moisture_g: data.container_weight_moisture_g || '',
    moisture_content_percent: data.moisture_content_percent || '',
    
    // Calculated Values
    dry_density_g_cm3: data.dry_density_g_cm3 || '',
    
    // Reference Lab Values
    proctor_report_no: data.proctor_report_no || '',
    max_dry_density_g_cm3: data.max_dry_density_g_cm3 || '',
    optimum_moisture_percent: data.optimum_moisture_percent || '',
    
    // Specification
    degree_of_compaction_spec: data.degree_of_compaction_spec || '98',
    degree_of_compaction_actual: data.degree_of_compaction_actual || '',
    compliance_status: data.compliance_status || 'pending'
  });

  useEffect(() => {
    setTestData(prev => ({ ...prev, ...data }));
  }, [data]);

  useEffect(() => {
    loadProctorReports();
  }, []);

  const loadProctorReports = async () => {
    try {
      const { data: reports, error } = await supabase
        .from('test_reports')
        .select('id, report_number, test_date, data_json, summary_json')
        .eq('test_type', 'Proctor Compaction Test')
        .eq('status', 'approved')
        .order('test_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Filter reports that have maxDryDensity
      const validReports = (reports || []).filter(
        report => {
          if (typeof report.data_json === 'object' && report.data_json !== null) {
            const dataJson = report.data_json as any;
            return dataJson.maxDryDensity && dataJson.optimumMoistureContent;
          }
          return false;
        }
      );
      
      setProctorReports(validReports);
    } catch (error) {
      console.error('Error loading Proctor reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Proctor test reports',
        variant: 'destructive'
      });
    }
  };

  const handleProctorReportSelect = (reportId: string) => {
    const selectedReport = proctorReports.find(r => r.id === reportId);
    if (selectedReport && typeof selectedReport.data_json === 'object' && selectedReport.data_json !== null) {
      const dataJson = selectedReport.data_json as any;
      updateField('proctor_report_no', selectedReport.report_number);
      updateField('max_dry_density_g_cm3', dataJson.maxDryDensity);
      updateField('optimum_moisture_percent', dataJson.optimumMoistureContent);
      
      toast({
        title: 'Proctor Values Loaded',
        description: `Values from ${selectedReport.report_number} have been applied`,
      });
    }
  };

  const updateField = (field: string, value: string) => {
    setTestData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Trigger calculations when relevant fields change
      const calculatedData = performCalculations(updated);
      const finalData = { ...updated, ...calculatedData };
      
      onUpdate(finalData);
      return finalData;
    });
  };

  const performCalculations = (data: any) => {
    const calculations: any = {};
    
    // Calculate soil from hole weight
    if (data.soil_container_weight_g && data.container_weight_g) {
      calculations.soil_from_hole_weight_g = (
        parseFloat(data.soil_container_weight_g) - parseFloat(data.container_weight_g)
      ).toFixed(2);
    }
    
    // Calculate sand in hole
    if (data.sand_in_hole_cone_base_g && data.sand_in_cone_base_g) {
      calculations.sand_in_hole_g = (
        parseFloat(data.sand_in_hole_cone_base_g) - parseFloat(data.sand_in_cone_base_g)
      ).toFixed(2);
    }
    
    // Calculate volume of hole
    if (data.sand_in_hole_g && data.bulk_density_sand_g_cm3) {
      calculations.volume_hole_cm3 = (
        parseFloat(data.sand_in_hole_g) / parseFloat(data.bulk_density_sand_g_cm3)
      ).toFixed(2);
    }
    
    // Calculate wet density
    if (data.soil_from_hole_weight_g && calculations.volume_hole_cm3) {
      calculations.wet_density_g_cm3 = (
        parseFloat(data.soil_from_hole_weight_g) / parseFloat(calculations.volume_hole_cm3)
      ).toFixed(3);
    }
    
    // Calculate moisture content
    if (data.wet_soil_container_g && data.dry_soil_container_g && data.container_weight_moisture_g) {
      const wetWeight = parseFloat(data.wet_soil_container_g) - parseFloat(data.container_weight_moisture_g);
      const dryWeight = parseFloat(data.dry_soil_container_g) - parseFloat(data.container_weight_moisture_g);
      if (dryWeight > 0) {
        calculations.moisture_content_percent = (
          ((wetWeight - dryWeight) / dryWeight) * 100
        ).toFixed(2);
      }
    }
    
    // Calculate dry density
    if (calculations.wet_density_g_cm3 && calculations.moisture_content_percent) {
      calculations.dry_density_g_cm3 = (
        parseFloat(calculations.wet_density_g_cm3) / 
        (1 + parseFloat(calculations.moisture_content_percent) / 100)
      ).toFixed(3);
    }
    
    // Calculate degree of compaction
    if (calculations.dry_density_g_cm3 && data.max_dry_density_g_cm3) {
      calculations.degree_of_compaction_actual = (
        (parseFloat(calculations.dry_density_g_cm3) / parseFloat(data.max_dry_density_g_cm3)) * 100
      ).toFixed(1);
      
      // Determine compliance status
      const specPercent = parseFloat(data.degree_of_compaction_spec || '98');
      const actualPercent = parseFloat(calculations.degree_of_compaction_actual);
      calculations.compliance_status = actualPercent >= specPercent ? 'PASS' : 'FAIL';
    }
    
    return calculations;
  };

  const getComplianceStatus = () => {
    if (!testData.degree_of_compaction_actual || !testData.degree_of_compaction_spec) {
      return 'pending';
    }
    
    const actual = parseFloat(testData.degree_of_compaction_actual);
    const required = parseFloat(testData.degree_of_compaction_spec);
    
    return actual >= required ? 'PASS' : 'FAIL';
  };

  return (
    <div className="space-y-6">
      {/* Test Location */}
      <Card>
        <CardHeader>
          <CardTitle>Test Location</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Test Location</Label>
            <Input
              value={testData.test_location}
              onChange={(e) => updateField('test_location', e.target.value)}
              placeholder="e.g., Station 1+200"
            />
          </div>
          <div className="space-y-2">
            <Label>Side</Label>
            <Select value={testData.side} onValueChange={(value) => updateField('side', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select side" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
                <SelectItem value="middle">Middle</SelectItem>
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
              placeholder="0.0"
            />
          </div>
          <div className="space-y-2">
            <Label>Depth (mm)</Label>
            <Input
              type="number"
              value={testData.depth_mm}
              onChange={(e) => updateField('depth_mm', e.target.value)}
              placeholder="150"
            />
          </div>
          <div className="space-y-2">
            <Label>Hole Depth (mm)</Label>
            <Input
              type="number"
              value={testData.hole_depth_mm}
              onChange={(e) => updateField('hole_depth_mm', e.target.value)}
              placeholder="150"
            />
          </div>
        </CardContent>
      </Card>

      {/* Container and Soil Weights */}
      <Card>
        <CardHeader>
          <CardTitle>Container and Soil Weights</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Container Weight (g)</Label>
            <Input
              type="number"
              step="0.1"
              value={testData.container_weight_g}
              onChange={(e) => updateField('container_weight_g', e.target.value)}
              placeholder="0.0"
            />
          </div>
          <div className="space-y-2">
            <Label>Weight of Soil from hole + container (g)</Label>
            <Input
              type="number"
              step="0.1"
              value={testData.soil_container_weight_g}
              onChange={(e) => updateField('soil_container_weight_g', e.target.value)}
              placeholder="0.0"
            />
          </div>
          <div className="space-y-2">
            <Label>Weight of Soil from hole (g)</Label>
            <Input
              type="number"
              step="0.1"
              value={testData.soil_from_hole_weight_g}
              readOnly
              className="bg-muted"
              placeholder="Calculated automatically"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sand Cone Data */}
      <Card>
        <CardHeader>
          <CardTitle>Sand Cone Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sand cone No.</Label>
              <Input
                value={testData.sand_cone_no}
                onChange={(e) => updateField('sand_cone_no', e.target.value)}
                placeholder="SC-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Bulk density of standard sand (g/cm³)</Label>
              <Input
                type="number"
                step="0.001"
                value={testData.bulk_density_sand_g_cm3}
                onChange={(e) => updateField('bulk_density_sand_g_cm3', e.target.value)}
                placeholder="1.350"
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Weight of standard sand before pouring (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={testData.sand_before_pouring_g}
                onChange={(e) => updateField('sand_before_pouring_g', e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div className="space-y-2">
              <Label>after pouring (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={testData.sand_after_pouring_g}
                onChange={(e) => updateField('sand_after_pouring_g', e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div className="space-y-2">
              <Label>in hole + cone (+ base plate) (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={testData.sand_in_hole_cone_base_g}
                onChange={(e) => updateField('sand_in_hole_cone_base_g', e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div className="space-y-2">
              <Label>in cone + base plate (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={testData.sand_in_cone_base_g}
                onChange={(e) => updateField('sand_in_cone_base_g', e.target.value)}
                placeholder="0.0"
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
                placeholder="Calculated"
              />
            </div>
            <div className="space-y-2">
              <Label>Volume of hole (cm³)</Label>
              <Input
                type="number"
                step="0.1"
                value={testData.volume_hole_cm3}
                readOnly
                className="bg-muted"
                placeholder="Calculated"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Wet Density of Soil/ABC (g/cm³)</Label>
            <Input
              type="number"
              step="0.001"
              value={testData.wet_density_g_cm3}
              readOnly
              className="bg-muted font-semibold"
              placeholder="Calculated automatically"
            />
          </div>
        </CardContent>
      </Card>

      {/* Moisture Content */}
      <Card>
        <CardHeader>
          <CardTitle>Moisture Content</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Container No.</Label>
            <Input
              value={testData.container_no}
              onChange={(e) => updateField('container_no', e.target.value)}
              placeholder="C-001"
            />
          </div>
          <div className="space-y-2">
            <Label>Weight of wet Soil/ABC + container (g)</Label>
            <Input
              type="number"
              step="0.1"
              value={testData.wet_soil_container_g}
              onChange={(e) => updateField('wet_soil_container_g', e.target.value)}
              placeholder="0.0"
            />
          </div>
          <div className="space-y-2">
            <Label>Weight of dry Soil/ABC + container (g)</Label>
            <Input
              type="number"
              step="0.1"
              value={testData.dry_soil_container_g}
              onChange={(e) => updateField('dry_soil_container_g', e.target.value)}
              placeholder="0.0"
            />
          </div>
          <div className="space-y-2">
            <Label>Weight of container (g)</Label>
            <Input
              type="number"
              step="0.1"
              value={testData.container_weight_moisture_g}
              onChange={(e) => updateField('container_weight_moisture_g', e.target.value)}
              placeholder="0.0"
            />
          </div>
          <div className="space-y-2">
            <Label>Moisture content (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={testData.moisture_content_percent}
              readOnly
              className="bg-muted font-semibold"
              placeholder="Calculated"
            />
          </div>
          <div className="space-y-2">
            <Label>Dry density (g/cm³)</Label>
            <Input
              type="number"
              step="0.001"
              value={testData.dry_density_g_cm3}
              readOnly
              className="bg-muted font-semibold"
              placeholder="Calculated"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reference Lab Values */}
      <Card>
        <CardHeader>
          <CardTitle>Reference Lab Value (from Proctor)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Existing Proctor Report</Label>
            <Select onValueChange={handleProctorReportSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a Proctor test report..." />
              </SelectTrigger>
              <SelectContent>
                {proctorReports.length === 0 ? (
                  <SelectItem value="none" disabled>No approved Proctor reports available</SelectItem>
                ) : (
                  proctorReports.map((report) => {
                    const dataJson = typeof report.data_json === 'object' && report.data_json !== null ? report.data_json as any : null;
                    return (
                      <SelectItem key={report.id} value={report.id}>
                        {report.report_number} - {new Date(report.test_date).toLocaleDateString()} 
                        {dataJson?.maxDryDensity && ` (MDD: ${parseFloat(dataJson.maxDryDensity).toFixed(3)} g/cm³)`}
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Proctor Report Number</Label>
              <Input
                value={testData.proctor_report_no}
                onChange={(e) => updateField('proctor_report_no', e.target.value)}
                placeholder="Enter report number manually"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Dry Density (g/cm³)</Label>
              <Input
                type="number"
                step="0.001"
                value={testData.max_dry_density_g_cm3}
                onChange={(e) => updateField('max_dry_density_g_cm3', e.target.value)}
                placeholder="2.150"
              />
            </div>
            <div className="space-y-2">
              <Label>Optimum Moisture Content (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={testData.optimum_moisture_percent}
                onChange={(e) => updateField('optimum_moisture_percent', e.target.value)}
                placeholder="8.5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Specification Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Specification Requirement – Degree of Compaction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Required (%)</Label>
              <Select value={testData.degree_of_compaction_spec} onValueChange={(value) => updateField('degree_of_compaction_spec', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select requirement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="98">98%</SelectItem>
                  <SelectItem value="95">95%</SelectItem>
                  <SelectItem value="93">93%</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Actual (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={testData.degree_of_compaction_actual}
                readOnly
                className="bg-muted font-semibold"
                placeholder="Calculated"
              />
            </div>
            <div className="space-y-2">
              <Label>Compliance Status</Label>
              <div className="flex items-center h-10">
                <Badge 
                  variant={getComplianceStatus() === 'PASS' ? 'default' : getComplianceStatus() === 'FAIL' ? 'destructive' : 'secondary'}
                  className="px-3 py-1"
                >
                  {getComplianceStatus()}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}