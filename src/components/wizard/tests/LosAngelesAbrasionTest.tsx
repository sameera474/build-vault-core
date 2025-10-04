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

interface LosAngelesAbrasionTestProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function LosAngelesAbrasionTest({
  data,
  onUpdate,
}: LosAngelesAbrasionTestProps) {
  const [formData, setFormData] = useState({
    sampleDescription: data.sampleDescription || "",
    dateOfTesting: data.dateOfTesting || "",
    testedBy: data.testedBy || "",
    sampleWeight: data.sampleWeight || "",
    chargeNumber: data.chargeNumber || "12", // Number of steel spheres
    revolutions: data.revolutions || "500", // Standard is 500 revolutions
    weightAfterTest: data.weightAfterTest || "",
    weightPassing2_36mm: data.weightPassing2_36mm || "",
    weightPassing1_70mm: data.weightPassing1_70mm || "",
    abrasionLoss: data.abrasionLoss || "",
  });

  const updateFormData = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };

    // Auto-calculate abrasion loss when weights are provided
    if (field === "sampleWeight" || field === "weightAfterTest") {
      if (newData.sampleWeight && newData.weightAfterTest) {
        const sampleWeight = parseFloat(newData.sampleWeight);
        const weightAfterTest = parseFloat(newData.weightAfterTest);

        if (sampleWeight > 0) {
          // Abrasion Loss (%) = [(Original Weight - Weight After Test) / Original Weight] × 100
          const abrasionLoss =
            ((sampleWeight - weightAfterTest) / sampleWeight) * 100;
          newData.abrasionLoss = abrasionLoss.toFixed(2);
        }
      }
    }

    setFormData(newData);
    onUpdate(newData);
  };

  const calculateAbrasionLoss = () => {
    const sampleWeight = parseFloat(formData.sampleWeight);
    const weightAfterTest = parseFloat(formData.weightAfterTest);

    if (!sampleWeight || !weightAfterTest) {
      return "Insufficient data";
    }

    const abrasionLoss =
      ((sampleWeight - weightAfterTest) / sampleWeight) * 100;
    return abrasionLoss.toFixed(2);
  };

  const getClassification = (abrasionLoss: number) => {
    if (abrasionLoss <= 10) return "Excellent - Very High Resistance";
    if (abrasionLoss <= 20) return "Good - High Resistance";
    if (abrasionLoss <= 30) return "Fair - Moderate Resistance";
    if (abrasionLoss <= 40) return "Poor - Low Resistance";
    if (abrasionLoss <= 50) return "Very Poor - Very Low Resistance";
    return "Unsuitable - Extremely Low Resistance";
  };

  const abrasionLoss = calculateAbrasionLoss();

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="sampleWeight">Sample Weight (g)</Label>
              <Input
                id="sampleWeight"
                type="number"
                value={formData.sampleWeight}
                onChange={(e) => updateFormData("sampleWeight", e.target.value)}
                placeholder="5000"
              />
            </div>
            <div>
              <Label htmlFor="chargeNumber">Steel Spheres</Label>
              <Select
                value={formData.chargeNumber}
                onValueChange={(value) => updateFormData("chargeNumber", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 spheres (standard)</SelectItem>
                  <SelectItem value="11">11 spheres</SelectItem>
                  <SelectItem value="10">10 spheres</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="revolutions">Revolutions</Label>
              <Select
                value={formData.revolutions}
                onValueChange={(value) => updateFormData("revolutions", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="500">500 (standard)</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="weightAfterTest">Weight After Test (g)</Label>
              <Input
                id="weightAfterTest"
                type="number"
                value={formData.weightAfterTest}
                onChange={(e) =>
                  updateFormData("weightAfterTest", e.target.value)
                }
                placeholder="4850"
              />
            </div>
            <div>
              <Label htmlFor="weightPassing2_36mm">
                Weight Passing 2.36mm (g)
              </Label>
              <Input
                id="weightPassing2_36mm"
                type="number"
                value={formData.weightPassing2_36mm}
                onChange={(e) =>
                  updateFormData("weightPassing2_36mm", e.target.value)
                }
                placeholder="150"
              />
            </div>
            <div>
              <Label htmlFor="weightPassing1_70mm">
                Weight Passing 1.70mm (g)
              </Label>
              <Input
                id="weightPassing1_70mm"
                type="number"
                value={formData.weightPassing1_70mm}
                onChange={(e) =>
                  updateFormData("weightPassing1_70mm", e.target.value)
                }
                placeholder="100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Los Angeles Abrasion Test Results Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-900">Abrasion Loss</h4>
              <p className="text-3xl font-mono text-blue-800">
                {abrasionLoss}%
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Percentage of material lost
              </p>
            </div>
            <div className="text-center p-6 bg-green-50 border border-green-200 rounded">
              <h4 className="font-semibold text-green-900">
                Aggregate Quality
              </h4>
              <div className="text-green-800 mt-2">
                {parseFloat(abrasionLoss) !== 0 && (
                  <p className="text-lg font-medium">
                    {getClassification(parseFloat(abrasionLoss))}
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
                <span className="font-medium">Sample Weight:</span>
                <p className="text-muted-foreground">
                  {formData.sampleWeight} g
                </p>
              </div>
              <div>
                <span className="font-medium">Steel Spheres:</span>
                <p className="text-muted-foreground">{formData.chargeNumber}</p>
              </div>
              <div>
                <span className="font-medium">Revolutions:</span>
                <p className="text-muted-foreground">{formData.revolutions}</p>
              </div>
              <div>
                <span className="font-medium">Test Standard:</span>
                <p className="text-muted-foreground">ASTM C131 / AASHTO T96</p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-900 mb-2">
              Abrasion Loss Classification
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• ≤ 10%: Excellent - Very high abrasion resistance</li>
              <li>• 10-20%: Good - High abrasion resistance</li>
              <li>• 20-30%: Fair - Moderate abrasion resistance</li>
              <li>• 30-40%: Poor - Low abrasion resistance</li>
              <li>• 40-50%: Very Poor - Very low abrasion resistance</li>
              <li>
                • Greater than 50%: Unsuitable - Extremely low abrasion
                resistance
              </li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded">
            <h4 className="font-semibold text-purple-900 mb-2">
              Test Procedure
            </h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Sample size: 5000g for 37.5-25mm aggregates</li>
              <li>• Steel spheres: 12 spheres of 48mm diameter</li>
              <li>• Drum revolutions: 500 at 30-33 rpm</li>
              <li>• Test duration: Approximately 1 hour</li>
              <li>• Measures combined effect of abrasion and impact</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <h4 className="font-semibold text-red-900 mb-2">
              Calculation Method
            </h4>
            <div className="text-sm text-red-800">
              <p>
                <strong>
                  Abrasion Loss (%) = [(Original Weight - Weight After Test) /
                  Original Weight] × 100
                </strong>
              </p>
              <ul className="mt-2 space-y-1">
                <li>• Original Weight: Initial sample weight before test</li>
                <li>
                  • Weight After Test: Sample weight after 500 revolutions
                </li>
                <li>
                  • Lower abrasion loss indicates better quality aggregate
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
