import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface SampleData {
  id: string;
  sectionId: string;
  length: string;
  width: string;
  area: string;
  binderWeight: string;
  spreadRate: string;
}

interface SpreadRateOfBinderTestProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function SpreadRateOfBinderTest({
  data,
  onUpdate,
}: SpreadRateOfBinderTestProps) {
  const [formData, setFormData] = useState({
    projectName: data.projectName || "",
    roadSection: data.roadSection || "",
    dateOfApplication: data.dateOfApplication || "",
    testedBy: data.testedBy || "",
    binderType: data.binderType || "60/70 Penetration Grade",
    applicationMethod: data.applicationMethod || "Spray",
    targetSpreadRate: data.targetSpreadRate || "",
    temperature: data.temperature || "",
    weatherConditions: data.weatherConditions || "",
    sampleData: data.sampleData || [
      {
        id: "1",
        sectionId: "Section A",
        length: "",
        width: "",
        area: "",
        binderWeight: "",
        spreadRate: "",
      },
      {
        id: "2",
        sectionId: "Section B",
        length: "",
        width: "",
        area: "",
        binderWeight: "",
        spreadRate: "",
      },
      {
        id: "3",
        sectionId: "Section C",
        length: "",
        width: "",
        area: "",
        binderWeight: "",
        spreadRate: "",
      },
    ],
  });

  const updateFormData = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onUpdate(newData);
  };

  const updateSampleData = (index: number, field: string, value: string) => {
    const newData = [...formData.sampleData];
    newData[index] = { ...newData[index], [field]: value };

    // Auto-calculate area and spread rate
    if (field === "length" || field === "width") {
      const item = newData[index];
      if (item.length && item.width) {
        const area = parseFloat(item.length) * parseFloat(item.width);
        item.area = area.toFixed(2);
      }
    }

    if (field === "area" || field === "binderWeight") {
      const item = newData[index];
      if (item.area && item.binderWeight && parseFloat(item.area) > 0) {
        // Spread Rate = (Binder Weight / Area) × 1000 (kg/m² to g/m²)
        const spreadRate =
          (parseFloat(item.binderWeight) / parseFloat(item.area)) * 1000;
        item.spreadRate = spreadRate.toFixed(2);
      }
    }

    const newFormData = { ...formData, sampleData: newData };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  const addSample = () => {
    const newSample = {
      id: (formData.sampleData.length + 1).toString(),
      sectionId: `Section ${String.fromCharCode(
        65 + formData.sampleData.length
      )}`,
      length: "",
      width: "",
      area: "",
      binderWeight: "",
      spreadRate: "",
    };
    const newData = {
      ...formData,
      sampleData: [...formData.sampleData, newSample],
    };
    setFormData(newData);
    onUpdate(newData);
  };

  const removeSample = (index: number) => {
    if (formData.sampleData.length > 1) {
      const newData = {
        ...formData,
        sampleData: formData.sampleData.filter((_, i) => i !== index),
      };
      setFormData(newData);
      onUpdate(newData);
    }
  };

  const calculateAverageSpreadRate = () => {
    const validData = formData.sampleData.filter(
      (item) => item.spreadRate && parseFloat(item.spreadRate) > 0
    );

    if (validData.length === 0) return "0.00";

    const sum = validData.reduce(
      (acc, item) => acc + parseFloat(item.spreadRate),
      0
    );
    return (sum / validData.length).toFixed(2);
  };

  const getSpreadRateCompliance = (actualRate: number, targetRate: number) => {
    if (!targetRate) return "Target not specified";

    const deviation = (Math.abs(actualRate - targetRate) / targetRate) * 100;

    if (deviation <= 5) return "Within tolerance (±5%)";
    if (deviation <= 10) return "Acceptable (±10%)";
    return "Out of tolerance (>±10%)";
  };

  const averageSpreadRate = calculateAverageSpreadRate();
  const targetRate = parseFloat(formData.targetSpreadRate) || 0;

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={formData.projectName}
                onChange={(e) => updateFormData("projectName", e.target.value)}
                placeholder="Enter project name"
              />
            </div>
            <div>
              <Label htmlFor="roadSection">Road Section</Label>
              <Input
                id="roadSection"
                value={formData.roadSection}
                onChange={(e) => updateFormData("roadSection", e.target.value)}
                placeholder="Chainage or section details"
              />
            </div>
            <div>
              <Label htmlFor="dateOfApplication">Date of Application</Label>
              <Input
                id="dateOfApplication"
                type="date"
                value={formData.dateOfApplication}
                onChange={(e) =>
                  updateFormData("dateOfApplication", e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="testedBy">Tested By</Label>
              <Input
                id="testedBy"
                value={formData.testedBy}
                onChange={(e) => updateFormData("testedBy", e.target.value)}
                placeholder="Name of technician"
              />
            </div>
            <div>
              <Label htmlFor="binderType">Binder Type</Label>
              <Select
                value={formData.binderType}
                onValueChange={(value) => updateFormData("binderType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60/70 Penetration Grade">
                    60/70 Penetration Grade
                  </SelectItem>
                  <SelectItem value="80/100 Penetration Grade">
                    80/100 Penetration Grade
                  </SelectItem>
                  <SelectItem value="Modified Binder">
                    Modified Binder
                  </SelectItem>
                  <SelectItem value="PMB (Polymer Modified)">
                    PMB (Polymer Modified)
                  </SelectItem>
                  <SelectItem value="CRMB (Crumb Rubber)">
                    CRMB (Crumb Rubber)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="applicationMethod">Application Method</Label>
              <Select
                value={formData.applicationMethod}
                onValueChange={(value) =>
                  updateFormData("applicationMethod", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Spray">Spray</SelectItem>
                  <SelectItem value="Pressure Distributor">
                    Pressure Distributor
                  </SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="targetSpreadRate">
                Target Spread Rate (g/m²)
              </Label>
              <Input
                id="targetSpreadRate"
                type="number"
                step="0.1"
                value={formData.targetSpreadRate}
                onChange={(e) =>
                  updateFormData("targetSpreadRate", e.target.value)
                }
                placeholder="1200"
              />
            </div>
            <div>
              <Label htmlFor="temperature">Temperature (°C)</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => updateFormData("temperature", e.target.value)}
                placeholder="25"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="weatherConditions">Weather Conditions</Label>
            <Textarea
              id="weatherConditions"
              value={formData.weatherConditions}
              onChange={(e) =>
                updateFormData("weatherConditions", e.target.value)
              }
              placeholder="Describe weather conditions during application"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Spread Rate Measurements */}
      <Card>
        <CardHeader>
          <CardTitle>Spread Rate Measurements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left">
                    Section ID
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Length (m)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Width (m)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Area (m²)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Binder Weight (kg)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Spread Rate (g/m²)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {formData.sampleData.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.sectionId}
                        onChange={(e) =>
                          updateSampleData(index, "sectionId", e.target.value)
                        }
                        placeholder="Section A"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.length}
                        onChange={(e) =>
                          updateSampleData(index, "length", e.target.value)
                        }
                        placeholder="10.0"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.width}
                        onChange={(e) =>
                          updateSampleData(index, "width", e.target.value)
                        }
                        placeholder="3.0"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.area}
                        readOnly
                        className="w-16 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.binderWeight}
                        onChange={(e) =>
                          updateSampleData(
                            index,
                            "binderWeight",
                            e.target.value
                          )
                        }
                        placeholder="3.6"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.spreadRate}
                        readOnly
                        className="w-20 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSample(index)}
                        disabled={formData.sampleData.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Button onClick={addSample} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Spread Rate of Binder Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-900">
                Average Spread Rate
              </h4>
              <p className="text-3xl font-mono text-blue-800">
                {averageSpreadRate} g/m²
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Average of all sections
              </p>
            </div>
            <div className="text-center p-6 bg-green-50 border border-green-200 rounded">
              <h4 className="font-semibold text-green-900">
                Compliance Status
              </h4>
              <div className="text-green-800 mt-2">
                <p className="text-lg font-medium">
                  {parseFloat(averageSpreadRate) !== 0 && targetRate !== 0
                    ? getSpreadRateCompliance(
                        parseFloat(averageSpreadRate),
                        targetRate
                      )
                    : "Target not specified"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
            <h4 className="font-semibold text-gray-900 mb-2">
              Test Method Summary
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Project:</span>
                <p className="text-muted-foreground">
                  {formData.projectName || "Not specified"}
                </p>
              </div>
              <div>
                <span className="font-medium">Road Section:</span>
                <p className="text-muted-foreground">
                  {formData.roadSection || "Not specified"}
                </p>
              </div>
              <div>
                <span className="font-medium">Binder Type:</span>
                <p className="text-muted-foreground">{formData.binderType}</p>
              </div>
              <div>
                <span className="font-medium">Application Method:</span>
                <p className="text-muted-foreground">
                  {formData.applicationMethod}
                </p>
              </div>
              <div>
                <span className="font-medium">Target Rate:</span>
                <p className="text-muted-foreground">
                  {formData.targetSpreadRate} g/m²
                </p>
              </div>
              <div>
                <span className="font-medium">Temperature:</span>
                <p className="text-muted-foreground">
                  {formData.temperature}°C
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-900 mb-2">
              Spread Rate Guidelines
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Prime coat: 800-1200 g/m²</li>
              <li>• Tack coat: 300-600 g/m²</li>
              <li>• Surface dressing: 1000-1500 g/m²</li>
              <li>• Binder course: 1200-1800 g/m²</li>
              <li>• Wearing course: 1400-2000 g/m²</li>
              <li>• Tolerance: ±10% of target rate</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded">
            <h4 className="font-semibold text-purple-900 mb-2">
              Test Procedure
            </h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>
                • Mark test sections of known area (typically 10m × 3m = 30m²)
              </li>
              <li>• Weigh the distributor before and after application</li>
              <li>
                • Calculate spread rate: (Weight difference / Area) × 1000
              </li>
              <li>• Take multiple measurements across the road width</li>
              <li>• Ensure uniform distribution and correct temperature</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <h4 className="font-semibold text-red-900 mb-2">
              Quality Control Notes
            </h4>
            <div className="text-sm text-red-800">
              <ul className="space-y-1">
                <li>
                  • Spread rate affects bond strength and pavement performance
                </li>
                <li>• Too low: Poor adhesion, premature failure</li>
                <li>• Too high: Excess binder, bleeding, safety issues</li>
                <li>• Temperature affects viscosity and application</li>
                <li>• Weather conditions must be suitable for application</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
