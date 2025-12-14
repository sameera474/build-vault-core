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

interface SieveData {
  id: string;
  sieveSize: string;
  weightRetained: string;
  cumulativeWeight: string;
  percentRetained: string;
  cumulativePercent: string;
  percentPassing: string;
}

interface SieveAnalysisTestProps {
  data: any;
  onUpdate: (data: any) => void;
  parentData?: any;
}

export function SieveAnalysisTest({ data, onUpdate }: SieveAnalysisTestProps) {
  const [formData, setFormData] = useState({
    sampleDescription: data.sampleDescription || "",
    materialType: data.materialType || "Fine Aggregate",
    sampleWeight: data.sampleWeight || "",
    dateOfTesting: data.dateOfTesting || "",
    testedBy: data.testedBy || "",
    sieveData: data.sieveData || [
      {
        id: "1",
        sieveSize: "25.0",
        weightRetained: "",
        cumulativeWeight: "",
        percentRetained: "",
        cumulativePercent: "",
        percentPassing: "",
      },
      {
        id: "2",
        sieveSize: "19.0",
        weightRetained: "",
        cumulativeWeight: "",
        percentRetained: "",
        cumulativePercent: "",
        percentPassing: "",
      },
      {
        id: "3",
        sieveSize: "12.5",
        weightRetained: "",
        cumulativeWeight: "",
        percentRetained: "",
        cumulativePercent: "",
        percentPassing: "",
      },
      {
        id: "4",
        sieveSize: "9.5",
        weightRetained: "",
        cumulativeWeight: "",
        percentRetained: "",
        cumulativePercent: "",
        percentPassing: "",
      },
      {
        id: "5",
        sieveSize: "4.75",
        weightRetained: "",
        cumulativeWeight: "",
        percentRetained: "",
        cumulativePercent: "",
        percentPassing: "",
      },
      {
        id: "6",
        sieveSize: "2.36",
        weightRetained: "",
        cumulativeWeight: "",
        percentRetained: "",
        cumulativePercent: "",
        percentPassing: "",
      },
      {
        id: "7",
        sieveSize: "1.18",
        weightRetained: "",
        cumulativeWeight: "",
        percentRetained: "",
        cumulativePercent: "",
        percentPassing: "",
      },
      {
        id: "8",
        sieveSize: "0.600",
        weightRetained: "",
        cumulativeWeight: "",
        percentRetained: "",
        cumulativePercent: "",
        percentPassing: "",
      },
      {
        id: "9",
        sieveSize: "0.300",
        weightRetained: "",
        cumulativeWeight: "",
        percentRetained: "",
        cumulativePercent: "",
        percentPassing: "",
      },
      {
        id: "10",
        sieveSize: "0.150",
        weightRetained: "",
        cumulativeWeight: "",
        percentRetained: "",
        cumulativePercent: "",
        percentPassing: "",
      },
      {
        id: "11",
        sieveSize: "Pan",
        weightRetained: "",
        cumulativeWeight: "",
        percentRetained: "",
        cumulativePercent: "",
        percentPassing: "",
      },
    ],
  });

  const updateFormData = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onUpdate(newData);
  };

  const updateSieveData = (index: number, field: string, value: string) => {
    const newData = [...formData.sieveData];
    newData[index] = { ...newData[index], [field]: value };

    // Auto-calculate percentages and cumulative values
    if (field === "weightRetained" && formData.sampleWeight) {
      const sampleWeight = parseFloat(formData.sampleWeight);
      const weightRetained = parseFloat(value) || 0;

      if (sampleWeight > 0) {
        // Calculate percent retained for this sieve
        const percentRetained = (weightRetained / sampleWeight) * 100;
        newData[index].percentRetained = percentRetained.toFixed(2);

        // Calculate cumulative weight and percentages
        let cumulativeWeight = 0;
        for (let i = 0; i <= index; i++) {
          cumulativeWeight += parseFloat(newData[i].weightRetained) || 0;
        }

        newData[index].cumulativeWeight = cumulativeWeight.toFixed(2);
        const cumulativePercent = (cumulativeWeight / sampleWeight) * 100;
        newData[index].cumulativePercent = cumulativePercent.toFixed(2);
        newData[index].percentPassing = (100 - cumulativePercent).toFixed(2);
      }
    }

    const newFormData = { ...formData, sieveData: newData };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  const addSieve = () => {
    const newSieve = {
      id: (formData.sieveData.length + 1).toString(),
      sieveSize: "",
      weightRetained: "",
      cumulativeWeight: "",
      percentRetained: "",
      cumulativePercent: "",
      percentPassing: "",
    };
    const newData = {
      ...formData,
      sieveData: [...formData.sieveData, newSieve],
    };
    setFormData(newData);
    onUpdate(newData);
  };

  const removeSieve = (index: number) => {
    if (formData.sieveData.length > 1) {
      const newData = {
        ...formData,
        sieveData: formData.sieveData.filter((_, i) => i !== index),
      };
      setFormData(newData);
      onUpdate(newData);
    }
  };

  const calculateFinenessModulus = () => {
    // Fineness modulus is the sum of cumulative percentages divided by 100
    const validData = formData.sieveData.filter(
      (item) => item.cumulativePercent && parseFloat(item.cumulativePercent) > 0
    );

    if (validData.length === 0) return "0.00";

    const sum = validData.reduce(
      (acc, item) => acc + parseFloat(item.cumulativePercent),
      0
    );
    return (sum / 100).toFixed(2);
  };

  const getParticleSizeDistribution = () => {
    const data = formData.sieveData.filter(
      (item) => item.percentPassing && item.sieveSize !== "Pan"
    );
    if (data.length === 0)
      return {
        d10: "N/A",
        d30: "N/A",
        d60: "N/A",
        uniformity: "N/A",
        curvature: "N/A",
      };

    const d10 =
      data.find((item) => parseFloat(item.percentPassing) <= 10)?.sieveSize ||
      "N/A";
    const d30 =
      data.find((item) => parseFloat(item.percentPassing) <= 30)?.sieveSize ||
      "N/A";
    const d60 =
      data.find((item) => parseFloat(item.percentPassing) <= 60)?.sieveSize ||
      "N/A";

    const uniformity =
      d60 !== "N/A" && d10 !== "N/A"
        ? (parseFloat(d60) / parseFloat(d10)).toFixed(2)
        : "N/A";
    const curvature =
      d30 !== "N/A" && d10 !== "N/A" && d60 !== "N/A"
        ? (parseFloat(d30) ** 2 / (parseFloat(d10) * parseFloat(d60))).toFixed(
            2
          )
        : "N/A";

    return { d10, d30, d60, uniformity, curvature };
  };

  const finenessModulus = calculateFinenessModulus();
  const particleSize = getParticleSizeDistribution();

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
              <Input
                id="sampleDescription"
                value={formData.sampleDescription}
                onChange={(e) =>
                  updateFormData("sampleDescription", e.target.value)
                }
                placeholder="Describe the aggregate/soil sample"
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
                  <SelectItem value="Fine Aggregate">Fine Aggregate</SelectItem>
                  <SelectItem value="Coarse Aggregate">
                    Coarse Aggregate
                  </SelectItem>
                  <SelectItem value="Soil">Soil</SelectItem>
                  <SelectItem value="Sand">Sand</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sampleWeight">Sample Weight (g)</Label>
              <Input
                id="sampleWeight"
                type="number"
                value={formData.sampleWeight}
                onChange={(e) => updateFormData("sampleWeight", e.target.value)}
                placeholder="500"
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
            <div className="md:col-span-2">
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

      {/* Sieve Analysis Data */}
      <Card>
        <CardHeader>
          <CardTitle>Sieve Analysis Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left">
                    Sieve Size (mm)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Weight Retained (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Cum. Weight (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    % Retained
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Cum. %
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    % Passing
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {formData.sieveData.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.sieveSize}
                        onChange={(e) =>
                          updateSieveData(index, "sieveSize", e.target.value)
                        }
                        placeholder="25.0"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.weightRetained}
                        onChange={(e) =>
                          updateSieveData(
                            index,
                            "weightRetained",
                            e.target.value
                          )
                        }
                        placeholder="50.5"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.cumulativeWeight}
                        readOnly
                        className="w-20 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.percentRetained}
                        readOnly
                        className="w-16 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.cumulativePercent}
                        readOnly
                        className="w-16 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.percentPassing}
                        readOnly
                        className="w-16 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSieve(index)}
                        disabled={formData.sieveData.length <= 1}
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
            <Button onClick={addSieve} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Sieve
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Sieve Analysis Results Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-900">Fineness Modulus</h4>
              <p className="text-3xl font-mono text-blue-800">
                {finenessModulus}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Sum of cumulative % / 100
              </p>
            </div>
            <div className="text-center p-6 bg-green-50 border border-green-200 rounded">
              <h4 className="font-semibold text-green-900">
                Material Classification
              </h4>
              <div className="text-green-800 mt-2">
                {parseFloat(finenessModulus) >= 6.0 && <p>Coarse Aggregate</p>}
                {parseFloat(finenessModulus) >= 3.0 &&
                  parseFloat(finenessModulus) < 6.0 && <p>Medium Aggregate</p>}
                {parseFloat(finenessModulus) < 3.0 && <p>Fine Aggregate</p>}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
            <h4 className="font-semibold text-gray-900 mb-2">
              Particle Size Distribution
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <span className="font-medium">D₁₀:</span>
                <p className="text-muted-foreground">{particleSize.d10} mm</p>
              </div>
              <div>
                <span className="font-medium">D₃₀:</span>
                <p className="text-muted-foreground">{particleSize.d30} mm</p>
              </div>
              <div>
                <span className="font-medium">D₆₀:</span>
                <p className="text-muted-foreground">{particleSize.d60} mm</p>
              </div>
              <div>
                <span className="font-medium">Uniformity (Cu):</span>
                <p className="text-muted-foreground">
                  {particleSize.uniformity}
                </p>
              </div>
              <div>
                <span className="font-medium">Curvature (Cc):</span>
                <p className="text-muted-foreground">
                  {particleSize.curvature}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-900 mb-2">
              Interpretation Guidelines
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>
                • Uniformity Coefficient (Cu) greater than 6: Well-graded
                material
              </li>
              <li>• Uniformity Coefficient (Cu) 1-3: Poorly graded material</li>
              <li>• Curvature Coefficient (Cc) 1-3: Well-graded material</li>
              <li>• Fineness Modulus 2.3-3.0: Suitable for concrete</li>
              <li>• Fineness Modulus 2.6-2.9: Suitable for asphalt</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
