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

interface FractionData {
  id: string;
  fractionName: string;
  sieveSize: string;
  retained: string;
  passing: string;
  cumulativePassing: string;
}

interface IndividualGradationsTestProps {
  data: any;
  onUpdate: (data: any) => void;
  parentData?: any;
}

export function IndividualGradationsTest({
  data,
  onUpdate,
}: IndividualGradationsTestProps) {
  const [formData, setFormData] = useState({
    projectName: data.projectName || "",
    mixType: data.mixType || "Dense Bituminous Macadam",
    dateOfTesting: data.dateOfTesting || "",
    testedBy: data.testedBy || "",
    sampleWeight: data.sampleWeight || "",
    fractionData: data.fractionData || [
      {
        id: "1",
        fractionName: "Coarse Aggregate (20mm-4.75mm)",
        sieveSize: "20",
        retained: "",
        passing: "",
        cumulativePassing: "",
      },
      {
        id: "2",
        fractionName: "Fine Aggregate (4.75mm-0.075mm)",
        sieveSize: "4.75",
        retained: "",
        passing: "",
        cumulativePassing: "",
      },
      {
        id: "3",
        fractionName: "Filler (<0.075mm)",
        sieveSize: "0.075",
        retained: "",
        passing: "",
        cumulativePassing: "",
      },
    ],
  });

  const updateFormData = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onUpdate(newData);
  };

  const updateFractionData = (index: number, field: string, value: string) => {
    const newData = [...formData.fractionData];
    newData[index] = { ...newData[index], [field]: value };

    // Auto-calculate passing percentage when retained weight is entered
    if (field === "retained" && formData.sampleWeight) {
      const retained = parseFloat(value) || 0;
      const sampleWeight = parseFloat(formData.sampleWeight) || 0;
      if (sampleWeight > 0) {
        const passing = sampleWeight - retained;
        const passingPercent = (passing / sampleWeight) * 100;
        newData[index].passing = passing.toFixed(2);
        // For individual gradations, cumulative passing is the same as passing
        newData[index].cumulativePassing = passingPercent.toFixed(1);
      }
    }

    const newFormData = { ...formData, fractionData: newData };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  const addFraction = () => {
    const newFraction = {
      id: (formData.fractionData.length + 1).toString(),
      fractionName: `Fraction ${formData.fractionData.length + 1}`,
      sieveSize: "",
      retained: "",
      passing: "",
      cumulativePassing: "",
    };
    const newData = {
      ...formData,
      fractionData: [...formData.fractionData, newFraction],
    };
    setFormData(newData);
    onUpdate(newData);
  };

  const removeFraction = (index: number) => {
    if (formData.fractionData.length > 1) {
      const newData = {
        ...formData,
        fractionData: formData.fractionData.filter((_, i) => i !== index),
      };
      setFormData(newData);
      onUpdate(newData);
    }
  };

  const calculateTotalRetained = () => {
    return formData.fractionData
      .reduce((sum, item) => {
        return sum + (parseFloat(item.retained) || 0);
      }, 0)
      .toFixed(2);
  };

  const calculateTotalPassing = () => {
    return formData.fractionData
      .reduce((sum, item) => {
        return sum + (parseFloat(item.passing) || 0);
      }, 0)
      .toFixed(2);
  };

  const getGradationStatus = () => {
    const fractions = formData.fractionData;
    if (fractions.length < 3) return "Insufficient data";

    // Check if gradation meets typical requirements
    const coarseAgg = fractions.find((f) => f.fractionName.includes("Coarse"));
    const fineAgg = fractions.find((f) => f.fractionName.includes("Fine"));
    const filler = fractions.find((f) => f.fractionName.includes("Filler"));

    if (!coarseAgg || !fineAgg || !filler) return "Incomplete gradation data";

    const coarsePercent = parseFloat(coarseAgg.cumulativePassing) || 0;
    const finePercent = parseFloat(fineAgg.cumulativePassing) || 0;
    const fillerPercent = parseFloat(filler.cumulativePassing) || 0;

    // Typical DBM gradation: 40-60% coarse, 30-50% fine, 4-8% filler
    if (
      coarsePercent >= 40 &&
      coarsePercent <= 60 &&
      finePercent >= 30 &&
      finePercent <= 50 &&
      fillerPercent >= 4 &&
      fillerPercent <= 8
    ) {
      return "Within specification";
    }

    return "Out of specification";
  };

  const getFractionBalance = () => {
    const fractions = formData.fractionData;
    const total = fractions.reduce((sum, item) => {
      return sum + (parseFloat(item.passing) || 0);
    }, 0);

    if (total === 0) return "No data";

    const percentages = fractions.map((item) => {
      const percent = ((parseFloat(item.passing) || 0) / total) * 100;
      return `${item.fractionName.split(" ")[0]}: ${percent.toFixed(1)}%`;
    });

    return percentages.join(", ");
  };

  const totalRetained = calculateTotalRetained();
  const totalPassing = calculateTotalPassing();
  const gradationStatus = getGradationStatus();
  const fractionBalance = getFractionBalance();

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
              <Label htmlFor="sampleWeight">Sample Weight (g)</Label>
              <Input
                id="sampleWeight"
                type="number"
                step="0.01"
                value={formData.sampleWeight}
                onChange={(e) => updateFormData("sampleWeight", e.target.value)}
                placeholder="500.00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Gradations */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Fraction Gradations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left">
                    Fraction Name
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Sieve Size (mm)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Retained (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Passing (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Cumulative Passing (%)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {formData.fractionData.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.fractionName}
                        onChange={(e) =>
                          updateFractionData(
                            index,
                            "fractionName",
                            e.target.value
                          )
                        }
                        placeholder="Coarse Aggregate"
                        className="w-48"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.sieveSize}
                        onChange={(e) =>
                          updateFractionData(index, "sieveSize", e.target.value)
                        }
                        placeholder="20"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.retained}
                        onChange={(e) =>
                          updateFractionData(index, "retained", e.target.value)
                        }
                        placeholder="250.00"
                        className="w-24"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.passing}
                        readOnly
                        className="w-24 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.cumulativePassing}
                        readOnly
                        className="w-24 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFraction(index)}
                        disabled={formData.fractionData.length <= 1}
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
            <Button onClick={addFraction} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Fraction
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Gradations Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-900">Total Retained</h4>
              <p className="text-3xl font-mono text-blue-800">
                {totalRetained} g
              </p>
              <p className="text-sm text-blue-700 mt-1">
                All fractions combined
              </p>
            </div>
            <div className="text-center p-6 bg-green-50 border border-green-200 rounded">
              <h4 className="font-semibold text-green-900">Total Passing</h4>
              <p className="text-3xl font-mono text-green-800">
                {totalPassing} g
              </p>
              <p className="text-sm text-green-700 mt-1">
                Sample weight verification
              </p>
            </div>
            <div className="text-center p-6 bg-orange-50 border border-orange-200 rounded">
              <h4 className="font-semibold text-orange-900">
                Gradation Status
              </h4>
              <div className="text-orange-800 mt-2">
                <p className="text-lg font-medium">{gradationStatus}</p>
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
                <span className="font-medium">Mix Type:</span>
                <p className="text-muted-foreground">{formData.mixType}</p>
              </div>
              <div>
                <span className="font-medium">Sample Weight:</span>
                <p className="text-muted-foreground">
                  {formData.sampleWeight} g
                </p>
              </div>
              <div>
                <span className="font-medium">Number of Fractions:</span>
                <p className="text-muted-foreground">
                  {formData.fractionData.length}
                </p>
              </div>
              <div>
                <span className="font-medium">Test Standard:</span>
                <p className="text-muted-foreground">ASTM C136 / IS 2386</p>
              </div>
              <div>
                <span className="font-medium">Fraction Balance:</span>
                <p className="text-muted-foreground text-xs">
                  {fractionBalance}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-900 mb-2">
              Typical Gradation Ranges
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>
                • Dense Bituminous Macadam: 40-60% coarse, 30-50% fine, 4-8%
                filler
              </li>
              <li>
                • Bituminous Concrete: 35-50% coarse, 40-55% fine, 5-10% filler
              </li>
              <li>• Semi-Dense: 30-45% coarse, 45-60% fine, 5-10% filler</li>
              <li>• Open-Graded: 70-85% coarse, 10-20% fine, 3-7% filler</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded">
            <h4 className="font-semibold text-purple-900 mb-2">
              Test Procedure
            </h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>
                • Separate asphalt mix into individual aggregate fractions
              </li>
              <li>• Use appropriate sieve sizes for each fraction</li>
              <li>• Weigh retained material on each sieve</li>
              <li>• Calculate passing and cumulative percentages</li>
              <li>• Compare with mix design specifications</li>
              <li>• Verify fraction balance meets requirements</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <h4 className="font-semibold text-red-900 mb-2">
              Quality Control Notes
            </h4>
            <div className="text-sm text-red-800">
              <ul className="space-y-1">
                <li>
                  • Proper fraction separation ensures accurate gradation
                  analysis
                </li>
                <li>
                  • Coarse aggregate content affects stability and rut
                  resistance
                </li>
                <li>
                  • Fine aggregate content influences workability and density
                </li>
                <li>
                  • Filler content affects asphalt absorption and mixture
                  properties
                </li>
                <li>
                  • Gradation outside specification may require mix design
                  adjustment
                </li>
                <li>
                  • Consistent gradation ensures uniform pavement performance
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
