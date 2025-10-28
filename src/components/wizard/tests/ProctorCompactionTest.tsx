import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Button } from "@/components/ui/button";

interface TestContainerData {
  containerNo: string;
  waterAdded: string;
  wetSoilPlusContainer: string;
  drySoilPlusContainer: string;
  containerWeight: string;
  waterWeight: string; // calculated
  drySoilWeight: string; // calculated
  moistureContent: string; // calculated
  wetSamplePlusMould: string;
  mouldWeight: string;
  sampleWeight: string; // calculated
  bulkDensity: string; // calculated
  dryDensity: string; // calculated
}

interface ProctorCompactionTestProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function ProctorCompactionTest({
  data,
  onUpdate,
}: ProctorCompactionTestProps) {
  const [formData, setFormData] = useState({
    // Header Info
    dateOfSampling: data.dateOfSampling || "",
    dateOfTesting: data.dateOfTesting || "",
    typeOfMaterial: data.typeOfMaterial || "",
    sampleNo: data.sampleNo || "",
    source: data.source || "",
    location: data.location || "",
    
    // Mould Specifications
    mouldNo: data.mouldNo || "",
    mouldHeight: data.mouldHeight || "",
    mouldDiameter: data.mouldDiameter || "",
    mouldVolume: data.mouldVolume || "",
    mouldWeight: data.mouldWeight || "",
    
    // Compaction Parameters
    rammerWeight: data.rammerWeight || "",
    droppingHeight: data.droppingHeight || "",
    numberOfLayers: data.numberOfLayers || "",
    blowsPerLayer: data.blowsPerLayer || "",
    
    // Test Container Data
    testContainers: data.testContainers || [
      {
        containerNo: "1",
        waterAdded: "",
        wetSoilPlusContainer: "",
        drySoilPlusContainer: "",
        containerWeight: "",
        waterWeight: "",
        drySoilWeight: "",
        moistureContent: "",
        wetSamplePlusMould: "",
        mouldWeight: "",
        sampleWeight: "",
        bulkDensity: "",
        dryDensity: "",
      },
      {
        containerNo: "2",
        waterAdded: "",
        wetSoilPlusContainer: "",
        drySoilPlusContainer: "",
        containerWeight: "",
        waterWeight: "",
        drySoilWeight: "",
        moistureContent: "",
        wetSamplePlusMould: "",
        mouldWeight: "",
        sampleWeight: "",
        bulkDensity: "",
        dryDensity: "",
      },
      {
        containerNo: "3",
        waterAdded: "",
        wetSoilPlusContainer: "",
        drySoilPlusContainer: "",
        containerWeight: "",
        waterWeight: "",
        drySoilWeight: "",
        moistureContent: "",
        wetSamplePlusMould: "",
        mouldWeight: "",
        sampleWeight: "",
        bulkDensity: "",
        dryDensity: "",
      },
      {
        containerNo: "4",
        waterAdded: "",
        wetSoilPlusContainer: "",
        drySoilPlusContainer: "",
        containerWeight: "",
        waterWeight: "",
        drySoilWeight: "",
        moistureContent: "",
        wetSamplePlusMould: "",
        mouldWeight: "",
        sampleWeight: "",
        bulkDensity: "",
        dryDensity: "",
      },
    ],
    
    // Manual selections from graph
    maxDryDensity: data.maxDryDensity || "",
    optimumMoistureContent: data.optimumMoistureContent || "",
  });

  const [selectedPoint, setSelectedPoint] = useState<{x: number, y: number} | null>(
    data.selectedPoint || null
  );

  const updateFormData = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onUpdate({ ...newData, selectedPoint });
  };

  const calculateContainerValues = (container: TestContainerData, mouldVolume: string) => {
    const wetSoil = parseFloat(container.wetSoilPlusContainer) || 0;
    const drySoil = parseFloat(container.drySoilPlusContainer) || 0;
    const containerWt = parseFloat(container.containerWeight) || 0;
    const wetSampleMould = parseFloat(container.wetSamplePlusMould) || 0;
    const mouldWt = parseFloat(container.mouldWeight || formData.mouldWeight) || 0;
    const volume = parseFloat(mouldVolume) || 0;

    // Calculate derived values
    const waterWt = wetSoil - drySoil;
    const drySoilWt = drySoil - containerWt;
    const moistureContent = drySoilWt > 0 ? (waterWt / drySoilWt) * 100 : 0;
    const sampleWt = wetSampleMould - mouldWt;
    const bulkDensity = volume > 0 ? sampleWt / volume : 0;
    const dryDensity = moistureContent > 0 ? bulkDensity / (1 + moistureContent / 100) : bulkDensity;

    return {
      waterWeight: waterWt.toFixed(2),
      drySoilWeight: drySoilWt.toFixed(2),
      moistureContent: moistureContent.toFixed(2),
      sampleWeight: sampleWt.toFixed(2),
      bulkDensity: bulkDensity.toFixed(3),
      dryDensity: dryDensity.toFixed(3),
    };
  };

  const updateTestContainer = (index: number, field: keyof TestContainerData, value: string) => {
    const newContainers = [...formData.testContainers];
    newContainers[index] = { ...newContainers[index], [field]: value };

    // Auto-calculate derived values
    const calculated = calculateContainerValues(newContainers[index], formData.mouldVolume);
    newContainers[index] = { ...newContainers[index], ...calculated };

    const newFormData = { ...formData, testContainers: newContainers };
    setFormData(newFormData);
    onUpdate({ ...newFormData, selectedPoint });
  };

  // Prepare chart data
  const chartData = formData.testContainers
    .filter(c => parseFloat(c.moistureContent) > 0 && parseFloat(c.dryDensity) > 0)
    .map(c => ({
      moistureContent: parseFloat(c.moistureContent),
      dryDensity: parseFloat(c.dryDensity),
    }))
    .sort((a, b) => a.moistureContent - b.moistureContent);

  const handleChartClick = (e: any) => {
    if (e && e.activeLabel !== undefined) {
      const clickedPoint = {
        x: parseFloat(e.activeLabel),
        y: e.activePayload?.[0]?.value || 0
      };
      setSelectedPoint(clickedPoint);
      
      const newFormData = {
        ...formData,
        optimumMoistureContent: clickedPoint.x.toFixed(2),
        maxDryDensity: clickedPoint.y.toFixed(3),
      };
      setFormData(newFormData);
      onUpdate({ ...newFormData, selectedPoint: clickedPoint });
    }
  };

  useEffect(() => {
    // Recalculate all containers when mould volume changes
    if (formData.mouldVolume) {
      const newContainers = formData.testContainers.map(container => {
        const calculated = calculateContainerValues(container, formData.mouldVolume);
        return { ...container, ...calculated };
      });
      
      const newFormData = { ...formData, testContainers: newContainers };
      setFormData(newFormData);
      onUpdate({ ...newFormData, selectedPoint });
    }
  }, [formData.mouldVolume]);

  return (
    <div className="space-y-6">
      {/* Header Information */}
      <Card>
        <CardHeader>
          <CardTitle>Test Information (BS1377 Test 13 / AASHTO T-180)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dateOfSampling">Date of Sampling</Label>
              <Input
                id="dateOfSampling"
                type="date"
                value={formData.dateOfSampling}
                onChange={(e) => updateFormData("dateOfSampling", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dateOfTesting">Date of Testing</Label>
              <Input
                id="dateOfTesting"
                type="date"
                value={formData.dateOfTesting}
                onChange={(e) => updateFormData("dateOfTesting", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="typeOfMaterial">Type of Material</Label>
              <Input
                id="typeOfMaterial"
                value={formData.typeOfMaterial}
                onChange={(e) => updateFormData("typeOfMaterial", e.target.value)}
                placeholder="e.g., Silty Clay"
              />
            </div>
            <div>
              <Label htmlFor="sampleNo">Sample No.</Label>
              <Input
                id="sampleNo"
                value={formData.sampleNo}
                onChange={(e) => updateFormData("sampleNo", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => updateFormData("source", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateFormData("location", e.target.value)}
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
            <div>
              <Label htmlFor="mouldNo">Mould No.</Label>
              <Input
                id="mouldNo"
                value={formData.mouldNo}
                onChange={(e) => updateFormData("mouldNo", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="mouldHeight">Height (cm)</Label>
                <Input
                  id="mouldHeight"
                  type="number"
                  step="0.01"
                  value={formData.mouldHeight}
                  onChange={(e) => updateFormData("mouldHeight", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="mouldDiameter">Diameter (cm)</Label>
                <Input
                  id="mouldDiameter"
                  type="number"
                  step="0.01"
                  value={formData.mouldDiameter}
                  onChange={(e) => updateFormData("mouldDiameter", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="mouldVolume">Volume (cm³)</Label>
              <Input
                id="mouldVolume"
                type="number"
                step="0.01"
                value={formData.mouldVolume}
                onChange={(e) => updateFormData("mouldVolume", e.target.value)}
                placeholder="944"
              />
            </div>
            <div>
              <Label htmlFor="mouldWeight">Weight (g)</Label>
              <Input
                id="mouldWeight"
                type="number"
                step="0.01"
                value={formData.mouldWeight}
                onChange={(e) => updateFormData("mouldWeight", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compaction Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="rammerWeight">Weight of Rammer (kg)</Label>
              <Input
                id="rammerWeight"
                type="number"
                step="0.01"
                value={formData.rammerWeight}
                onChange={(e) => updateFormData("rammerWeight", e.target.value)}
                placeholder="4.5"
              />
            </div>
            <div>
              <Label htmlFor="droppingHeight">Dropping Height (cm)</Label>
              <Input
                id="droppingHeight"
                type="number"
                step="0.1"
                value={formData.droppingHeight}
                onChange={(e) => updateFormData("droppingHeight", e.target.value)}
                placeholder="450"
              />
            </div>
            <div>
              <Label htmlFor="numberOfLayers">Number of Layers</Label>
              <Input
                id="numberOfLayers"
                type="number"
                value={formData.numberOfLayers}
                onChange={(e) => updateFormData("numberOfLayers", e.target.value)}
                placeholder="5"
              />
            </div>
            <div>
              <Label htmlFor="blowsPerLayer">Blows Per Layer</Label>
              <Input
                id="blowsPerLayer"
                type="number"
                value={formData.blowsPerLayer}
                onChange={(e) => updateFormData("blowsPerLayer", e.target.value)}
                placeholder="25"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Data Entry */}
      <Card>
        <CardHeader>
          <CardTitle>Test Data Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-2 text-left">Test No. / Container No.</th>
                  {formData.testContainers.map((c) => (
                    <th key={c.containerNo} className="border border-border p-2 text-center">
                      {c.containerNo}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border p-2 font-medium">Water added (ml)</td>
                  {formData.testContainers.map((c, i) => (
                    <td key={c.containerNo} className="border border-border p-1">
                      <Input
                        type="number"
                        step="0.01"
                        className="h-8 text-center"
                        value={c.waterAdded}
                        onChange={(e) => updateTestContainer(i, "waterAdded", e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-border p-2 font-medium">Weight of wet soil + container (g)</td>
                  {formData.testContainers.map((c, i) => (
                    <td key={c.containerNo} className="border border-border p-1">
                      <Input
                        type="number"
                        step="0.01"
                        className="h-8 text-center"
                        value={c.wetSoilPlusContainer}
                        onChange={(e) => updateTestContainer(i, "wetSoilPlusContainer", e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-border p-2 font-medium">Weight of dry soil + container (g)</td>
                  {formData.testContainers.map((c, i) => (
                    <td key={c.containerNo} className="border border-border p-1">
                      <Input
                        type="number"
                        step="0.01"
                        className="h-8 text-center"
                        value={c.drySoilPlusContainer}
                        onChange={(e) => updateTestContainer(i, "drySoilPlusContainer", e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-border p-2 font-medium">Weight of container (g)</td>
                  {formData.testContainers.map((c, i) => (
                    <td key={c.containerNo} className="border border-border p-1">
                      <Input
                        type="number"
                        step="0.01"
                        className="h-8 text-center"
                        value={c.containerWeight}
                        onChange={(e) => updateTestContainer(i, "containerWeight", e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
                <tr className="bg-muted/50">
                  <td className="border border-border p-2 font-medium">Weight of water (g)</td>
                  {formData.testContainers.map((c) => (
                    <td key={c.containerNo} className="border border-border p-2 text-center font-mono">
                      {c.waterWeight || "0.00"}
                    </td>
                  ))}
                </tr>
                <tr className="bg-muted/50">
                  <td className="border border-border p-2 font-medium">Weight of dry soil (g)</td>
                  {formData.testContainers.map((c) => (
                    <td key={c.containerNo} className="border border-border p-2 text-center font-mono">
                      {c.drySoilWeight || "0.00"}
                    </td>
                  ))}
                </tr>
                <tr className="bg-muted/50">
                  <td className="border border-border p-2 font-medium">Moisture content (%)</td>
                  {formData.testContainers.map((c) => (
                    <td key={c.containerNo} className="border border-border p-2 text-center font-mono font-semibold">
                      {c.moistureContent || "0.00"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-border p-2 font-medium">Weight of wet sample + mould (g)</td>
                  {formData.testContainers.map((c, i) => (
                    <td key={c.containerNo} className="border border-border p-1">
                      <Input
                        type="number"
                        step="0.01"
                        className="h-8 text-center"
                        value={c.wetSamplePlusMould}
                        onChange={(e) => updateTestContainer(i, "wetSamplePlusMould", e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-border p-2 font-medium">Weight of mould (g)</td>
                  {formData.testContainers.map((c, i) => (
                    <td key={c.containerNo} className="border border-border p-1">
                      <Input
                        type="number"
                        step="0.01"
                        className="h-8 text-center"
                        value={c.mouldWeight || formData.mouldWeight}
                        onChange={(e) => updateTestContainer(i, "mouldWeight", e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
                <tr className="bg-muted/50">
                  <td className="border border-border p-2 font-medium">Weight of sample (g)</td>
                  {formData.testContainers.map((c) => (
                    <td key={c.containerNo} className="border border-border p-2 text-center font-mono">
                      {c.sampleWeight || "0.00"}
                    </td>
                  ))}
                </tr>
                <tr className="bg-muted/50">
                  <td className="border border-border p-2 font-medium">Bulk density (g/cm³)</td>
                  {formData.testContainers.map((c) => (
                    <td key={c.containerNo} className="border border-border p-2 text-center font-mono">
                      {c.bulkDensity || "0.000"}
                    </td>
                  ))}
                </tr>
                <tr className="bg-muted/50">
                  <td className="border border-border p-2 font-medium">Dry density (g/cm³)</td>
                  {formData.testContainers.map((c) => (
                    <td key={c.containerNo} className="border border-border p-2 text-center font-mono font-semibold">
                      {c.dryDensity || "0.000"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Graph */}
      <Card>
        <CardHeader>
          <CardTitle>Compaction Curve</CardTitle>
          <p className="text-sm text-muted-foreground">Click on the graph to select the maximum dry density and optimum moisture content</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={chartData}
              onClick={handleChartClick}
              margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="moistureContent" 
                label={{ value: 'Optimum Moisture Content %', position: 'insideBottom', offset: -10 }}
                domain={['dataMin - 1', 'dataMax + 1']}
              />
              <YAxis 
                label={{ value: 'Maximum Dry Density (g/cm³)', angle: -90, position: 'insideLeft' }}
                domain={['dataMin - 0.05', 'dataMax + 0.05']}
              />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="dryDensity" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Dry Density"
                dot={{ r: 5, fill: 'hsl(var(--primary))' }}
              />
              {selectedPoint && (
                <>
                  <ReferenceLine 
                    x={selectedPoint.x} 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label={{ value: `OMC: ${selectedPoint.x.toFixed(2)}%`, position: 'top' }}
                  />
                  <ReferenceLine 
                    y={selectedPoint.y} 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label={{ value: `MDD: ${selectedPoint.y.toFixed(3)}`, position: 'right' }}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border border-border rounded-lg bg-card">
              <Label className="text-sm font-medium">Maximum dry density (g/cm³)</Label>
              <Input
                type="number"
                step="0.001"
                className="mt-2 text-2xl font-mono font-bold text-center"
                value={formData.maxDryDensity}
                onChange={(e) => updateFormData("maxDryDensity", e.target.value)}
                placeholder="Select from graph or enter manually"
              />
            </div>
            <div className="p-6 border border-border rounded-lg bg-card">
              <Label className="text-sm font-medium">Optimum moisture content (%)</Label>
              <Input
                type="number"
                step="0.01"
                className="mt-2 text-2xl font-mono font-bold text-center"
                value={formData.optimumMoistureContent}
                onChange={(e) => updateFormData("optimumMoistureContent", e.target.value)}
                placeholder="Select from graph or enter manually"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
