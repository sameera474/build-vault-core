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
  ovenDryWeight: string;
  ssdWeight: string;
  submergedWeight: string;
  bulkSpecificGravity: string;
  apparentSpecificGravity: string;
  absorption: string;
}

interface BulkSpecificGravityCoarseTestProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function BulkSpecificGravityCoarseTest({
  data,
  onUpdate,
}: BulkSpecificGravityCoarseTestProps) {
  const [formData, setFormData] = useState({
    projectName: data.projectName || "",
    aggregateSize: data.aggregateSize || "20mm",
    dateOfTesting: data.dateOfTesting || "",
    testedBy: data.testedBy || "",
    sampleData: data.sampleData || [
      {
        id: "1",
        sampleId: "C001",
        ovenDryWeight: "",
        ssdWeight: "",
        submergedWeight: "",
        bulkSpecificGravity: "",
        apparentSpecificGravity: "",
        absorption: "",
      },
      {
        id: "2",
        sampleId: "C002",
        ovenDryWeight: "",
        ssdWeight: "",
        submergedWeight: "",
        bulkSpecificGravity: "",
        apparentSpecificGravity: "",
        absorption: "",
      },
      {
        id: "3",
        sampleId: "C003",
        ovenDryWeight: "",
        ssdWeight: "",
        submergedWeight: "",
        bulkSpecificGravity: "",
        apparentSpecificGravity: "",
        absorption: "",
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

    // Auto-calculate specific gravities when all weights are available
    if (
      field === "ovenDryWeight" ||
      field === "ssdWeight" ||
      field === "submergedWeight"
    ) {
      const item = newData[index];
      if (item.ovenDryWeight && item.ssdWeight && item.submergedWeight) {
        const ovenDryWeight = parseFloat(item.ovenDryWeight);
        const ssdWeight = parseFloat(item.ssdWeight);
        const submergedWeight = parseFloat(item.submergedWeight);

        // Bulk Specific Gravity (SSD) = SSD weight / (SSD weight - submerged weight)
        const bulkSpecificGravity = ssdWeight / (ssdWeight - submergedWeight);
        item.bulkSpecificGravity = bulkSpecificGravity.toFixed(3);

        // Apparent Specific Gravity = Oven dry weight / (oven dry weight - submerged weight)
        const apparentSpecificGravity =
          ovenDryWeight / (ovenDryWeight - submergedWeight);
        item.apparentSpecificGravity = apparentSpecificGravity.toFixed(3);

        // Absorption = ((SSD weight - oven dry weight) / oven dry weight) × 100
        const absorption = ((ssdWeight - ovenDryWeight) / ovenDryWeight) * 100;
        item.absorption = absorption.toFixed(2);
      }
    }

    const newFormData = { ...formData, sampleData: newData };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  const addSample = () => {
    const newSample = {
      id: (formData.sampleData.length + 1).toString(),
      sampleId: `C${String(formData.sampleData.length + 1).padStart(3, "0")}`,
      ovenDryWeight: "",
      ssdWeight: "",
      submergedWeight: "",
      bulkSpecificGravity: "",
      apparentSpecificGravity: "",
      absorption: "",
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

  const calculateAverageBulkSG = () => {
    const validData = formData.sampleData.filter(
      (item) =>
        item.bulkSpecificGravity && parseFloat(item.bulkSpecificGravity) > 0
    );

    if (validData.length === 0) return "0.000";

    const sum = validData.reduce(
      (acc, item) => acc + parseFloat(item.bulkSpecificGravity),
      0
    );
    return (sum / validData.length).toFixed(3);
  };

  const calculateAverageAbsorption = () => {
    const validData = formData.sampleData.filter(
      (item) => item.absorption && parseFloat(item.absorption) > 0
    );

    if (validData.length === 0) return "0.00";

    const sum = validData.reduce(
      (acc, item) => acc + parseFloat(item.absorption),
      0
    );
    return (sum / validData.length).toFixed(2);
  };

  const getSpecificGravityStatus = (bulkSG: number, absorption: number) => {
    if (bulkSG >= 2.6 && bulkSG <= 2.9 && absorption <= 1.0) {
      return "Excellent - High quality coarse aggregate";
    }
    if (bulkSG >= 2.4 && bulkSG <= 3.0 && absorption <= 2.0) {
      return "Good - Suitable for most applications";
    }
    if (bulkSG >= 2.2 && bulkSG <= 3.2 && absorption <= 3.0) {
      return "Fair - Acceptable with evaluation";
    }
    return "Poor - May affect concrete strength";
  };

  const averageBulkSG = calculateAverageBulkSG();
  const averageAbsorption = calculateAverageAbsorption();
  const specificGravityStatus = getSpecificGravityStatus(
    parseFloat(averageBulkSG),
    parseFloat(averageAbsorption)
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
                  <SelectItem value="6.3mm">6.3mm</SelectItem>
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

      {/* Specific Gravity Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Bulk Specific Gravity Test Results (Wire Basket Method)
          </CardTitle>
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
                    SSD Weight (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Submerged Weight (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Bulk SG (SSD)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Apparent SG
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Absorption (%)
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
                        placeholder="C001"
                        className="w-16"
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
                        placeholder="2000"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.ssdWeight}
                        onChange={(e) =>
                          updateSampleData(index, "ssdWeight", e.target.value)
                        }
                        placeholder="2020"
                        className="w-20"
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
                        placeholder="1200"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.bulkSpecificGravity}
                        readOnly
                        className="w-16 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.apparentSpecificGravity}
                        readOnly
                        className="w-16 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.absorption}
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
          <CardTitle>Bulk Specific Gravity Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-900">Average Bulk SG</h4>
              <p className="text-3xl font-mono text-blue-800">
                {averageBulkSG}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Saturated surface dry basis
              </p>
            </div>
            <div className="text-center p-6 bg-green-50 border border-green-200 rounded">
              <h4 className="font-semibold text-green-900">
                Average Absorption
              </h4>
              <p className="text-3xl font-mono text-green-800">
                {averageAbsorption}%
              </p>
              <p className="text-sm text-green-700 mt-1">
                Water absorption capacity
              </p>
            </div>
            <div className="text-center p-6 bg-orange-50 border border-orange-200 rounded">
              <h4 className="font-semibold text-orange-900">Quality Status</h4>
              <div className="text-orange-800 mt-2">
                <p className="text-lg font-medium">
                  {parseFloat(averageBulkSG) !== 0
                    ? specificGravityStatus
                    : "Insufficient data"}
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
                <span className="font-medium">Aggregate Size:</span>
                <p className="text-muted-foreground">
                  {formData.aggregateSize}
                </p>
              </div>
              <div>
                <span className="font-medium">Test Method:</span>
                <p className="text-muted-foreground">Wire Basket Method</p>
              </div>
              <div>
                <span className="font-medium">Number of Samples:</span>
                <p className="text-muted-foreground">
                  {formData.sampleData.length}
                </p>
              </div>
              <div>
                <span className="font-medium">Test Standard:</span>
                <p className="text-muted-foreground">ASTM C127 / IS 2386</p>
              </div>
              <div>
                <span className="font-medium">Sample Size:</span>
                <p className="text-muted-foreground">2000-5000g per test</p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-900 mb-2">
              Specific Gravity Specifications
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>
                • Bulk Specific Gravity: 2.5-3.0 (typical range for coarse
                aggregates)
              </li>
              <li>• Absorption: ≤ 1.0% for high-quality aggregates</li>
              <li>• Absorption: ≤ 2.0% for normal construction use</li>
              <li>• Higher SG indicates denser, stronger aggregate</li>
              <li>• Lower absorption indicates better durability</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded">
            <h4 className="font-semibold text-purple-900 mb-2">
              Test Procedure
            </h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Dry sample to constant weight at 110°C</li>
              <li>• Cool and immerse in water for 24 hours</li>
              <li>• Surface dry the saturated sample (SSD condition)</li>
              <li>• Weigh SSD sample in air</li>
              <li>• Weigh SSD sample submerged in water</li>
              <li>• Calculate bulk and apparent specific gravity</li>
              <li>• Calculate absorption percentage</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <h4 className="font-semibold text-red-900 mb-2">
              Quality Control Notes
            </h4>
            <div className="text-sm text-red-800">
              <ul className="space-y-1">
                <li>
                  • High specific gravity indicates good quality aggregate
                </li>
                <li>
                  • Low absorption indicates low porosity and good durability
                </li>
                <li>• Critical for concrete mix design calculations</li>
                <li>• Affects cement content and workability requirements</li>
                <li>• SSD condition represents field moisture state</li>
                <li>• Wire basket prevents sample loss during weighing</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
