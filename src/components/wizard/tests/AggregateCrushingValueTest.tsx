import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  sampleId: string;
  totalWeight: string;
  passingWeight: string;
  crushingValue: string;
}

interface AggregateCrushingValueTestProps {
  data: any;
  onUpdate: (data: any) => void;
  parentData?: any;
}

export function AggregateCrushingValueTest({
  data,
  onUpdate,
}: AggregateCrushingValueTestProps) {
  const [formData, setFormData] = useState({
    projectName: data.projectName || "",
    aggregateSize: data.aggregateSize || "20mm",
    dateOfTesting: data.dateOfTesting || "",
    testedBy: data.testedBy || "",
    sampleData: data.sampleData || [
      {
        id: "1",
        sampleId: "ACV001",
        totalWeight: "",
        passingWeight: "",
        crushingValue: "",
      },
      {
        id: "2",
        sampleId: "ACV002",
        totalWeight: "",
        passingWeight: "",
        crushingValue: "",
      },
      {
        id: "3",
        sampleId: "ACV003",
        totalWeight: "",
        passingWeight: "",
        crushingValue: "",
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

    // Auto-calculate crushing value when weights are entered
    if (field === "totalWeight" || field === "passingWeight") {
      const item = newData[index];
      if (item.totalWeight && item.passingWeight) {
        const totalWeight = parseFloat(item.totalWeight);
        const passingWeight = parseFloat(item.passingWeight);

        if (totalWeight > 0) {
          const crushingValue = (passingWeight / totalWeight) * 100;
          item.crushingValue = crushingValue.toFixed(2);
        }
      }
    }

    const newFormData = { ...formData, sampleData: newData };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  const addSample = () => {
    const newSample = {
      id: (formData.sampleData.length + 1).toString(),
      sampleId: `ACV${String(formData.sampleData.length + 1).padStart(3, "0")}`,
      totalWeight: "",
      passingWeight: "",
      crushingValue: "",
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

  const calculateAverageCrushingValue = () => {
    const validData = formData.sampleData.filter(
      (item) => item.crushingValue && parseFloat(item.crushingValue) > 0
    );

    if (validData.length === 0) return "0.00";

    const sum = validData.reduce(
      (acc, item) => acc + parseFloat(item.crushingValue),
      0
    );
    return (sum / validData.length).toFixed(2);
  };

  const getCrushingValueStatus = (crushingValue: number) => {
    if (crushingValue <= 10) return "Excellent - Very high strength aggregate";
    if (crushingValue <= 15) return "Good - High strength aggregate";
    if (crushingValue <= 20) return "Fair - Moderate strength aggregate";
    if (crushingValue <= 25) return "Poor - Low strength aggregate";
    return "Very Poor - Very weak aggregate";
  };

  const averageCrushingValue = calculateAverageCrushingValue();
  const crushingValueStatus = getCrushingValueStatus(
    parseFloat(averageCrushingValue)
  );

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
              <Label htmlFor="aggregateSize">Aggregate Size</Label>
              <Select
                value={formData.aggregateSize}
                onValueChange={(value) =>
                  updateFormData("aggregateSize", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20mm">20mm</SelectItem>
                  <SelectItem value="16mm">16mm</SelectItem>
                  <SelectItem value="12.5mm">12.5mm</SelectItem>
                  <SelectItem value="10mm">10mm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dateOfTesting">Date of Testing</Label>
              <Input
                id="dateOfTesting"
                type="date"
                value={formData.dateOfTesting}
                onChange={(e) =>
                  updateFormData("dateOfTesting", e.target.value)
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
          </div>
        </CardContent>
      </Card>

      {/* Aggregate Crushing Value Results */}
      <Card>
        <CardHeader>
          <CardTitle>Aggregate Crushing Value Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left">
                    Sample ID
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Total Weight (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Passing Weight (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Crushing Value (%)
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
                        value={item.sampleId}
                        onChange={(e) =>
                          updateSampleData(index, "sampleId", e.target.value)
                        }
                        placeholder="ACV001"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.totalWeight}
                        onChange={(e) =>
                          updateSampleData(index, "totalWeight", e.target.value)
                        }
                        placeholder="2000"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.passingWeight}
                        onChange={(e) =>
                          updateSampleData(
                            index,
                            "passingWeight",
                            e.target.value
                          )
                        }
                        placeholder="250"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.crushingValue}
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
              Add Sample
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Aggregate Crushing Value Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-900">
                Average Crushing Value
              </h4>
              <p className="text-3xl font-mono text-blue-800">
                {averageCrushingValue}%
              </p>
              <p className="text-sm text-blue-700 mt-1">Lower is better</p>
            </div>
            <div className="text-center p-6 bg-green-50 border border-green-200 rounded">
              <h4 className="font-semibold text-green-900">Quality Status</h4>
              <div className="text-green-800 mt-2">
                <p className="text-lg font-medium">
                  {parseFloat(averageCrushingValue) !== 0
                    ? crushingValueStatus
                    : "Insufficient data"}
                </p>
              </div>
            </div>
            <div className="text-center p-6 bg-orange-50 border border-orange-200 rounded">
              <h4 className="font-semibold text-orange-900">Test Standard</h4>
              <p className="text-lg font-mono text-orange-800">
                IS 2386 / BS 812
              </p>
              <p className="text-sm text-orange-700 mt-1">Part 4</p>
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
                <span className="font-medium">Aggregate Size:</span>
                <p className="text-muted-foreground">
                  {formData.aggregateSize}
                </p>
              </div>
              <div>
                <span className="font-medium">Number of Samples:</span>
                <p className="text-muted-foreground">
                  {formData.sampleData.length}
                </p>
              </div>
              <div>
                <span className="font-medium">Test Method:</span>
                <p className="text-muted-foreground">
                  Compression testing machine
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-900 mb-2">
              Crushing Value Specifications
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• ACV ≤ 10% for very high strength concrete</li>
              <li>• ACV ≤ 15% for high strength concrete</li>
              <li>• ACV ≤ 20% for normal concrete applications</li>
              <li>• ACV ≤ 25% for low strength applications</li>
              <li>• Lower values indicate stronger aggregates</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded">
            <h4 className="font-semibold text-purple-900 mb-2">
              Test Procedure
            </h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Prepare aggregate sample (10-12.5mm or 12.5-16mm size)</li>
              <li>• Fill cylindrical measure with aggregate in 3 layers</li>
              <li>• Compact each layer with 25 strokes of tamping rod</li>
              <li>• Place in compression testing machine</li>
              <li>• Apply load at 40 kN/min until failure</li>
              <li>• Sieve crushed material through 2.36mm sieve</li>
              <li>• Calculate crushing value as percentage</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <h4 className="font-semibold text-red-900 mb-2">
              Quality Control Notes
            </h4>
            <div className="text-sm text-red-800">
              <ul className="space-y-1">
                <li>• ACV indicates aggregate resistance to crushing</li>
                <li>
                  • Lower values indicate stronger, more durable aggregates
                </li>
                <li>• Critical for pavement and high-strength concrete</li>
                <li>
                  • Affects long-term performance and load-bearing capacity
                </li>
                <li>• Testing ensures compliance with design specifications</li>
                <li>• Results help select appropriate aggregate sources</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
