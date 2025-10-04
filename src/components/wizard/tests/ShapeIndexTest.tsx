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
  weightRetained: string;
  flakyWeight: string;
  elongatedWeight: string;
  flakyPercentage: string;
  elongatedPercentage: string;
  combinedPercentage: string;
}

interface ShapeIndexTestProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function ShapeIndexTest({ data, onUpdate }: ShapeIndexTestProps) {
  const [formData, setFormData] = useState({
    projectName: data.projectName || "",
    aggregateType: data.aggregateType || "20mm",
    dateOfTesting: data.dateOfTesting || "",
    testedBy: data.testedBy || "",
    sampleData: data.sampleData || [
      {
        id: "1",
        sampleId: "S001",
        weightRetained: "",
        flakyWeight: "",
        elongatedWeight: "",
        flakyPercentage: "",
        elongatedPercentage: "",
        combinedPercentage: "",
      },
      {
        id: "2",
        sampleId: "S002",
        weightRetained: "",
        flakyWeight: "",
        elongatedWeight: "",
        flakyPercentage: "",
        elongatedPercentage: "",
        combinedPercentage: "",
      },
      {
        id: "3",
        sampleId: "S003",
        weightRetained: "",
        flakyWeight: "",
        elongatedWeight: "",
        flakyPercentage: "",
        elongatedPercentage: "",
        combinedPercentage: "",
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

    // Auto-calculate percentages when weights are entered
    if (
      field === "weightRetained" ||
      field === "flakyWeight" ||
      field === "elongatedWeight"
    ) {
      const item = newData[index];
      if (item.weightRetained && (item.flakyWeight || item.elongatedWeight)) {
        const weightRetained = parseFloat(item.weightRetained) || 0;
        const flakyWeight = parseFloat(item.flakyWeight) || 0;
        const elongatedWeight = parseFloat(item.elongatedWeight) || 0;

        if (weightRetained > 0) {
          item.flakyPercentage = ((flakyWeight / weightRetained) * 100).toFixed(
            2
          );
          item.elongatedPercentage = (
            (elongatedWeight / weightRetained) *
            100
          ).toFixed(2);
          item.combinedPercentage = (
            ((flakyWeight + elongatedWeight) / weightRetained) *
            100
          ).toFixed(2);
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
      sampleId: `S${String(formData.sampleData.length + 1).padStart(3, "0")}`,
      weightRetained: "",
      flakyWeight: "",
      elongatedWeight: "",
      flakyPercentage: "",
      elongatedPercentage: "",
      combinedPercentage: "",
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

  const calculateAverageFlaky = () => {
    const validData = formData.sampleData.filter(
      (item) => item.flakyPercentage && parseFloat(item.flakyPercentage) > 0
    );

    if (validData.length === 0) return "0.00";

    const sum = validData.reduce(
      (acc, item) => acc + parseFloat(item.flakyPercentage),
      0
    );
    return (sum / validData.length).toFixed(2);
  };

  const calculateAverageElongated = () => {
    const validData = formData.sampleData.filter(
      (item) =>
        item.elongatedPercentage && parseFloat(item.elongatedPercentage) > 0
    );

    if (validData.length === 0) return "0.00";

    const sum = validData.reduce(
      (acc, item) => acc + parseFloat(item.elongatedPercentage),
      0
    );
    return (sum / validData.length).toFixed(2);
  };

  const calculateAverageCombined = () => {
    const validData = formData.sampleData.filter(
      (item) =>
        item.combinedPercentage && parseFloat(item.combinedPercentage) > 0
    );

    if (validData.length === 0) return "0.00";

    const sum = validData.reduce(
      (acc, item) => acc + parseFloat(item.combinedPercentage),
      0
    );
    return (sum / validData.length).toFixed(2);
  };

  const getShapeIndexStatus = (combinedIndex: number) => {
    if (combinedIndex <= 10)
      return "Excellent - Very low flaky/elongated particles";
    if (combinedIndex <= 15) return "Good - Acceptable shape characteristics";
    if (combinedIndex <= 20) return "Fair - Moderate flaky/elongated content";
    if (combinedIndex <= 25) return "Poor - High flaky/elongated content";
    return "Very Poor - Excessive flaky/elongated particles";
  };

  const averageFlaky = calculateAverageFlaky();
  const averageElongated = calculateAverageElongated();
  const averageCombined = calculateAverageCombined();
  const shapeIndexStatus = getShapeIndexStatus(parseFloat(averageCombined));

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
              <Label htmlFor="aggregateType">Aggregate Size</Label>
              <Select
                value={formData.aggregateType}
                onValueChange={(value) =>
                  updateFormData("aggregateType", value)
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
                  <SelectItem value="6.3mm">6.3mm</SelectItem>
                  <SelectItem value="4.75mm">4.75mm</SelectItem>
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

      {/* Shape Index Results */}
      <Card>
        <CardHeader>
          <CardTitle>Shape Index Test Results</CardTitle>
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
                    Weight Retained (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Flaky Weight (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Elongated Weight (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Flaky (%)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Elongated (%)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Combined (%)
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
                        placeholder="S001"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.weightRetained}
                        onChange={(e) =>
                          updateSampleData(
                            index,
                            "weightRetained",
                            e.target.value
                          )
                        }
                        placeholder="1000"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.flakyWeight}
                        onChange={(e) =>
                          updateSampleData(index, "flakyWeight", e.target.value)
                        }
                        placeholder="50"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.elongatedWeight}
                        onChange={(e) =>
                          updateSampleData(
                            index,
                            "elongatedWeight",
                            e.target.value
                          )
                        }
                        placeholder="30"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.flakyPercentage}
                        readOnly
                        className="w-16 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.elongatedPercentage}
                        readOnly
                        className="w-16 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.combinedPercentage}
                        readOnly
                        className="w-16 bg-gray-50"
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
          <CardTitle>Shape Index Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-900">
                Average Flaky Index
              </h4>
              <p className="text-3xl font-mono text-blue-800">
                {averageFlaky}%
              </p>
              <p className="text-sm text-blue-700 mt-1">Thickness ratio</p>
            </div>
            <div className="text-center p-6 bg-green-50 border border-green-200 rounded">
              <h4 className="font-semibold text-green-900">
                Average Elongated Index
              </h4>
              <p className="text-3xl font-mono text-green-800">
                {averageElongated}%
              </p>
              <p className="text-sm text-green-700 mt-1">Length ratio</p>
            </div>
            <div className="text-center p-6 bg-orange-50 border border-orange-200 rounded">
              <h4 className="font-semibold text-orange-900">
                Combined Shape Index
              </h4>
              <p className="text-3xl font-mono text-orange-800">
                {averageCombined}%
              </p>
              <p className="text-sm text-orange-700 mt-1">Overall quality</p>
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
                  {formData.aggregateType}
                </p>
              </div>
              <div>
                <span className="font-medium">Quality Status:</span>
                <p className="text-muted-foreground">{shapeIndexStatus}</p>
              </div>
              <div>
                <span className="font-medium">Number of Samples:</span>
                <p className="text-muted-foreground">
                  {formData.sampleData.length}
                </p>
              </div>
              <div>
                <span className="font-medium">Test Standard:</span>
                <p className="text-muted-foreground">BS EN 933-3 / IS 2386</p>
              </div>
              <div>
                <span className="font-medium">Test Method:</span>
                <p className="text-muted-foreground">
                  Thickness gauge & length gauge
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-900 mb-2">
              Shape Index Specifications
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Combined Shape Index ≤ 35% for bituminous mixes</li>
              <li>• Combined Shape Index ≤ 25% for high-quality concrete</li>
              <li>
                • Flaky particles: thickness less than 0.6 × mean sieve size
              </li>
              <li>
                • Elongated particles: length greater than 1.8 × mean sieve size
              </li>
              <li>• Minimum sample size: 200 particles per fraction</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded">
            <h4 className="font-semibold text-purple-900 mb-2">
              Test Procedure
            </h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Prepare representative aggregate sample</li>
              <li>• Separate into size fractions using sieves</li>
              <li>
                • Use thickness gauge (0.6 × sieve size) for flaky particles
              </li>
              <li>
                • Use length gauge (1.8 × sieve size) for elongated particles
              </li>
              <li>• Count and weigh flaky and elongated particles</li>
              <li>• Calculate percentages by weight for each fraction</li>
              <li>• Combine results for overall shape index</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <h4 className="font-semibold text-red-900 mb-2">
              Quality Control Notes
            </h4>
            <div className="text-sm text-red-800">
              <ul className="space-y-1">
                <li>
                  • High shape index reduces workability and increases voids
                </li>
                <li>
                  • Flaky particles reduce strength and increase cement
                  consumption
                </li>
                <li>
                  • Elongated particles affect concrete placement and finishing
                </li>
                <li>
                  • Shape index testing ensures aggregate quality for mix design
                </li>
                <li>
                  • Results help optimize crushing and screening processes
                </li>
                <li>
                  • Regular testing prevents poor pavement/concrete performance
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
