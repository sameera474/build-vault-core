import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { toast } from "@/hooks/use-toast";

interface TestContainerData {
  testNo: string;
  waterAdded: string;
  wetSoilPlusContainer: string;
  drySoilPlusContainer: string;
  containerWeight: string;
  waterWeight: string;
  drySoilWeight: string;
  moistureContent: string;
  wetSamplePlusMould: string;
  mouldWeight: string;
  sampleWeight: string;
  bulkDensity: string;
  dryDensity: string;
}

interface ProctorCompactionTestProps {
  data: any;
  onUpdate: (data: any) => void;
  parentData?: any; // Step 1 data passed from wizard
}

export function ProctorCompactionTest({
  data,
  onUpdate,
  parentData,
}: ProctorCompactionTestProps) {
  const [testData, setTestData] = useState(() => {
    const initialData = {
      // Header information - auto-fill from Step 1
      dateOfSampling: data.dateOfSampling || '',
      dateOfTesting: data.dateOfTesting || parentData?.test_date || '',
      typeOfMaterial: data.typeOfMaterial || '',
      sampleNo: data.sampleNo || '',
      source: data.source || '',
      location: data.location || parentData?.chainage_from || '',
      
      // Mould specifications
      mouldNo: data.mouldNo || '',
      height: data.height || '',
      diameter: data.diameter || '',
      volume: data.volume || '',
      weight: data.weight || '',
      
      // Compaction parameters
      weightOfRammer: data.weightOfRammer || '4.5',
      droppingHeight: data.droppingHeight || '450',
      numberOfLayers: data.numberOfLayers || '5',
      blowsPerLayer: data.blowsPerLayer || '25',
      
      // Test containers - initialize with at least 5 empty containers
      containers: data.containers && data.containers.length > 0 
        ? data.containers 
        : Array(5).fill(null).map((_, index) => ({
            testNo: `${index + 1}`,
            waterAdded: '',
            wetSoilPlusContainer: '',
            drySoilPlusContainer: '',
            containerWeight: '',
            waterWeight: '',
            drySoilWeight: '',
            moistureContent: '',
            wetSamplePlusMould: '',
            mouldWeight: '',
            sampleWeight: '',
            bulkDensity: '',
            dryDensity: ''
          })),
      
      // Manual adjustments for graph
      maxDryDensity: data.maxDryDensity || '',
      optimumMoistureContent: data.optimumMoistureContent || ''
    };
    
    return initialData;
  });

  const [selectedPoint, setSelectedPoint] = useState<{
    maxDryDensity?: number;
    optimumMoistureContent?: number;
  }>({
    maxDryDensity: data.maxDryDensity ? parseFloat(data.maxDryDensity) : undefined,
    optimumMoistureContent: data.optimumMoistureContent ? parseFloat(data.optimumMoistureContent) : undefined
  });

  useEffect(() => {
    onUpdate(testData);
  }, [testData]);

  const updateField = (field: string, value: any) => {
    setTestData(prev => ({ ...prev, [field]: value }));
  };

  const calculateContainerValues = (container: TestContainerData) => {
    const calculations: any = {};
    
    // Calculate water weight
    if (container.wetSoilPlusContainer && container.drySoilPlusContainer) {
      calculations.waterWeight = (
        parseFloat(container.wetSoilPlusContainer) - parseFloat(container.drySoilPlusContainer)
      ).toFixed(2);
    }
    
    // Calculate dry soil weight
    if (container.drySoilPlusContainer && container.containerWeight) {
      calculations.drySoilWeight = (
        parseFloat(container.drySoilPlusContainer) - parseFloat(container.containerWeight)
      ).toFixed(2);
    }
    
    // Calculate moisture content
    if (calculations.waterWeight && calculations.drySoilWeight) {
      const dryWeight = parseFloat(calculations.drySoilWeight);
      if (dryWeight > 0) {
        calculations.moistureContent = (
          (parseFloat(calculations.waterWeight) / dryWeight) * 100
        ).toFixed(2);
      }
    }
    
    // Calculate sample weight
    if (container.wetSamplePlusMould && container.mouldWeight) {
      calculations.sampleWeight = (
        parseFloat(container.wetSamplePlusMould) - parseFloat(container.mouldWeight)
      ).toFixed(2);
    }
    
    // Calculate bulk density
    if (calculations.sampleWeight && testData.volume) {
      const volume = parseFloat(testData.volume);
      if (volume > 0) {
        calculations.bulkDensity = (
          parseFloat(calculations.sampleWeight) / volume
        ).toFixed(3);
      }
    }
    
    // Calculate dry density
    if (calculations.bulkDensity && calculations.moistureContent) {
      const moisture = parseFloat(calculations.moistureContent);
      calculations.dryDensity = (
        parseFloat(calculations.bulkDensity) / (1 + moisture / 100)
      ).toFixed(3);
    }
    
    return calculations;
  };

  const updateContainer = (index: number, field: keyof TestContainerData, value: string) => {
    const updatedContainers = [...testData.containers];
    updatedContainers[index] = { ...updatedContainers[index], [field]: value };
    
    // Perform calculations
    const calculated = calculateContainerValues(updatedContainers[index]);
    updatedContainers[index] = { ...updatedContainers[index], ...calculated };
    
    updateField('containers', updatedContainers);
  };

  const addContainer = () => {
    const newContainer: TestContainerData = {
      testNo: `${testData.containers.length + 1}`,
      waterAdded: '',
      wetSoilPlusContainer: '',
      drySoilPlusContainer: '',
      containerWeight: '',
      waterWeight: '',
      drySoilWeight: '',
      moistureContent: '',
      wetSamplePlusMould: '',
      mouldWeight: '',
      sampleWeight: '',
      bulkDensity: '',
      dryDensity: ''
    };
    
    const updatedContainers = [...testData.containers, newContainer];
    updateField('containers', updatedContainers);
  };

  const removeContainer = (index: number) => {
    if (testData.containers.length <= 5) {
      toast({
        title: "Cannot Remove",
        description: "At least 5 test containers are required.",
        variant: "destructive"
      });
      return;
    }
    const updatedContainers = testData.containers.filter((_: any, i: number) => i !== index);
    updateField('containers', updatedContainers);
  };

  // Prepare chart data
  const chartData = testData.containers
    .filter((c: TestContainerData) => parseFloat(c.moistureContent) > 0 && parseFloat(c.dryDensity) > 0)
    .map((c: TestContainerData) => ({
      moistureContent: parseFloat(c.moistureContent),
      dryDensity: parseFloat(c.dryDensity),
    }))
    .sort((a: any, b: any) => a.moistureContent - b.moistureContent);

  const handleChartClick = (e: any) => {
    if (e && e.activeLabel !== undefined) {
      const moisture = parseFloat(e.activeLabel);
      const density = e.activePayload?.[0]?.value || 0;
      
      setSelectedPoint({
        maxDryDensity: density,
        optimumMoistureContent: moisture
      });
      
      updateField('maxDryDensity', density.toFixed(3));
      updateField('optimumMoistureContent', moisture.toFixed(1));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Information */}
      <Card>
        <CardHeader>
          <CardTitle>Test Information (BS1377 Test 13 / AASHTO T-180)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date of Sampling</Label>
              <Input
                type="date"
                value={testData.dateOfSampling}
                onChange={(e) => updateField('dateOfSampling', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Date of Testing</Label>
              <Input
                type="date"
                value={testData.dateOfTesting}
                onChange={(e) => updateField('dateOfTesting', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Type of Material</Label>
              <Input
                value={testData.typeOfMaterial}
                onChange={(e) => updateField('typeOfMaterial', e.target.value)}
                placeholder="e.g., Silty Clay"
              />
            </div>
            <div className="space-y-2">
              <Label>Sample No.</Label>
              <Input
                value={testData.sampleNo}
                onChange={(e) => updateField('sampleNo', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Input
                value={testData.source}
                onChange={(e) => updateField('source', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={testData.location}
                onChange={(e) => updateField('location', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mould and Compaction Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Mould Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Mould No.</Label>
              <Input
                value={testData.mouldNo}
                onChange={(e) => updateField('mouldNo', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Height (cm)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={testData.height}
                  onChange={(e) => updateField('height', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Diameter (cm)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={testData.diameter}
                  onChange={(e) => updateField('diameter', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Volume (cm³)</Label>
              <Input
                type="number"
                step="0.01"
                value={testData.volume}
                onChange={(e) => updateField('volume', e.target.value)}
                placeholder="944"
              />
            </div>
            <div className="space-y-2">
              <Label>Weight (g)</Label>
              <Input
                type="number"
                step="0.01"
                value={testData.weight}
                onChange={(e) => updateField('weight', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compaction Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Weight of Rammer (kg)</Label>
              <Input
                type="number"
                step="0.01"
                value={testData.weightOfRammer}
                onChange={(e) => updateField('weightOfRammer', e.target.value)}
                placeholder="4.5"
              />
            </div>
            <div className="space-y-2">
              <Label>Dropping Height (cm)</Label>
              <Input
                type="number"
                step="0.1"
                value={testData.droppingHeight}
                onChange={(e) => updateField('droppingHeight', e.target.value)}
                placeholder="450"
              />
            </div>
            <div className="space-y-2">
              <Label>Number of Layers</Label>
              <Input
                type="number"
                value={testData.numberOfLayers}
                onChange={(e) => updateField('numberOfLayers', e.target.value)}
                placeholder="5"
              />
            </div>
            <div className="space-y-2">
              <Label>Blows Per Layer</Label>
              <Input
                type="number"
                value={testData.blowsPerLayer}
                onChange={(e) => updateField('blowsPerLayer', e.target.value)}
                placeholder="25"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Data Entry */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Test Data Entry</CardTitle>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={addContainer}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Container
              </Button>
              {testData.containers.length > 5 && (
                <span className="text-sm text-muted-foreground self-center">
                  {testData.containers.length} containers (minimum 5 required)
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test No. / Container No.</TableHead>
                  <TableHead className="text-center">Water added (ml)</TableHead>
                  <TableHead className="text-center">Wet soil + container (g)</TableHead>
                  <TableHead className="text-center">Dry soil + container (g)</TableHead>
                  <TableHead className="text-center">Container weight (g)</TableHead>
                  <TableHead className="text-center bg-muted">Water weight (g)</TableHead>
                  <TableHead className="text-center bg-muted">Dry soil weight (g)</TableHead>
                  <TableHead className="text-center bg-muted">Moisture content (%)</TableHead>
                  <TableHead className="text-center">Wet sample + mould (g)</TableHead>
                  <TableHead className="text-center">Mould weight (g)</TableHead>
                  <TableHead className="text-center bg-muted">Sample weight (g)</TableHead>
                  <TableHead className="text-center bg-muted">Bulk density (g/cm³)</TableHead>
                  <TableHead className="text-center bg-muted">Dry density (g/cm³)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testData.containers.map((container: TestContainerData, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {container.testNo}
                      {testData.containers.length > 5 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeContainer(index)}
                          className="ml-2 h-6 w-6 p-0 text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.1"
                        value={container.waterAdded}
                        onChange={(e) => updateContainer(index, 'waterAdded', e.target.value)}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={container.wetSoilPlusContainer}
                        onChange={(e) => updateContainer(index, 'wetSoilPlusContainer', e.target.value)}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={container.drySoilPlusContainer}
                        onChange={(e) => updateContainer(index, 'drySoilPlusContainer', e.target.value)}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={container.containerWeight}
                        onChange={(e) => updateContainer(index, 'containerWeight', e.target.value)}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell className="text-center bg-muted/50 font-mono text-sm">
                      {container.waterWeight || '0.00'}
                    </TableCell>
                    <TableCell className="text-center bg-muted/50 font-mono text-sm">
                      {container.drySoilWeight || '0.00'}
                    </TableCell>
                    <TableCell className="text-center bg-muted/50 font-mono text-sm">
                      {container.moistureContent || '0.00'}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={container.wetSamplePlusMould}
                        onChange={(e) => updateContainer(index, 'wetSamplePlusMould', e.target.value)}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={container.mouldWeight}
                        onChange={(e) => updateContainer(index, 'mouldWeight', e.target.value)}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell className="text-center bg-muted/50 font-mono text-sm">
                      {container.sampleWeight || '0.00'}
                    </TableCell>
                    <TableCell className="text-center bg-muted/50 font-mono text-sm">
                      {container.bulkDensity || '0.000'}
                    </TableCell>
                    <TableCell className="text-center bg-muted/50 font-mono text-sm">
                      {container.dryDensity || '0.000'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Graph */}
      <Card>
        <CardHeader>
          <CardTitle>Moisture Content vs Dry Density</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                onClick={handleChartClick}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="moistureContent" 
                  label={{ value: 'Moisture Content (%)', position: 'insideBottom', offset: -5 }}
                  domain={['auto', 'auto']}
                />
                <YAxis 
                  label={{ value: 'Dry Density (g/cm³)', angle: -90, position: 'insideLeft' }}
                  domain={['auto', 'auto']}
                />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="dryDensity" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8', r: 5 }}
                  activeDot={{ r: 8 }}
                  name="Dry Density"
                />
                {selectedPoint.maxDryDensity && (
                  <ReferenceLine 
                    y={selectedPoint.maxDryDensity} 
                    stroke="red" 
                    strokeDasharray="3 3"
                    label={{ value: `Max: ${selectedPoint.maxDryDensity.toFixed(3)}`, position: 'right' }}
                  />
                )}
                {selectedPoint.optimumMoistureContent && (
                  <ReferenceLine 
                    x={selectedPoint.optimumMoistureContent} 
                    stroke="green" 
                    strokeDasharray="3 3"
                    label={{ value: `OMC: ${selectedPoint.optimumMoistureContent.toFixed(1)}%`, position: 'top' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Click on the graph to set values, or enter them manually below
          </p>

          {/* Manual adjustment fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Maximum Dry Density (g/cm³)</Label>
              <Input
                type="number"
                step="0.001"
                value={testData.maxDryDensity}
                onChange={(e) => {
                  const value = e.target.value;
                  updateField('maxDryDensity', value);
                  if (value) {
                    setSelectedPoint(prev => ({
                      ...prev,
                      maxDryDensity: parseFloat(value)
                    }));
                  }
                }}
                placeholder="e.g., 1.897"
              />
            </div>
            <div className="space-y-2">
              <Label>Optimum Moisture Content (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={testData.optimumMoistureContent}
                onChange={(e) => {
                  const value = e.target.value;
                  updateField('optimumMoistureContent', value);
                  if (value) {
                    setSelectedPoint(prev => ({
                      ...prev,
                      optimumMoistureContent: parseFloat(value)
                    }));
                  }
                }}
                placeholder="e.g., 11.89"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
