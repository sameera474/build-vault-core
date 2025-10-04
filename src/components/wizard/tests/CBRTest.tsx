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

interface CBRData {
  id: string;
  penetration: string;
  load: string;
  correctedLoad: string;
}

interface CBRTestProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function CBRTest({ data, onUpdate }: CBRTestProps) {
  const [formData, setFormData] = useState({
    sampleDescription: data.sampleDescription || "",
    testType: data.testType || "Unsoaked CBR",
    dateOfTesting: data.dateOfTesting || "",
    testedBy: data.testedBy || "",
    soakingPeriod: data.soakingPeriod || "",
    plungerArea: data.plungerArea || "19.35", // cm² for standard 50mm diameter plunger
    surchargeWeight: data.surchargeWeight || "",
    provingRingConstant: data.provingRingConstant || "",
    cbrData: data.cbrData || [
      { id: "0.5", penetration: "0.5", load: "", correctedLoad: "" },
      { id: "1.0", penetration: "1.0", load: "", correctedLoad: "" },
      { id: "1.5", penetration: "1.5", load: "", correctedLoad: "" },
      { id: "2.0", penetration: "2.0", load: "", correctedLoad: "" },
      { id: "2.5", penetration: "2.5", load: "", correctedLoad: "" },
      { id: "3.0", penetration: "3.0", load: "", correctedLoad: "" },
      { id: "4.0", penetration: "4.0", load: "", correctedLoad: "" },
      { id: "5.0", penetration: "5.0", load: "", correctedLoad: "" },
      { id: "7.5", penetration: "7.5", load: "", correctedLoad: "" },
      { id: "10.0", penetration: "10.0", load: "", correctedLoad: "" },
      { id: "12.5", penetration: "12.5", load: "", correctedLoad: "" },
    ],
  });

  const updateFormData = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onUpdate(newData);
  };

  const updateCBRData = (index: number, field: string, value: string) => {
    const newData = [...formData.cbrData];
    newData[index] = { ...newData[index], [field]: value };

    // Auto-calculate corrected load if load is provided
    if (field === "load" && value) {
      const load = parseFloat(value);
      const provingRingConstant = parseFloat(formData.provingRingConstant) || 1;
      const correctedLoad = load * provingRingConstant;
      newData[index].correctedLoad = correctedLoad.toFixed(2);
    }

    const newFormData = { ...formData, cbrData: newData };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  const calculateCBR = () => {
    // CBR is calculated as (Load at 2.5mm penetration / Standard load at 2.5mm) × 100
    // Standard loads: 1370 kg for 2.5mm, 2055 kg for 5.0mm penetration

    const dataAt2_5mm = formData.cbrData.find(
      (item) => item.penetration === "2.5"
    );
    const dataAt5_0mm = formData.cbrData.find(
      (item) => item.penetration === "5.0"
    );

    if (!dataAt2_5mm?.correctedLoad || !dataAt5_0mm?.correctedLoad) {
      return "Insufficient data";
    }

    const loadAt2_5mm = parseFloat(dataAt2_5mm.correctedLoad);
    const loadAt5_0mm = parseFloat(dataAt5_0mm.correctedLoad);

    // Standard loads in kg (for crushed stone)
    const standardLoad2_5mm = 1370; // kg
    const standardLoad5_0mm = 2055; // kg

    const cbr2_5mm = (loadAt2_5mm / standardLoad2_5mm) * 100;
    const cbr5_0mm = (loadAt5_0mm / standardLoad5_0mm) * 100;

    // CBR value is the lower of the two
    const cbr = Math.min(cbr2_5mm, cbr5_0mm);

    return cbr.toFixed(1);
  };

  const cbr = calculateCBR();

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
                placeholder="Describe the soil/aggregate sample"
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
                  <SelectItem value="Unsoaked CBR">Unsoaked CBR</SelectItem>
                  <SelectItem value="Soaked CBR">Soaked CBR</SelectItem>
                  <SelectItem value="Field CBR">Field CBR</SelectItem>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="plungerArea">Plunger Area (cm²)</Label>
              <Input
                id="plungerArea"
                value={formData.plungerArea}
                onChange={(e) => updateFormData("plungerArea", e.target.value)}
                placeholder="19.35"
              />
            </div>
            <div>
              <Label htmlFor="surchargeWeight">Surcharge Weight (kg)</Label>
              <Input
                id="surchargeWeight"
                value={formData.surchargeWeight}
                onChange={(e) =>
                  updateFormData("surchargeWeight", e.target.value)
                }
                placeholder="4.5"
              />
            </div>
            <div>
              <Label htmlFor="provingRingConstant">Proving Ring Constant</Label>
              <Input
                id="provingRingConstant"
                value={formData.provingRingConstant}
                onChange={(e) =>
                  updateFormData("provingRingConstant", e.target.value)
                }
                placeholder="1.0"
              />
            </div>
            <div>
              <Label htmlFor="soakingPeriod">Soaking Period (days)</Label>
              <Input
                id="soakingPeriod"
                value={formData.soakingPeriod}
                onChange={(e) =>
                  updateFormData("soakingPeriod", e.target.value)
                }
                placeholder="4"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CBR Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>CBR Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left">
                    Penetration (mm)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Load Reading (kg)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Corrected Load (kg)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Load per cm² (kg/cm²)
                  </th>
                </tr>
              </thead>
              <tbody>
                {formData.cbrData.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 p-2 font-medium">
                      {item.penetration}
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.load}
                        onChange={(e) =>
                          updateCBRData(index, "load", e.target.value)
                        }
                        placeholder="500"
                        className="w-24"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.correctedLoad}
                        readOnly
                        className="w-24 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      {item.correctedLoad && formData.plungerArea
                        ? (
                            (parseFloat(item.correctedLoad) * 1000) /
                            parseFloat(formData.plungerArea)
                          ).toFixed(1)
                        : ""}
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
          <CardTitle>CBR Test Results Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-900">
                California Bearing Ratio (CBR)
              </h4>
              <p className="text-3xl font-mono text-blue-800">{cbr}%</p>
              <p className="text-sm text-blue-700 mt-1">
                Based on lower value of 2.5mm and 5.0mm penetration
              </p>
            </div>
            <div className="text-center p-6 bg-green-50 border border-green-200 rounded">
              <h4 className="font-semibold text-green-900">
                Test Classification
              </h4>
              <div className="text-green-800 mt-2">
                {parseFloat(cbr) >= 80 && <p>Excellent (≥80%)</p>}
                {parseFloat(cbr) >= 50 && parseFloat(cbr) < 80 && (
                  <p>Good (50-79%)</p>
                )}
                {parseFloat(cbr) >= 30 && parseFloat(cbr) < 50 && (
                  <p>Fair (30-49%)</p>
                )}
                {parseFloat(cbr) >= 10 && parseFloat(cbr) < 30 && (
                  <p>Poor (10-29%)</p>
                )}
                {parseFloat(cbr) < 10 && <p>Very Poor (Less than 10%)</p>}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
            <h4 className="font-semibold text-gray-900 mb-2">
              Standard Load Values (Crushed Stone)
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">2.5mm penetration:</span>
                <p className="text-muted-foreground">1370 kg</p>
              </div>
              <div>
                <span className="font-medium">5.0mm penetration:</span>
                <p className="text-muted-foreground">2055 kg</p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-900 mb-2">
              Interpretation Guidelines
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• CBR ≥ 80%: Suitable for sub-base and base courses</li>
              <li>• CBR 50-79%: Suitable for sub-base with proper design</li>
              <li>• CBR 30-49%: May require stabilization or thicker layers</li>
              <li>• CBR Less than 30%: Not suitable for pavement layers</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
