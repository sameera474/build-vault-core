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
  sampleWeight: string;
  clayWeight: string;
  siltWeight: string;
  dustWeight: string;
  clayPercentage: string;
  siltPercentage: string;
  dustPercentage: string;
  totalFinePercentage: string;
}

interface ClaySiltDustFractionTestProps {
  data: any;
  onUpdate: (data: any) => void;
  parentData?: any;
}

export function ClaySiltDustFractionTest({
  data,
  onUpdate,
}: ClaySiltDustFractionTestProps) {
  const [formData, setFormData] = useState({
    projectName: data.projectName || "",
    aggregateType: data.aggregateType || "Fine Aggregate",
    dateOfTesting: data.dateOfTesting || "",
    testedBy: data.testedBy || "",
    sampleData: data.sampleData || [
      {
        id: "1",
        sampleId: "F001",
        sampleWeight: "",
        clayWeight: "",
        siltWeight: "",
        dustWeight: "",
        clayPercentage: "",
        siltPercentage: "",
        dustPercentage: "",
        totalFinePercentage: "",
      },
      {
        id: "2",
        sampleId: "F002",
        sampleWeight: "",
        clayWeight: "",
        siltWeight: "",
        dustWeight: "",
        clayPercentage: "",
        siltPercentage: "",
        dustPercentage: "",
        totalFinePercentage: "",
      },
      {
        id: "3",
        sampleId: "F003",
        sampleWeight: "",
        clayWeight: "",
        siltWeight: "",
        dustWeight: "",
        clayPercentage: "",
        siltPercentage: "",
        dustPercentage: "",
        totalFinePercentage: "",
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
      field === "sampleWeight" ||
      field === "clayWeight" ||
      field === "siltWeight" ||
      field === "dustWeight"
    ) {
      const item = newData[index];
      if (
        item.sampleWeight &&
        (item.clayWeight || item.siltWeight || item.dustWeight)
      ) {
        const sampleWeight = parseFloat(item.sampleWeight) || 0;
        const clayWeight = parseFloat(item.clayWeight) || 0;
        const siltWeight = parseFloat(item.siltWeight) || 0;
        const dustWeight = parseFloat(item.dustWeight) || 0;

        if (sampleWeight > 0) {
          item.clayPercentage = ((clayWeight / sampleWeight) * 100).toFixed(2);
          item.siltPercentage = ((siltWeight / sampleWeight) * 100).toFixed(2);
          item.dustPercentage = ((dustWeight / sampleWeight) * 100).toFixed(2);
          item.totalFinePercentage = (
            ((clayWeight + siltWeight + dustWeight) / sampleWeight) *
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
      sampleId: `F${String(formData.sampleData.length + 1).padStart(3, "0")}`,
      sampleWeight: "",
      clayWeight: "",
      siltWeight: "",
      dustWeight: "",
      clayPercentage: "",
      siltPercentage: "",
      dustPercentage: "",
      totalFinePercentage: "",
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

  const calculateAverageClay = () => {
    const validData = formData.sampleData.filter(
      (item) => item.clayPercentage && parseFloat(item.clayPercentage) > 0
    );

    if (validData.length === 0) return "0.00";

    const sum = validData.reduce(
      (acc, item) => acc + parseFloat(item.clayPercentage),
      0
    );
    return (sum / validData.length).toFixed(2);
  };

  const calculateAverageSilt = () => {
    const validData = formData.sampleData.filter(
      (item) => item.siltPercentage && parseFloat(item.siltPercentage) > 0
    );

    if (validData.length === 0) return "0.00";

    const sum = validData.reduce(
      (acc, item) => acc + parseFloat(item.siltPercentage),
      0
    );
    return (sum / validData.length).toFixed(2);
  };

  const calculateAverageDust = () => {
    const validData = formData.sampleData.filter(
      (item) => item.dustPercentage && parseFloat(item.dustPercentage) > 0
    );

    if (validData.length === 0) return "0.00";

    const sum = validData.reduce(
      (acc, item) => acc + parseFloat(item.dustPercentage),
      0
    );
    return (sum / validData.length).toFixed(2);
  };

  const calculateAverageTotalFine = () => {
    const validData = formData.sampleData.filter(
      (item) =>
        item.totalFinePercentage && parseFloat(item.totalFinePercentage) > 0
    );

    if (validData.length === 0) return "0.00";

    const sum = validData.reduce(
      (acc, item) => acc + parseFloat(item.totalFinePercentage),
      0
    );
    return (sum / validData.length).toFixed(2);
  };

  const getClaySiltDustStatus = (totalFine: number) => {
    if (totalFine <= 3) return "Excellent - Very low clay/silt/dust content";
    if (totalFine <= 5) return "Good - Acceptable fine particle content";
    if (totalFine <= 8) return "Fair - Moderate fine particle content";
    if (totalFine <= 12) return "Poor - High fine particle content";
    return "Very Poor - Excessive clay/silt/dust content";
  };

  const averageClay = calculateAverageClay();
  const averageSilt = calculateAverageSilt();
  const averageDust = calculateAverageDust();
  const averageTotalFine = calculateAverageTotalFine();
  const claySiltDustStatus = getClaySiltDustStatus(
    parseFloat(averageTotalFine)
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
          </div>
        </CardContent>
      </Card>

      {/* Clay Silt Dust Fraction Results */}
      <Card>
        <CardHeader>
          <CardTitle>Clay Silt Dust Fraction Test Results</CardTitle>
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
                    Sample Weight (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Clay Weight (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Silt Weight (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Dust Weight (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Clay (%)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Silt (%)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Dust (%)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Total Fine (%)
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
                        value={item.sampleWeight}
                        onChange={(e) =>
                          updateSampleData(
                            index,
                            "sampleWeight",
                            e.target.value
                          )
                        }
                        placeholder="500"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.clayWeight}
                        onChange={(e) =>
                          updateSampleData(index, "clayWeight", e.target.value)
                        }
                        placeholder="5"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.siltWeight}
                        onChange={(e) =>
                          updateSampleData(index, "siltWeight", e.target.value)
                        }
                        placeholder="8"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.dustWeight}
                        onChange={(e) =>
                          updateSampleData(index, "dustWeight", e.target.value)
                        }
                        placeholder="12"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.clayPercentage}
                        readOnly
                        className="w-16 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.siltPercentage}
                        readOnly
                        className="w-16 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.dustPercentage}
                        readOnly
                        className="w-16 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.totalFinePercentage}
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
          <CardTitle>Clay Silt Dust Fraction Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-900">Average Clay</h4>
              <p className="text-3xl font-mono text-blue-800">{averageClay}%</p>
              <p className="text-sm text-blue-700 mt-1">
                Particles smaller than 0.002mm
              </p>
            </div>
            <div className="text-center p-6 bg-green-50 border border-green-200 rounded">
              <h4 className="font-semibold text-green-900">Average Silt</h4>
              <p className="text-3xl font-mono text-green-800">
                {averageSilt}%
              </p>
              <p className="text-sm text-green-700 mt-1">
                Particles 0.002-0.075mm
              </p>
            </div>
            <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded">
              <h4 className="font-semibold text-yellow-900">Average Dust</h4>
              <p className="text-3xl font-mono text-yellow-800">
                {averageDust}%
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Particles 0.075-0.425mm
              </p>
            </div>
            <div className="text-center p-6 bg-orange-50 border border-orange-200 rounded">
              <h4 className="font-semibold text-orange-900">
                Total Fine Content
              </h4>
              <p className="text-3xl font-mono text-orange-800">
                {averageTotalFine}%
              </p>
              <p className="text-sm text-orange-700 mt-1">
                Combined fine particles
              </p>
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
                <span className="font-medium">Quality Status:</span>
                <p className="text-muted-foreground">{claySiltDustStatus}</p>
              </div>
              <div>
                <span className="font-medium">Number of Samples:</span>
                <p className="text-muted-foreground">
                  {formData.sampleData.length}
                </p>
              </div>
              <div>
                <span className="font-medium">Test Standard:</span>
                <p className="text-muted-foreground">IS 2386 / ASTM C117</p>
              </div>
              <div>
                <span className="font-medium">Test Method:</span>
                <p className="text-muted-foreground">Sedimentation & sieving</p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-900 mb-2">
              Clay Silt Dust Specifications
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Total fine content ≤ 3% for high-quality concrete</li>
              <li>
                • Total fine content ≤ 5% for normal concrete applications
              </li>
              <li>• Clay content should be minimal (less than 1%)</li>
              <li>• Silt content affects workability and strength</li>
              <li>• Dust content influences cement requirements</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded">
            <h4 className="font-semibold text-purple-900 mb-2">
              Test Procedure
            </h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Take representative sample (500g minimum)</li>
              <li>• Wash sample through 75μm sieve to remove fines</li>
              <li>• Dry the washed sample and fines separately</li>
              <li>• Sieve dried fines through 75μm and 425μm sieves</li>
              <li>
                • Weigh fractions: clay (smaller than 75μm), silt (75-425μm),
                dust (larger than 425μm)
              </li>
              <li>• Calculate percentages by weight</li>
              <li>• Report total fine content and individual fractions</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <h4 className="font-semibold text-red-900 mb-2">
              Quality Control Notes
            </h4>
            <div className="text-sm text-red-800">
              <ul className="space-y-1">
                <li>
                  • High clay content reduces strength and increases shrinkage
                </li>
                <li>• Silt affects workability and increases water demand</li>
                <li>• Dust content influences aggregate-cement bond</li>
                <li>• Fine particles increase cement consumption</li>
                <li>• Testing ensures compliance with specifications</li>
                <li>
                  • Results help optimize mix design and material selection
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
