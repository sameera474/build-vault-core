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

interface CoreData {
  id: string;
  coreId: string;
  location: string;
  chainage: string;
  diameter: string;
  height: string;
  weight: string;
  bulkDensity: string;
  theoreticalDensity: string;
  voids: string;
  compaction: string;
}

interface AsphaltCoreDensityTestProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function AsphaltCoreDensityTest({
  data,
  onUpdate,
}: AsphaltCoreDensityTestProps) {
  const [formData, setFormData] = useState({
    projectName: data.projectName || "",
    roadSection: data.roadSection || "",
    dateOfTesting: data.dateOfTesting || "",
    testedBy: data.testedBy || "",
    layerType: data.layerType || "Wearing Course",
    mixType: data.mixType || "Dense Bituminous Macadam",
    asphaltContent: data.asphaltContent || "",
    targetDensity: data.targetDensity || "",
    targetCompaction: data.targetCompaction || "98",
    coreData: data.coreData || [
      {
        id: "1",
        coreId: "C001",
        location: "",
        chainage: "",
        diameter: "",
        height: "",
        weight: "",
        bulkDensity: "",
        theoreticalDensity: "",
        voids: "",
        compaction: "",
      },
      {
        id: "2",
        coreId: "C002",
        location: "",
        chainage: "",
        diameter: "",
        height: "",
        weight: "",
        bulkDensity: "",
        theoreticalDensity: "",
        voids: "",
        compaction: "",
      },
      {
        id: "3",
        coreId: "C003",
        location: "",
        chainage: "",
        diameter: "",
        height: "",
        weight: "",
        bulkDensity: "",
        theoreticalDensity: "",
        voids: "",
        compaction: "",
      },
    ],
  });

  const updateFormData = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onUpdate(newData);
  };

  const updateCoreData = (index: number, field: string, value: string) => {
    const newData = [...formData.coreData];
    newData[index] = { ...newData[index], [field]: value };

    // Auto-calculate bulk density when diameter, height, and weight are available
    if (field === "diameter" || field === "height" || field === "weight") {
      const item = newData[index];
      if (item.diameter && item.height && item.weight) {
        const diameter = parseFloat(item.diameter) / 1000; // Convert mm to m
        const height = parseFloat(item.height) / 1000; // Convert mm to m
        const volume = Math.PI * Math.pow(diameter / 2, 2) * height; // Volume in m³
        const weight = parseFloat(item.weight) / 1000; // Convert g to kg
        const bulkDensity = weight / volume; // kg/m³
        item.bulkDensity = bulkDensity.toFixed(2);
      }
    }

    // Calculate compaction when bulk density and theoretical density are available
    if (field === "bulkDensity" || field === "theoreticalDensity") {
      const item = newData[index];
      if (item.bulkDensity && item.theoreticalDensity) {
        const bulkDensity = parseFloat(item.bulkDensity);
        const theoreticalDensity = parseFloat(item.theoreticalDensity);
        const compaction = (bulkDensity / theoreticalDensity) * 100;
        item.compaction = compaction.toFixed(1);

        // Calculate voids
        const voids =
          ((theoreticalDensity - bulkDensity) / theoreticalDensity) * 100;
        item.voids = voids.toFixed(1);
      }
    }

    const newFormData = { ...formData, coreData: newData };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  const addCore = () => {
    const newCore = {
      id: (formData.coreData.length + 1).toString(),
      coreId: `C${String(formData.coreData.length + 1).padStart(3, "0")}`,
      location: "",
      chainage: "",
      diameter: "",
      height: "",
      weight: "",
      bulkDensity: "",
      theoreticalDensity: "",
      voids: "",
      compaction: "",
    };
    const newData = { ...formData, coreData: [...formData.coreData, newCore] };
    setFormData(newData);
    onUpdate(newData);
  };

  const removeCore = (index: number) => {
    if (formData.coreData.length > 1) {
      const newData = {
        ...formData,
        coreData: formData.coreData.filter((_, i) => i !== index),
      };
      setFormData(newData);
      onUpdate(newData);
    }
  };

  const calculateAverageCompaction = () => {
    const validData = formData.coreData.filter(
      (item) => item.compaction && parseFloat(item.compaction) > 0
    );

    if (validData.length === 0) return "0.0";

    const sum = validData.reduce(
      (acc, item) => acc + parseFloat(item.compaction),
      0
    );
    return (sum / validData.length).toFixed(1);
  };

  const calculateAverageDensity = () => {
    const validData = formData.coreData.filter(
      (item) => item.bulkDensity && parseFloat(item.bulkDensity) > 0
    );

    if (validData.length === 0) return "0.00";

    const sum = validData.reduce(
      (acc, item) => acc + parseFloat(item.bulkDensity),
      0
    );
    return (sum / validData.length).toFixed(2);
  };

  const getCompactionStatus = (compaction: number, target: number) => {
    if (target === 0) return "Target not specified";

    const deviation = compaction - target;

    if (deviation >= -1 && deviation <= 1) return "Within tolerance (±1%)";
    if (deviation >= -2 && deviation <= 2) return "Acceptable (±2%)";
    if (deviation > 2) return "Above target - Good";
    return "Below target - Poor";
  };

  const getDensityStatus = (density: number, target: number) => {
    if (target === 0) return "Target not specified";

    const percentage = (density / target) * 100;

    if (percentage >= 98) return "Excellent - Well compacted";
    if (percentage >= 95) return "Good - Adequately compacted";
    if (percentage >= 92) return "Fair - Moderately compacted";
    return "Poor - Under-compacted";
  };

  const averageCompaction = calculateAverageCompaction();
  const averageDensity = calculateAverageDensity();
  const targetCompaction = parseFloat(formData.targetCompaction) || 0;
  const targetDensity = parseFloat(formData.targetDensity) || 0;

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
                placeholder="Section identifier"
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
              <Label htmlFor="layerType">Layer Type</Label>
              <Select
                value={formData.layerType}
                onValueChange={(value) => updateFormData("layerType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Wearing Course">Wearing Course</SelectItem>
                  <SelectItem value="Binder Course">Binder Course</SelectItem>
                  <SelectItem value="Base Course">Base Course</SelectItem>
                  <SelectItem value="Regulating Course">
                    Regulating Course
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="mixType">Mix Type</Label>
              <Select
                value={formData.mixType}
                onValueChange={(value) => updateFormData("mixType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dense Bituminous Macadam">
                    Dense Bituminous Macadam
                  </SelectItem>
                  <SelectItem value="Bituminous Concrete">
                    Bituminous Concrete
                  </SelectItem>
                  <SelectItem value="Semi-Dense Bituminous Concrete">
                    Semi-Dense Bituminous Concrete
                  </SelectItem>
                  <SelectItem value="Open-Graded Friction Course">
                    Open-Graded Friction Course
                  </SelectItem>
                  <SelectItem value="Stone Matrix Asphalt">
                    Stone Matrix Asphalt
                  </SelectItem>
                </SelectContent>
              </Select>
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
              <Label htmlFor="targetDensity">Target Density (kg/m³)</Label>
              <Input
                id="targetDensity"
                type="number"
                step="0.01"
                value={formData.targetDensity}
                onChange={(e) =>
                  updateFormData("targetDensity", e.target.value)
                }
                placeholder="2400"
              />
            </div>
            <div>
              <Label htmlFor="targetCompaction">Target Compaction (%)</Label>
              <Input
                id="targetCompaction"
                type="number"
                step="0.1"
                value={formData.targetCompaction}
                onChange={(e) =>
                  updateFormData("targetCompaction", e.target.value)
                }
                placeholder="98"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Density Measurements */}
      <Card>
        <CardHeader>
          <CardTitle>Core Density Measurements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left">
                    Core ID
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Location
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Chainage (km)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Diameter (mm)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Height (mm)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Weight (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Bulk Density (kg/m³)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Theoretical Density (kg/m³)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Voids (%)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Compaction (%)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {formData.coreData.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.coreId}
                        onChange={(e) =>
                          updateCoreData(index, "coreId", e.target.value)
                        }
                        placeholder="C001"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.location}
                        onChange={(e) =>
                          updateCoreData(index, "location", e.target.value)
                        }
                        placeholder="Lane 1"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.chainage}
                        onChange={(e) =>
                          updateCoreData(index, "chainage", e.target.value)
                        }
                        placeholder="1.500"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.diameter}
                        onChange={(e) =>
                          updateCoreData(index, "diameter", e.target.value)
                        }
                        placeholder="100"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.height}
                        onChange={(e) =>
                          updateCoreData(index, "height", e.target.value)
                        }
                        placeholder="60"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.weight}
                        onChange={(e) =>
                          updateCoreData(index, "weight", e.target.value)
                        }
                        placeholder="1200"
                        className="w-20"
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
                      <Input
                        value={item.theoreticalDensity}
                        onChange={(e) =>
                          updateCoreData(
                            index,
                            "theoreticalDensity",
                            e.target.value
                          )
                        }
                        placeholder="2450"
                        className="w-24"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.voids}
                        readOnly
                        className="w-16 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.compaction}
                        readOnly
                        className="w-20 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCore(index)}
                        disabled={formData.coreData.length <= 1}
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
            <Button onClick={addCore} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Core Sample
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Asphalt Core Density Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-900">Average Density</h4>
              <p className="text-3xl font-mono text-blue-800">
                {averageDensity} kg/m³
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Bulk density of cores
              </p>
            </div>
            <div className="text-center p-6 bg-green-50 border border-green-200 rounded">
              <h4 className="font-semibold text-green-900">
                Average Compaction
              </h4>
              <p className="text-3xl font-mono text-green-800">
                {averageCompaction}%
              </p>
              <p className="text-sm text-green-700 mt-1">
                Degree of compaction
              </p>
            </div>
            <div className="text-center p-6 bg-orange-50 border border-orange-200 rounded">
              <h4 className="font-semibold text-orange-900">Quality Status</h4>
              <div className="text-orange-800 mt-2">
                <p className="text-lg font-medium">
                  {parseFloat(averageCompaction) !== 0
                    ? getCompactionStatus(
                        parseFloat(averageCompaction),
                        targetCompaction
                      )
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
                <span className="font-medium">Layer Type:</span>
                <p className="text-muted-foreground">{formData.layerType}</p>
              </div>
              <div>
                <span className="font-medium">Mix Type:</span>
                <p className="text-muted-foreground">{formData.mixType}</p>
              </div>
              <div>
                <span className="font-medium">Asphalt Content:</span>
                <p className="text-muted-foreground">
                  {formData.asphaltContent}%
                </p>
              </div>
              <div>
                <span className="font-medium">Target Density:</span>
                <p className="text-muted-foreground">
                  {formData.targetDensity} kg/m³
                </p>
              </div>
              <div>
                <span className="font-medium">Target Compaction:</span>
                <p className="text-muted-foreground">
                  {formData.targetCompaction}%
                </p>
              </div>
              <div>
                <span className="font-medium">Number of Cores:</span>
                <p className="text-muted-foreground">
                  {formData.coreData.length}
                </p>
              </div>
              <div>
                <span className="font-medium">Test Standard:</span>
                <p className="text-muted-foreground">
                  ASTM D2950 / AASHTO T 166
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-900 mb-2">
              Compaction Requirements
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>
                • Dense Bituminous Macadam: ≥ 92% of theoretical maximum density
              </li>
              <li>
                • Bituminous Concrete: ≥ 94% of theoretical maximum density
              </li>
              <li>• Wearing course: ≥ 96% of theoretical maximum density</li>
              <li>• Tolerance: ±2% from target compaction</li>
              <li>• Minimum 3 cores per 1000 m² of pavement</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded">
            <h4 className="font-semibold text-purple-900 mb-2">
              Test Procedure
            </h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Extract cores from completed pavement using core cutter</li>
              <li>• Measure core dimensions (diameter and height)</li>
              <li>• Weigh cores in air (bulk density)</li>
              <li>• Determine theoretical maximum density from mix design</li>
              <li>• Calculate degree of compaction and air voids</li>
              <li>• Compare with specification requirements</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <h4 className="font-semibold text-red-900 mb-2">
              Quality Control Notes
            </h4>
            <div className="text-sm text-red-800">
              <ul className="space-y-1">
                <li>• Low compaction indicates poor construction quality</li>
                <li>
                  • High air voids reduce durability and increase permeability
                </li>
                <li>
                  • Inadequate compaction leads to premature pavement failure
                </li>
                <li>
                  • Core locations should be representative of the pavement
                </li>
                <li>• Test cores should be taken after adequate curing time</li>
                <li>• Results help identify areas needing corrective action</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
