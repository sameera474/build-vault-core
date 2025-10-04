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
  sampleId: string;
  ovenDryWeight: string;
  saturatedWeight: string;
  submergedWeight: string;
  waterAbsorption: string;
}

interface WaterAbsorptionTestProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function WaterAbsorptionTest({
  data,
  onUpdate,
}: WaterAbsorptionTestProps) {
  const [formData, setFormData] = useState({
    sampleDescription: data.sampleDescription || "",
    materialType: data.materialType || "Coarse Aggregate",
    dateOfTesting: data.dateOfTesting || "",
    testedBy: data.testedBy || "",
    soakingPeriod: data.soakingPeriod || "24", // hours
    sampleData: data.sampleData || [
      {
        id: "1",
        sampleId: "Sample A",
        ovenDryWeight: "",
        saturatedWeight: "",
        submergedWeight: "",
        waterAbsorption: "",
      },
      {
        id: "2",
        sampleId: "Sample B",
        ovenDryWeight: "",
        saturatedWeight: "",
        submergedWeight: "",
        waterAbsorption: "",
      },
      {
        id: "3",
        sampleId: "Sample C",
        ovenDryWeight: "",
        saturatedWeight: "",
        submergedWeight: "",
        waterAbsorption: "",
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

    // Auto-calculate water absorption if all weights are provided
    if (
      field === "ovenDryWeight" ||
      field === "saturatedWeight" ||
      field === "submergedWeight"
    ) {
      const item = newData[index];
      if (item.ovenDryWeight && item.saturatedWeight && item.submergedWeight) {
        const ovenDry = parseFloat(item.ovenDryWeight);
        const saturated = parseFloat(item.saturatedWeight);
        const submerged = parseFloat(item.submergedWeight);

        if (ovenDry > 0) {
          // Water Absorption = [(Saturated Weight - Oven Dry Weight) / Oven Dry Weight] × 100
          const waterAbsorption = ((saturated - ovenDry) / ovenDry) * 100;
          item.waterAbsorption = waterAbsorption.toFixed(2);
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
      sampleId: `Sample ${String.fromCharCode(
        65 + formData.sampleData.length
      )}`,
      ovenDryWeight: "",
      saturatedWeight: "",
      submergedWeight: "",
      waterAbsorption: "",
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

  const calculateAverageAbsorption = () => {
    const validData = formData.sampleData.filter(
      (item) => item.waterAbsorption && parseFloat(item.waterAbsorption) > 0
    );

    if (validData.length === 0) return "0.00";

    const sum = validData.reduce(
      (acc, item) => acc + parseFloat(item.waterAbsorption),
      0
    );
    return (sum / validData.length).toFixed(2);
  };

  const getClassification = (absorption: number) => {
    if (absorption <= 0.5) return "Excellent - Very Low Absorption";
    if (absorption <= 1.0) return "Good - Low Absorption";
    if (absorption <= 2.0) return "Fair - Moderate Absorption";
    if (absorption <= 3.0) return "Poor - High Absorption";
    return "Very Poor - Excessive Absorption";
  };

  const averageAbsorption = calculateAverageAbsorption();

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
              <Label htmlFor="sampleDescription">Sample Description</Label>
              <Textarea
                id="sampleDescription"
                value={formData.sampleDescription}
                onChange={(e) =>
                  updateFormData("sampleDescription", e.target.value)
                }
                placeholder="Describe the aggregate sample"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="materialType">Material Type</Label>
              <Select
                value={formData.materialType}
                onValueChange={(value) => updateFormData("materialType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Coarse Aggregate">
                    Coarse Aggregate
                  </SelectItem>
                  <SelectItem value="Fine Aggregate">Fine Aggregate</SelectItem>
                  <SelectItem value="Lightweight Aggregate">
                    Lightweight Aggregate
                  </SelectItem>
                  <SelectItem value="Recycled Aggregate">
                    Recycled Aggregate
                  </SelectItem>
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
            <div className="md:col-span-2">
              <Label htmlFor="soakingPeriod">Soaking Period (hours)</Label>
              <Input
                id="soakingPeriod"
                type="number"
                value={formData.soakingPeriod}
                onChange={(e) =>
                  updateFormData("soakingPeriod", e.target.value)
                }
                placeholder="24"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sample Data */}
      <Card>
        <CardHeader>
          <CardTitle>Water Absorption Test Results</CardTitle>
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
                    Oven Dry Weight (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Saturated Weight (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Submerged Weight (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Water Absorption (%)
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
                        placeholder="Sample A"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.ovenDryWeight}
                        onChange={(e) =>
                          updateSampleData(
                            index,
                            "ovenDryWeight",
                            e.target.value
                          )
                        }
                        placeholder="500.0"
                        className="w-24"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.saturatedWeight}
                        onChange={(e) =>
                          updateSampleData(
                            index,
                            "saturatedWeight",
                            e.target.value
                          )
                        }
                        placeholder="512.5"
                        className="w-24"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.submergedWeight}
                        onChange={(e) =>
                          updateSampleData(
                            index,
                            "submergedWeight",
                            e.target.value
                          )
                        }
                        placeholder="320.0"
                        className="w-24"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.waterAbsorption}
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
          <CardTitle>Water Absorption Test Results Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-900">
                Average Water Absorption
              </h4>
              <p className="text-3xl font-mono text-blue-800">
                {averageAbsorption}%
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Average of all samples
              </p>
            </div>
            <div className="text-center p-6 bg-green-50 border border-green-200 rounded">
              <h4 className="font-semibold text-green-900">Material Quality</h4>
              <div className="text-green-800 mt-2">
                {parseFloat(averageAbsorption) !== 0 && (
                  <p className="text-lg font-medium">
                    {getClassification(parseFloat(averageAbsorption))}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
            <h4 className="font-semibold text-gray-900 mb-2">
              Test Method Summary
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Material Type:</span>
                <p className="text-muted-foreground">{formData.materialType}</p>
              </div>
              <div>
                <span className="font-medium">Soaking Period:</span>
                <p className="text-muted-foreground">
                  {formData.soakingPeriod} hours
                </p>
              </div>
              <div>
                <span className="font-medium">Number of Samples:</span>
                <p className="text-muted-foreground">
                  {formData.sampleData.length}
                </p>
              </div>
              <div>
                <span className="font-medium">Test Standard:</span>
                <p className="text-muted-foreground">ASTM C127 / BS 812</p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-900 mb-2">
              Water Absorption Guidelines
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Normal weight aggregates: 0.5-2.0%</li>
              <li>• Lightweight aggregates: 5-25%</li>
              <li>
                • High absorption may affect concrete workability and strength
              </li>
              <li>• Recycled aggregates often have higher absorption</li>
              <li>• Absorption affects mix design water requirements</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded">
            <h4 className="font-semibold text-purple-900 mb-2">
              Calculation Method
            </h4>
            <div className="text-sm text-purple-800">
              <p>
                <strong>
                  Water Absorption (%) = [(Saturated Weight - Oven Dry Weight) /
                  Oven Dry Weight] × 100
                </strong>
              </p>
              <ul className="mt-2 space-y-1">
                <li>• Oven Dry Weight: Weight after drying at 105-110°C</li>
                <li>• Saturated Weight: Weight after soaking in water</li>
                <li>• Submerged Weight: Weight when submerged in water</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
