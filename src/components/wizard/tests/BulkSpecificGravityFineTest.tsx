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
  pycnometerWeight: string;
  pycnometerWaterWeight: string;
  pycnometerSampleWeight: string;
  sampleDryWeight: string;
  bulkSpecificGravity: string;
  apparentSpecificGravity: string;
  absorption: string;
}

interface BulkSpecificGravityFineTestProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function BulkSpecificGravityFineTest({
  data,
  onUpdate,
}: BulkSpecificGravityFineTestProps) {
  const [formData, setFormData] = useState({
    projectName: data.projectName || "",
    aggregateType: data.aggregateType || "Fine Aggregate",
    dateOfTesting: data.dateOfTesting || "",
    testedBy: data.testedBy || "",
    pycnometerVolume: data.pycnometerVolume || "500", // mL
    sampleData: data.sampleData || [
      {
        id: "1",
        sampleId: "F001",
        pycnometerWeight: "",
        pycnometerWaterWeight: "",
        pycnometerSampleWeight: "",
        sampleDryWeight: "",
        bulkSpecificGravity: "",
        apparentSpecificGravity: "",
        absorption: "",
      },
      {
        id: "2",
        sampleId: "F002",
        pycnometerWeight: "",
        pycnometerWaterWeight: "",
        pycnometerSampleWeight: "",
        sampleDryWeight: "",
        bulkSpecificGravity: "",
        apparentSpecificGravity: "",
        absorption: "",
      },
      {
        id: "3",
        sampleId: "F003",
        pycnometerWeight: "",
        pycnometerWaterWeight: "",
        pycnometerSampleWeight: "",
        sampleDryWeight: "",
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
      field === "pycnometerWeight" ||
      field === "pycnometerWaterWeight" ||
      field === "pycnometerSampleWeight" ||
      field === "sampleDryWeight"
    ) {
      const item = newData[index];
      if (
        item.pycnometerWeight &&
        item.pycnometerWaterWeight &&
        item.pycnometerSampleWeight &&
        item.sampleDryWeight
      ) {
        const pycnometerWeight = parseFloat(item.pycnometerWeight);
        const pycnometerWaterWeight = parseFloat(item.pycnometerWaterWeight);
        const pycnometerSampleWeight = parseFloat(item.pycnometerSampleWeight);
        const sampleDryWeight = parseFloat(item.sampleDryWeight);
        const pycnometerVolume = parseFloat(formData.pycnometerVolume);

        // Calculate water volume in pycnometer
        const waterVolume = pycnometerVolume; // Assuming pycnometer is calibrated to volume

        // Bulk Specific Gravity = Dry weight / (Dry weight + (Pycnometer + water - pycnometer + sample))
        const bulkSpecificGravity =
          sampleDryWeight /
          (sampleDryWeight + (pycnometerSampleWeight - pycnometerWeight));
        item.bulkSpecificGravity = bulkSpecificGravity.toFixed(3);

        // Apparent Specific Gravity = Dry weight / (Dry weight + (Pycnometer + water - pycnometer + sample - water displaced by aggregate))
        // For SSD condition calculation
        const apparentSpecificGravity =
          sampleDryWeight / (pycnometerSampleWeight - pycnometerWeight);
        item.apparentSpecificGravity = apparentSpecificGravity.toFixed(3);

        // Absorption = ((Apparent SG - Bulk SG) / Bulk SG) × 100
        const absorption =
          ((apparentSpecificGravity - bulkSpecificGravity) /
            bulkSpecificGravity) *
          100;
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
      sampleId: `F${String(formData.sampleData.length + 1).padStart(3, "0")}`,
      pycnometerWeight: "",
      pycnometerWaterWeight: "",
      pycnometerSampleWeight: "",
      sampleDryWeight: "",
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
    if (bulkSG >= 2.5 && bulkSG <= 2.8 && absorption <= 2.0) {
      return "Excellent - High quality fine aggregate";
    }
    if (bulkSG >= 2.3 && bulkSG <= 2.9 && absorption <= 3.0) {
      return "Good - Acceptable for most applications";
    }
    if (bulkSG >= 2.0 && bulkSG <= 3.0 && absorption <= 5.0) {
      return "Fair - Requires evaluation for specific use";
    }
    return "Poor - May affect concrete/asphalt properties";
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
                  <SelectItem value="Fine Aggregate">Fine Aggregate</SelectItem>
                  <SelectItem value="Manufactured Sand">
                    Manufactured Sand
                  </SelectItem>
                  <SelectItem value="Natural Sand">Natural Sand</SelectItem>
                  <SelectItem value="Crushed Sand">Crushed Sand</SelectItem>
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
              <Label htmlFor="pycnometerVolume">Pycnometer Volume (mL)</Label>
              <Input
                id="pycnometerVolume"
                type="number"
                value={formData.pycnometerVolume}
                onChange={(e) =>
                  updateFormData("pycnometerVolume", e.target.value)
                }
                placeholder="500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Specific Gravity Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Bulk Specific Gravity Test Results (Pycnometer Method)
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
                    Pycnometer (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Pycnometer + Water (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Pycnometer + Sample (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Dry Sample (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Bulk SG
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
                        placeholder="F001"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.pycnometerWeight}
                        onChange={(e) =>
                          updateSampleData(
                            index,
                            "pycnometerWeight",
                            e.target.value
                          )
                        }
                        placeholder="150.00"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.pycnometerWaterWeight}
                        onChange={(e) =>
                          updateSampleData(
                            index,
                            "pycnometerWaterWeight",
                            e.target.value
                          )
                        }
                        placeholder="650.00"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.pycnometerSampleWeight}
                        onChange={(e) =>
                          updateSampleData(
                            index,
                            "pycnometerSampleWeight",
                            e.target.value
                          )
                        }
                        placeholder="550.00"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.sampleDryWeight}
                        onChange={(e) =>
                          updateSampleData(
                            index,
                            "sampleDryWeight",
                            e.target.value
                          )
                        }
                        placeholder="500.00"
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
              <p className="text-sm text-blue-700 mt-1">Oven-dry basis</p>
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
                <span className="font-medium">Aggregate Type:</span>
                <p className="text-muted-foreground">
                  {formData.aggregateType}
                </p>
              </div>
              <div>
                <span className="font-medium">Pycnometer Volume:</span>
                <p className="text-muted-foreground">
                  {formData.pycnometerVolume} mL
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
                <p className="text-muted-foreground">ASTM C128 / IS 2386</p>
              </div>
              <div>
                <span className="font-medium">Test Method:</span>
                <p className="text-muted-foreground">
                  Pycnometer (Le Chatelier flask)
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-900 mb-2">
              Specific Gravity Specifications
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>
                • Bulk Specific Gravity: 2.4-2.9 (typical range for fine
                aggregates)
              </li>
              <li>• Absorption: ≤ 2.0% for high-quality aggregates</li>
              <li>• Absorption: ≤ 3.0% for normal construction use</li>
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
              <li>• Cool in desiccator and weigh pycnometer empty</li>
              <li>• Fill pycnometer with water and weigh</li>
              <li>• Add dry sample and fill with water</li>
              <li>• Remove entrapped air by boiling or vacuum</li>
              <li>• Cool to room temperature and weigh</li>
              <li>• Calculate bulk and apparent specific gravity</li>
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
                <li>• Results affect concrete mix design proportions</li>
                <li>
                  • Critical for asphalt mix design and volumetric calculations
                </li>
                <li>• Pycnometer must be clean and calibrated</li>
                <li>• All air must be removed for accurate results</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
