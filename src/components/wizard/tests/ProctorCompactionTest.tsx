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

interface ProctorData {
  id: string;
  moistureContent: string;
  wetDensity: string;
  dryDensity: string;
  degreeOfSaturation: string;
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
    sampleDescription: data.sampleDescription || "",
    testType: data.testType || "Standard Proctor",
    dateOfTesting: data.dateOfTesting || "",
    testedBy: data.testedBy || "",
    moldVolume: data.moldVolume || "944", // cm³ for standard 4" mold
    moldWeight: data.moldWeight || "",
    hammerWeight: data.hammerWeight || "24.4", // lbs for standard hammer
    noOfLayers: data.noOfLayers || "3",
    blowsPerLayer: data.blowsPerLayer || "25",
    proctorData: data.proctorData || [
      {
        id: "1",
        moistureContent: "",
        wetDensity: "",
        dryDensity: "",
        degreeOfSaturation: "",
      },
      {
        id: "2",
        moistureContent: "",
        wetDensity: "",
        dryDensity: "",
        degreeOfSaturation: "",
      },
      {
        id: "3",
        moistureContent: "",
        wetDensity: "",
        dryDensity: "",
        degreeOfSaturation: "",
      },
      {
        id: "4",
        moistureContent: "",
        wetDensity: "",
        dryDensity: "",
        degreeOfSaturation: "",
      },
      {
        id: "5",
        moistureContent: "",
        wetDensity: "",
        dryDensity: "",
        degreeOfSaturation: "",
      },
      {
        id: "6",
        moistureContent: "",
        wetDensity: "",
        dryDensity: "",
        degreeOfSaturation: "",
      },
    ],
  });

  const updateFormData = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onUpdate(newData);
  };

  const updateProctorData = (index: number, field: string, value: string) => {
    const newData = [...formData.proctorData];
    newData[index] = { ...newData[index], [field]: value };

    // Auto-calculate dry density if wet density and moisture content are provided
    if (field === "wetDensity" || field === "moistureContent") {
      const item = newData[index];
      if (item.wetDensity && item.moistureContent) {
        const wetDensity = parseFloat(item.wetDensity);
        const moisture = parseFloat(item.moistureContent) / 100;
        const dryDensity = wetDensity / (1 + moisture);
        item.dryDensity = dryDensity.toFixed(3);
      }
    }

    const newFormData = { ...formData, proctorData: newData };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  const calculateMaxDryDensity = () => {
    const validData = formData.proctorData.filter(
      (item) => item.dryDensity && parseFloat(item.dryDensity) > 0
    );

    if (validData.length === 0) return "0.000";

    const maxDensity = Math.max(
      ...validData.map((item) => parseFloat(item.dryDensity))
    );
    return maxDensity.toFixed(3);
  };

  const calculateOptimumMoistureContent = () => {
    const validData = formData.proctorData.filter(
      (item) =>
        item.moistureContent &&
        item.dryDensity &&
        parseFloat(item.dryDensity) > 0
    );

    if (validData.length === 0) return "0.00";

    const maxDensity = parseFloat(calculateMaxDryDensity());
    const closestPoint = validData.reduce((prev, current) => {
      const prevDiff = Math.abs(parseFloat(prev.dryDensity) - maxDensity);
      const currentDiff = Math.abs(parseFloat(current.dryDensity) - maxDensity);
      return currentDiff < prevDiff ? current : prev;
    });

    return parseFloat(closestPoint.moistureContent).toFixed(2);
  };

  const maxDryDensity = calculateMaxDryDensity();
  const optimumMoistureContent = calculateOptimumMoistureContent();

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
                placeholder="Describe the soil sample"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="testType">Test Type</Label>
              <Select
                value={formData.testType}
                onValueChange={(value) => updateFormData("testType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standard Proctor">
                    Standard Proctor
                  </SelectItem>
                  <SelectItem value="Modified Proctor">
                    Modified Proctor
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
          </div>
        </CardContent>
      </Card>

      {/* Test Parameters */}
      <Card>
        <CardHeader>
          <CardTitle>Test Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="moldVolume">Mold Volume (cm³)</Label>
              <Input
                id="moldVolume"
                value={formData.moldVolume}
                onChange={(e) => updateFormData("moldVolume", e.target.value)}
                placeholder="944"
              />
            </div>
            <div>
              <Label htmlFor="moldWeight">Mold Weight (g)</Label>
              <Input
                id="moldWeight"
                value={formData.moldWeight}
                onChange={(e) => updateFormData("moldWeight", e.target.value)}
                placeholder="5000"
              />
            </div>
            <div>
              <Label htmlFor="hammerWeight">Hammer Weight (lbs)</Label>
              <Input
                id="hammerWeight"
                value={formData.hammerWeight}
                onChange={(e) => updateFormData("hammerWeight", e.target.value)}
                placeholder="24.4"
              />
            </div>
            <div>
              <Label htmlFor="noOfLayers">No. of Layers</Label>
              <Input
                id="noOfLayers"
                value={formData.noOfLayers}
                onChange={(e) => updateFormData("noOfLayers", e.target.value)}
                placeholder="3"
              />
            </div>
            <div>
              <Label htmlFor="blowsPerLayer">Blows per Layer</Label>
              <Input
                id="blowsPerLayer"
                value={formData.blowsPerLayer}
                onChange={(e) =>
                  updateFormData("blowsPerLayer", e.target.value)
                }
                placeholder="25"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proctor Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Proctor Compaction Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left">
                    Point No.
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Moisture Content (%)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Wet Density (g/cm³)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Dry Density (g/cm³)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Degree of Saturation (%)
                  </th>
                </tr>
              </thead>
              <tbody>
                {formData.proctorData.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 p-2 font-medium">
                      {item.id}
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.moistureContent}
                        onChange={(e) =>
                          updateProctorData(
                            index,
                            "moistureContent",
                            e.target.value
                          )
                        }
                        placeholder="12.5"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.wetDensity}
                        onChange={(e) =>
                          updateProctorData(index, "wetDensity", e.target.value)
                        }
                        placeholder="2.150"
                        className="w-24"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.dryDensity}
                        readOnly
                        className="w-24 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.degreeOfSaturation}
                        onChange={(e) =>
                          updateProctorData(
                            index,
                            "degreeOfSaturation",
                            e.target.value
                          )
                        }
                        placeholder="85"
                        className="w-20"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Proctor Compaction Test Results Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-900">
                Maximum Dry Density
              </h4>
              <p className="text-3xl font-mono text-blue-800">
                {maxDryDensity}
              </p>
              <p className="text-sm text-blue-700 mt-1">g/cm³</p>
            </div>
            <div className="text-center p-6 bg-green-50 border border-green-200 rounded">
              <h4 className="font-semibold text-green-900">
                Optimum Moisture Content
              </h4>
              <p className="text-3xl font-mono text-green-800">
                {optimumMoistureContent}
              </p>
              <p className="text-sm text-green-700 mt-1">%</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
            <h4 className="font-semibold text-gray-900 mb-2">
              Test Parameters Summary
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Test Type:</span>
                <p className="text-muted-foreground">{formData.testType}</p>
              </div>
              <div>
                <span className="font-medium">Mold Volume:</span>
                <p className="text-muted-foreground">
                  {formData.moldVolume} cm³
                </p>
              </div>
              <div>
                <span className="font-medium">Hammer Weight:</span>
                <p className="text-muted-foreground">
                  {formData.hammerWeight} lbs
                </p>
              </div>
              <div>
                <span className="font-medium">Layers/Blows:</span>
                <p className="text-muted-foreground">
                  {formData.noOfLayers} × {formData.blowsPerLayer}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
