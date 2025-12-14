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
  containerWeight: string;
  containerSampleWeight: string;
  sampleWeight: string;
  containerVolume: string;
  bulkDensity: string;
}

interface BulkDensityTestProps {
  data: any;
  onUpdate: (data: any) => void;
  parentData?: any;
}

export function BulkDensityTest({ data, onUpdate }: BulkDensityTestProps) {
  const [formData, setFormData] = useState({
    projectName: data.projectName || "",
    aggregateType: data.aggregateType || "Coarse Aggregate",
    dateOfTesting: data.dateOfTesting || "",
    testedBy: data.testedBy || "",
    containerVolume: data.containerVolume || "10", // liters
    sampleData: data.sampleData || [
      {
        id: "1",
        sampleId: "BD001",
        containerWeight: "",
        containerSampleWeight: "",
        sampleWeight: "",
        containerVolume: "",
        bulkDensity: "",
      },
      {
        id: "2",
        sampleId: "BD002",
        containerWeight: "",
        containerSampleWeight: "",
        sampleWeight: "",
        containerVolume: "",
        bulkDensity: "",
      },
      {
        id: "3",
        sampleId: "BD003",
        containerWeight: "",
        containerSampleWeight: "",
        sampleWeight: "",
        containerVolume: "",
        bulkDensity: "",
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

    // Auto-calculate bulk density when all weights are available
    if (
      field === "containerWeight" ||
      field === "containerSampleWeight" ||
      field === "containerVolume"
    ) {
      const item = newData[index];
      if (
        item.containerWeight &&
        item.containerSampleWeight &&
        item.containerVolume
      ) {
        const containerWeight = parseFloat(item.containerWeight);
        const containerSampleWeight = parseFloat(item.containerSampleWeight);
        const containerVolume = parseFloat(item.containerVolume);

        if (containerVolume > 0) {
          const sampleWeight = containerSampleWeight - containerWeight;
          item.sampleWeight = sampleWeight.toFixed(2);

          const bulkDensity = sampleWeight / containerVolume;
          item.bulkDensity = bulkDensity.toFixed(2);
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
      sampleId: `BD${String(formData.sampleData.length + 1).padStart(3, "0")}`,
      containerWeight: "",
      containerSampleWeight: "",
      sampleWeight: "",
      containerVolume: formData.containerVolume,
      bulkDensity: "",
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

  const calculateAverageBulkDensity = () => {
    const validData = formData.sampleData.filter(
      (item) => item.bulkDensity && parseFloat(item.bulkDensity) > 0
    );

    if (validData.length === 0) return "0.00";

    const sum = validData.reduce(
      (acc, item) => acc + parseFloat(item.bulkDensity),
      0
    );
    return (sum / validData.length).toFixed(2);
  };

  const getBulkDensityStatus = (bulkDensity: number, aggregateType: string) => {
    if (aggregateType.includes("Coarse")) {
      if (bulkDensity >= 1600)
        return "Excellent - High density coarse aggregate";
      if (bulkDensity >= 1400) return "Good - Normal density coarse aggregate";
      if (bulkDensity >= 1200) return "Fair - Low density coarse aggregate";
      return "Poor - Very low density coarse aggregate";
    } else {
      if (bulkDensity >= 1800) return "Excellent - High density fine aggregate";
      if (bulkDensity >= 1600) return "Good - Normal density fine aggregate";
      if (bulkDensity >= 1400) return "Fair - Low density fine aggregate";
      return "Poor - Very low density fine aggregate";
    }
  };

  const averageBulkDensity = calculateAverageBulkDensity();
  const bulkDensityStatus = getBulkDensityStatus(
    parseFloat(averageBulkDensity),
    formData.aggregateType
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
              <Label htmlFor="aggregateType">Aggregate Type</Label>
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
                  <SelectItem value="Coarse Aggregate">
                    Coarse Aggregate
                  </SelectItem>
                  <SelectItem value="Fine Aggregate">Fine Aggregate</SelectItem>
                  <SelectItem value="Manufactured Sand">
                    Manufactured Sand
                  </SelectItem>
                  <SelectItem value="Natural Sand">Natural Sand</SelectItem>
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
            <div>
              <Label htmlFor="containerVolume">Container Volume (L)</Label>
              <Input
                id="containerVolume"
                type="number"
                step="0.1"
                value={formData.containerVolume}
                onChange={(e) =>
                  updateFormData("containerVolume", e.target.value)
                }
                placeholder="10.0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Density Results */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Density Test Results</CardTitle>
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
                    Container Weight (kg)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Container + Sample (kg)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Sample Weight (kg)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Volume (L)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Bulk Density (kg/m³)
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
                        placeholder="BD001"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.containerWeight}
                        onChange={(e) =>
                          updateSampleData(
                            index,
                            "containerWeight",
                            e.target.value
                          )
                        }
                        placeholder="5.00"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.containerSampleWeight}
                        onChange={(e) =>
                          updateSampleData(
                            index,
                            "containerSampleWeight",
                            e.target.value
                          )
                        }
                        placeholder="15.00"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.sampleWeight}
                        readOnly
                        className="w-20 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.containerVolume}
                        onChange={(e) =>
                          updateSampleData(
                            index,
                            "containerVolume",
                            e.target.value
                          )
                        }
                        placeholder="10.0"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.bulkDensity}
                        readOnly
                        className="w-24 bg-gray-50"
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
          <CardTitle>Bulk Density Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-900">
                Average Bulk Density
              </h4>
              <p className="text-3xl font-mono text-blue-800">
                {averageBulkDensity}
              </p>
              <p className="text-sm text-blue-700 mt-1">kg/m³</p>
            </div>
            <div className="text-center p-6 bg-green-50 border border-green-200 rounded">
              <h4 className="font-semibold text-green-900">Quality Status</h4>
              <div className="text-green-800 mt-2">
                <p className="text-lg font-medium">
                  {parseFloat(averageBulkDensity) !== 0
                    ? bulkDensityStatus
                    : "Insufficient data"}
                </p>
              </div>
            </div>
            <div className="text-center p-6 bg-orange-50 border border-orange-200 rounded">
              <h4 className="font-semibold text-orange-900">Test Standard</h4>
              <p className="text-lg font-mono text-orange-800">
                IS 2386 / ASTM C29
              </p>
              <p className="text-sm text-orange-700 mt-1">Part 3</p>
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
                <span className="font-medium">Aggregate Type:</span>
                <p className="text-muted-foreground">
                  {formData.aggregateType}
                </p>
              </div>
              <div>
                <span className="font-medium">Container Volume:</span>
                <p className="text-muted-foreground">
                  {formData.containerVolume} L
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
                <p className="text-muted-foreground">Container method</p>
              </div>
              <div>
                <span className="font-medium">Units:</span>
                <p className="text-muted-foreground">kg/m³</p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-900 mb-2">
              Bulk Density Specifications
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Coarse Aggregate: 1400-1800 kg/m³ (typical range)</li>
              <li>• Fine Aggregate: 1500-1900 kg/m³ (typical range)</li>
              <li>• Higher density indicates better packing and strength</li>
              <li>• Affects concrete yield and mix proportions</li>
              <li>• Critical for volumetric calculations in mix design</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded">
            <h4 className="font-semibold text-purple-900 mb-2">
              Test Procedure
            </h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Clean and dry the container thoroughly</li>
              <li>• Weigh the empty container</li>
              <li>• Fill container with aggregate to overflowing</li>
              <li>• Strike off excess with straight edge</li>
              <li>• Weigh the container filled with aggregate</li>
              <li>• Calculate sample weight by subtraction</li>
              <li>• Divide sample weight by container volume</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <h4 className="font-semibold text-red-900 mb-2">
              Quality Control Notes
            </h4>
            <div className="text-sm text-red-800">
              <ul className="space-y-1">
                <li>• Bulk density affects concrete mix design proportions</li>
                <li>• Higher values indicate better aggregate quality</li>
                <li>
                  • Critical for calculating cement and water requirements
                </li>
                <li>• Affects concrete yield and cost calculations</li>
                <li>• Important for quality control and consistency</li>
                <li>• Regular testing ensures uniform concrete properties</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
