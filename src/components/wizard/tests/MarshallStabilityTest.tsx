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
  stability: string;
  flow: string;
  unitWeight: string;
  airVoids: string;
  vfb: string;
  vfa: string;
}

interface MarshallStabilityTestProps {
  data: any;
  onUpdate: (data: any) => void;
  parentData?: any;
}

export function MarshallStabilityTest({
  data,
  onUpdate,
}: MarshallStabilityTestProps) {
  const [formData, setFormData] = useState({
    mixDescription: data.mixDescription || "",
    dateOfTesting: data.dateOfTesting || "",
    testedBy: data.testedBy || "",
    asphaltContent: data.asphaltContent || "",
    compactionTemperature: data.compactionTemperature || "135",
    testingTemperature: data.testingTemperature || "60",
    sampleDiameter: data.sampleDiameter || "101.6", // mm
    sampleHeight: data.sampleHeight || "63.5", // mm
    sampleData: data.sampleData || [
      {
        id: "1",
        sampleId: "Sample A",
        stability: "",
        flow: "",
        unitWeight: "",
        airVoids: "",
        vfb: "",
        vfa: "",
      },
      {
        id: "2",
        sampleId: "Sample B",
        stability: "",
        flow: "",
        unitWeight: "",
        airVoids: "",
        vfb: "",
        vfa: "",
      },
      {
        id: "3",
        sampleId: "Sample C",
        stability: "",
        flow: "",
        unitWeight: "",
        airVoids: "",
        vfb: "",
        vfa: "",
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
      stability: "",
      flow: "",
      unitWeight: "",
      airVoids: "",
      vfb: "",
      vfa: "",
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

  const calculateAverageStability = () => {
    const validData = formData.sampleData.filter(
      (item) => item.stability && parseFloat(item.stability) > 0
    );

    if (validData.length === 0) return "0.00";

    const sum = validData.reduce(
      (acc, item) => acc + parseFloat(item.stability),
      0
    );
    return (sum / validData.length).toFixed(2);
  };

  const calculateAverageFlow = () => {
    const validData = formData.sampleData.filter(
      (item) => item.flow && parseFloat(item.flow) > 0
    );

    if (validData.length === 0) return "0.00";

    const sum = validData.reduce((acc, item) => acc + parseFloat(item.flow), 0);
    return (sum / validData.length).toFixed(2);
  };

  const calculateAverageAirVoids = () => {
    const validData = formData.sampleData.filter(
      (item) => item.airVoids && parseFloat(item.airVoids) > 0
    );

    if (validData.length === 0) return "0.00";

    const sum = validData.reduce(
      (acc, item) => acc + parseFloat(item.airVoids),
      0
    );
    return (sum / validData.length).toFixed(2);
  };

  const getStabilityRating = (stability: number) => {
    if (stability >= 8000) return "Excellent - Very High Stability";
    if (stability >= 6000) return "Good - High Stability";
    if (stability >= 4000) return "Fair - Moderate Stability";
    if (stability >= 2000) return "Poor - Low Stability";
    return "Very Poor - Unacceptable Stability";
  };

  const getAirVoidsRating = (airVoids: number) => {
    if (airVoids >= 3 && airVoids <= 5) return "Optimal - Good Durability";
    if (airVoids >= 2 && airVoids <= 7)
      return "Acceptable - Moderate Durability";
    if (airVoids < 2) return "Too Low - Poor Durability";
    return "Too High - Poor Durability";
  };

  const averageStability = calculateAverageStability();
  const averageFlow = calculateAverageFlow();
  const averageAirVoids = calculateAverageAirVoids();

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
              <Label htmlFor="mixDescription">Asphalt Mix Description</Label>
              <Textarea
                id="mixDescription"
                value={formData.mixDescription}
                onChange={(e) =>
                  updateFormData("mixDescription", e.target.value)
                }
                placeholder="Describe the asphalt mix composition"
                rows={3}
              />
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
              <Label htmlFor="asphaltContent">Asphalt Content (%)</Label>
              <Input
                id="asphaltContent"
                type="number"
                step="0.1"
                value={formData.asphaltContent}
                onChange={(e) =>
                  updateFormData("asphaltContent", e.target.value)
                }
                placeholder="5.0"
              />
            </div>
            <div>
              <Label htmlFor="compactionTemperature">
                Compaction Temperature (°C)
              </Label>
              <Input
                id="compactionTemperature"
                type="number"
                value={formData.compactionTemperature}
                onChange={(e) =>
                  updateFormData("compactionTemperature", e.target.value)
                }
                placeholder="135"
              />
            </div>
            <div>
              <Label htmlFor="testingTemperature">
                Testing Temperature (°C)
              </Label>
              <Input
                id="testingTemperature"
                type="number"
                value={formData.testingTemperature}
                onChange={(e) =>
                  updateFormData("testingTemperature", e.target.value)
                }
                placeholder="60"
              />
            </div>
            <div>
              <Label htmlFor="sampleDiameter">Sample Diameter (mm)</Label>
              <Input
                id="sampleDiameter"
                type="number"
                step="0.1"
                value={formData.sampleDiameter}
                onChange={(e) =>
                  updateFormData("sampleDiameter", e.target.value)
                }
                placeholder="101.6"
              />
            </div>
            <div>
              <Label htmlFor="sampleHeight">Sample Height (mm)</Label>
              <Input
                id="sampleHeight"
                type="number"
                step="0.1"
                value={formData.sampleHeight}
                onChange={(e) => updateFormData("sampleHeight", e.target.value)}
                placeholder="63.5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Marshall Stability Test Results</CardTitle>
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
                    Stability (N)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Flow (mm)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Unit Weight (g/cm³)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Air Voids (%)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    VFB (%)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    VFA (%)
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
                        value={item.stability}
                        onChange={(e) =>
                          updateSampleData(index, "stability", e.target.value)
                        }
                        placeholder="8500"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.flow}
                        onChange={(e) =>
                          updateSampleData(index, "flow", e.target.value)
                        }
                        placeholder="3.2"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.unitWeight}
                        onChange={(e) =>
                          updateSampleData(index, "unitWeight", e.target.value)
                        }
                        placeholder="2.35"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.airVoids}
                        onChange={(e) =>
                          updateSampleData(index, "airVoids", e.target.value)
                        }
                        placeholder="4.2"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.vfb}
                        onChange={(e) =>
                          updateSampleData(index, "vfb", e.target.value)
                        }
                        placeholder="75.5"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.vfa}
                        onChange={(e) =>
                          updateSampleData(index, "vfa", e.target.value)
                        }
                        placeholder="85.2"
                        className="w-16"
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
          <CardTitle>Marshall Stability Test Results Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-900">Average Stability</h4>
              <p className="text-3xl font-mono text-blue-800">
                {averageStability} N
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Load-bearing capacity
              </p>
            </div>
            <div className="text-center p-6 bg-green-50 border border-green-200 rounded">
              <h4 className="font-semibold text-green-900">Average Flow</h4>
              <p className="text-3xl font-mono text-green-800">
                {averageFlow} mm
              </p>
              <p className="text-sm text-green-700 mt-1">Plastic deformation</p>
            </div>
            <div className="text-center p-6 bg-orange-50 border border-orange-200 rounded">
              <h4 className="font-semibold text-orange-900">
                Average Air Voids
              </h4>
              <p className="text-3xl font-mono text-orange-800">
                {averageAirVoids}%
              </p>
              <p className="text-sm text-orange-700 mt-1">Porosity of mix</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
            <h4 className="font-semibold text-gray-900 mb-2">
              Marshall Mix Quality Assessment
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Stability Rating:</span>
                <p className="text-muted-foreground">
                  {parseFloat(averageStability) !== 0
                    ? getStabilityRating(parseFloat(averageStability))
                    : "N/A"}
                </p>
              </div>
              <div>
                <span className="font-medium">Air Voids Rating:</span>
                <p className="text-muted-foreground">
                  {parseFloat(averageAirVoids) !== 0
                    ? getAirVoidsRating(parseFloat(averageAirVoids))
                    : "N/A"}
                </p>
              </div>
              <div>
                <span className="font-medium">Flow Value:</span>
                <p className="text-muted-foreground">
                  {parseFloat(averageFlow) >= 2 && parseFloat(averageFlow) <= 4
                    ? "Optimal Range"
                    : parseFloat(averageFlow) < 2
                    ? "Too Stiff"
                    : "Too Soft"}
                </p>
              </div>
              <div>
                <span className="font-medium">Test Standard:</span>
                <p className="text-muted-foreground">
                  ASTM D6927 / AASHTO T245
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-900 mb-2">
              Marshall Criteria Guidelines
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>
                • Stability: 3336-3560 N (light traffic), 5340-6670 N (heavy
                traffic)
              </li>
              <li>• Flow: 2.0-4.0 mm (optimal range for most applications)</li>
              <li>
                • Air Voids: 3.0-5.0% (optimal for durability and performance)
              </li>
              <li>• Voids Filled with Asphalt (VFA): 65-78% (optimal range)</li>
              <li>
                • Voids in Mineral Aggregate (VMA): ≥ 14% for dense-graded mixes
              </li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded">
            <h4 className="font-semibold text-purple-900 mb-2">
              Test Procedure
            </h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Sample preparation: 101.6mm diameter × 63.5mm height</li>
              <li>• Compaction: 75 blows per face at specified temperature</li>
              <li>• Conditioning: 30-60 minutes at 60°C in water bath</li>
              <li>• Loading rate: 50.8 mm/min until failure</li>
              <li>
                • Measures maximum load (stability) and deformation (flow)
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
