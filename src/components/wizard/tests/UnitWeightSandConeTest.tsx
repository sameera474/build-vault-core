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
  locationId: string;
  holeVolume: string;
  sandWeightBefore: string;
  sandWeightAfter: string;
  sandUsed: string;
  wetSoilWeight: string;
  drySoilWeight: string;
  moistureContent: string;
  wetDensity: string;
  dryDensity: string;
}

interface UnitWeightSandConeTestProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function UnitWeightSandConeTest({
  data,
  onUpdate,
}: UnitWeightSandConeTestProps) {
  const [formData, setFormData] = useState({
    projectName: data.projectName || "",
    testLocation: data.testLocation || "",
    dateOfTesting: data.dateOfTesting || "",
    testedBy: data.testedBy || "",
    materialType: data.materialType || "Soil",
    sandConeCalibration: data.sandConeCalibration || "0.0005", // m³/g (volume per gram of sand)
    sampleData: data.sampleData || [
      {
        id: "1",
        locationId: "Location A",
        holeVolume: "",
        sandWeightBefore: "",
        sandWeightAfter: "",
        sandUsed: "",
        wetSoilWeight: "",
        drySoilWeight: "",
        moistureContent: "",
        wetDensity: "",
        dryDensity: "",
      },
      {
        id: "2",
        locationId: "Location B",
        holeVolume: "",
        sandWeightBefore: "",
        sandWeightAfter: "",
        sandUsed: "",
        wetSoilWeight: "",
        drySoilWeight: "",
        moistureContent: "",
        wetDensity: "",
        dryDensity: "",
      },
      {
        id: "3",
        locationId: "Location C",
        holeVolume: "",
        sandWeightBefore: "",
        sandWeightAfter: "",
        sandUsed: "",
        wetSoilWeight: "",
        drySoilWeight: "",
        moistureContent: "",
        wetDensity: "",
        dryDensity: "",
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

    // Auto-calculate values based on inputs
    if (field === "sandWeightBefore" || field === "sandWeightAfter") {
      const item = newData[index];
      if (item.sandWeightBefore && item.sandWeightAfter) {
        const sandUsed =
          parseFloat(item.sandWeightBefore) - parseFloat(item.sandWeightAfter);
        item.sandUsed = sandUsed.toFixed(3);
      }
    }

    if (field === "sandUsed" || field === "holeVolume") {
      const item = newData[index];
      if (item.sandUsed && item.holeVolume) {
        // Calculate densities if we have all required data
        calculateDensities(index, newData);
      }
    }

    if (field === "wetSoilWeight" || field === "drySoilWeight") {
      const item = newData[index];
      if (item.wetSoilWeight && item.drySoilWeight) {
        const moistureContent =
          ((parseFloat(item.wetSoilWeight) - parseFloat(item.drySoilWeight)) /
            parseFloat(item.drySoilWeight)) *
          100;
        item.moistureContent = moistureContent.toFixed(2);
      }
      // Recalculate densities if moisture content changed
      if (item.holeVolume && item.sandUsed) {
        calculateDensities(index, newData);
      }
    }

    const newFormData = { ...formData, sampleData: newData };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  const calculateDensities = (index: number, dataArray: SampleData[]) => {
    const item = dataArray[index];
    const calibrationFactor = parseFloat(formData.sandConeCalibration);

    if (
      item.sandUsed &&
      item.holeVolume &&
      item.wetSoilWeight &&
      item.drySoilWeight &&
      calibrationFactor > 0
    ) {
      const sandUsed = parseFloat(item.sandUsed);
      const holeVolume = parseFloat(item.holeVolume);
      const wetSoilWeight = parseFloat(item.wetSoilWeight);
      const drySoilWeight = parseFloat(item.drySoilWeight);

      // Volume of hole = sand used × calibration factor
      const calculatedVolume = sandUsed * calibrationFactor;

      // Wet density = wet soil weight / volume
      const wetDensity = wetSoilWeight / calculatedVolume;
      item.wetDensity = wetDensity.toFixed(3);

      // Dry density = dry soil weight / volume
      const dryDensity = drySoilWeight / calculatedVolume;
      item.dryDensity = dryDensity.toFixed(3);
    }
  };

  const addSample = () => {
    const newSample = {
      id: (formData.sampleData.length + 1).toString(),
      locationId: `Location ${String.fromCharCode(
        65 + formData.sampleData.length
      )}`,
      holeVolume: "",
      sandWeightBefore: "",
      sandWeightAfter: "",
      sandUsed: "",
      wetSoilWeight: "",
      drySoilWeight: "",
      moistureContent: "",
      wetDensity: "",
      dryDensity: "",
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

  const calculateAverageDryDensity = () => {
    const validData = formData.sampleData.filter(
      (item) => item.dryDensity && parseFloat(item.dryDensity) > 0
    );

    if (validData.length === 0) return "0.000";

    const sum = validData.reduce(
      (acc, item) => acc + parseFloat(item.dryDensity),
      0
    );
    return (sum / validData.length).toFixed(3);
  };

  const calculateAverageMoisture = () => {
    const validData = formData.sampleData.filter(
      (item) => item.moistureContent && parseFloat(item.moistureContent) > 0
    );

    if (validData.length === 0) return "0.00";

    const sum = validData.reduce(
      (acc, item) => acc + parseFloat(item.moistureContent),
      0
    );
    return (sum / validData.length).toFixed(2);
  };

  const getCompactionRating = (
    dryDensity: number,
    maxDensity: number = 2.0
  ) => {
    if (maxDensity === 0) return "Max density not specified";

    const compaction = (dryDensity / maxDensity) * 100;

    if (compaction >= 95) return "Excellent - Well compacted";
    if (compaction >= 90) return "Good - Adequately compacted";
    if (compaction >= 85) return "Fair - Moderately compacted";
    return "Poor - Under-compacted";
  };

  const averageDryDensity = calculateAverageDryDensity();
  const averageMoisture = calculateAverageMoisture();

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
              <Label htmlFor="testLocation">Test Location</Label>
              <Input
                id="testLocation"
                value={formData.testLocation}
                onChange={(e) => updateFormData("testLocation", e.target.value)}
                placeholder="Chainage or location details"
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
              <Label htmlFor="materialType">Material Type</Label>
              <Select
                value={formData.materialType}
                onValueChange={(value) => updateFormData("materialType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Soil">Soil</SelectItem>
                  <SelectItem value="Subbase">Subbase</SelectItem>
                  <SelectItem value="Base Course">Base Course</SelectItem>
                  <SelectItem value="Asphalt">Asphalt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sandConeCalibration">
                Sand Cone Calibration (m³/g)
              </Label>
              <Input
                id="sandConeCalibration"
                type="number"
                step="0.000001"
                value={formData.sandConeCalibration}
                onChange={(e) =>
                  updateFormData("sandConeCalibration", e.target.value)
                }
                placeholder="0.0005"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Sand Cone Density Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left">
                    Location ID
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Hole Volume (m³)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Sand Before (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Sand After (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Sand Used (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Wet Soil (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Dry Soil (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Moisture (%)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Wet Density (g/cm³)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Dry Density (g/cm³)
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
                        value={item.locationId}
                        onChange={(e) =>
                          updateSampleData(index, "locationId", e.target.value)
                        }
                        placeholder="Location A"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.holeVolume}
                        onChange={(e) =>
                          updateSampleData(index, "holeVolume", e.target.value)
                        }
                        placeholder="0.001"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.sandWeightBefore}
                        onChange={(e) =>
                          updateSampleData(
                            index,
                            "sandWeightBefore",
                            e.target.value
                          )
                        }
                        placeholder="1500"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.sandWeightAfter}
                        onChange={(e) =>
                          updateSampleData(
                            index,
                            "sandWeightAfter",
                            e.target.value
                          )
                        }
                        placeholder="1200"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.sandUsed}
                        readOnly
                        className="w-16 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.wetSoilWeight}
                        onChange={(e) =>
                          updateSampleData(
                            index,
                            "wetSoilWeight",
                            e.target.value
                          )
                        }
                        placeholder="2000"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.drySoilWeight}
                        onChange={(e) =>
                          updateSampleData(
                            index,
                            "drySoilWeight",
                            e.target.value
                          )
                        }
                        placeholder="1900"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.moistureContent}
                        readOnly
                        className="w-16 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.wetDensity}
                        readOnly
                        className="w-20 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.dryDensity}
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
              Add Test Location
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Sand Cone Density Test Results Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-900">
                Average Dry Density
              </h4>
              <p className="text-3xl font-mono text-blue-800">
                {averageDryDensity} g/cm³
              </p>
              <p className="text-sm text-blue-700 mt-1">Field density</p>
            </div>
            <div className="text-center p-6 bg-green-50 border border-green-200 rounded">
              <h4 className="font-semibold text-green-900">Average Moisture</h4>
              <p className="text-3xl font-mono text-green-800">
                {averageMoisture}%
              </p>
              <p className="text-sm text-green-700 mt-1">
                Natural moisture content
              </p>
            </div>
            <div className="text-center p-6 bg-orange-50 border border-orange-200 rounded">
              <h4 className="font-semibold text-orange-900">
                Compaction Status
              </h4>
              <div className="text-orange-800 mt-2">
                <p className="text-lg font-medium">
                  {parseFloat(averageDryDensity) !== 0
                    ? getCompactionRating(parseFloat(averageDryDensity))
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
                <span className="font-medium">Test Location:</span>
                <p className="text-muted-foreground">
                  {formData.testLocation || "Not specified"}
                </p>
              </div>
              <div>
                <span className="font-medium">Material Type:</span>
                <p className="text-muted-foreground">{formData.materialType}</p>
              </div>
              <div>
                <span className="font-medium">Calibration Factor:</span>
                <p className="text-muted-foreground">
                  {formData.sandConeCalibration} m³/g
                </p>
              </div>
              <div>
                <span className="font-medium">Number of Tests:</span>
                <p className="text-muted-foreground">
                  {formData.sampleData.length}
                </p>
              </div>
              <div>
                <span className="font-medium">Test Standard:</span>
                <p className="text-muted-foreground">
                  ASTM D1556 / AASHTO T191
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-900 mb-2">
              Compaction Guidelines
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• 95%+ of maximum dry density: Excellent compaction</li>
              <li>• 90-95% of maximum dry density: Good compaction</li>
              <li>• 85-90% of maximum dry density: Fair compaction</li>
              <li>• Less than 85% of maximum dry density: Poor compaction</li>
              <li>• Moisture content should be near optimum (±2%)</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded">
            <h4 className="font-semibold text-purple-900 mb-2">
              Test Procedure
            </h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Excavate a hole of known volume (usually 0.001 m³)</li>
              <li>• Weigh sand cone before and after filling the hole</li>
              <li>• Collect soil sample for moisture content determination</li>
              <li>• Oven-dry soil sample at 105-110°C for 24 hours</li>
              <li>
                • Calculate wet and dry densities using calibration factor
              </li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <h4 className="font-semibold text-red-900 mb-2">
              Calculation Method
            </h4>
            <div className="text-sm text-red-800">
              <p>
                <strong>Wet Density = Wet Soil Weight / Hole Volume</strong>
              </p>
              <p>
                <strong>Dry Density = Dry Soil Weight / Hole Volume</strong>
              </p>
              <p>
                <strong>
                  Moisture Content = [(Wet Weight - Dry Weight) / Dry Weight] ×
                  100
                </strong>
              </p>
              <ul className="mt-2 space-y-1">
                <li>• Hole Volume = Sand Used × Calibration Factor</li>
                <li>• Sand Used = Weight Before - Weight After</li>
                <li>• Calibration factor determined by sand cone apparatus</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
