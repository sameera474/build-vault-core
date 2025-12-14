import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface LiquidLimitData {
  id: string;
  containerNo: string;
  containerWeight: string;
  wetSoilWeight: string;
  drySoilWeight: string;
  moistureContent: string;
  blows: string;
}

interface PlasticLimitData {
  id: string;
  containerNo: string;
  containerWeight: string;
  wetSoilWeight: string;
  drySoilWeight: string;
  moistureContent: string;
}

interface AtterbergLimitsTestProps {
  data: any;
  onUpdate: (data: any) => void;
  parentData?: any;
}

export function AtterbergLimitsTest({
  data,
  onUpdate,
}: AtterbergLimitsTestProps) {
  const [formData, setFormData] = useState({
    sampleDescription: data.sampleDescription || "",
    dateOfTesting: data.dateOfTesting || "",
    testedBy: data.testedBy || "",
    liquidLimitData: data.liquidLimitData || [
      {
        id: "1",
        containerNo: "",
        containerWeight: "",
        wetSoilWeight: "",
        drySoilWeight: "",
        moistureContent: "",
        blows: "25",
      },
      {
        id: "2",
        containerNo: "",
        containerWeight: "",
        wetSoilWeight: "",
        drySoilWeight: "",
        moistureContent: "",
        blows: "20",
      },
      {
        id: "3",
        containerNo: "",
        containerWeight: "",
        wetSoilWeight: "",
        drySoilWeight: "",
        moistureContent: "",
        blows: "15",
      },
      {
        id: "4",
        containerNo: "",
        containerWeight: "",
        wetSoilWeight: "",
        drySoilWeight: "",
        moistureContent: "",
        blows: "10",
      },
      {
        id: "5",
        containerNo: "",
        containerWeight: "",
        wetSoilWeight: "",
        drySoilWeight: "",
        moistureContent: "",
        blows: "5",
      },
    ],
    plasticLimitData: data.plasticLimitData || [
      {
        id: "1",
        containerNo: "",
        containerWeight: "",
        wetSoilWeight: "",
        drySoilWeight: "",
        moistureContent: "",
      },
      {
        id: "2",
        containerNo: "",
        containerWeight: "",
        wetSoilWeight: "",
        drySoilWeight: "",
        moistureContent: "",
      },
      {
        id: "3",
        containerNo: "",
        containerWeight: "",
        wetSoilWeight: "",
        drySoilWeight: "",
        moistureContent: "",
      },
    ],
  });

  const updateFormData = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onUpdate(newData);
  };

  const updateLiquidLimitData = (
    index: number,
    field: string,
    value: string
  ) => {
    const newData = [...formData.liquidLimitData];
    newData[index] = { ...newData[index], [field]: value };

    // Auto-calculate moisture content
    if (
      field === "containerWeight" ||
      field === "wetSoilWeight" ||
      field === "drySoilWeight"
    ) {
      const item = newData[index];
      if (item.containerWeight && item.wetSoilWeight && item.drySoilWeight) {
        const wetSoil =
          parseFloat(item.wetSoilWeight) - parseFloat(item.containerWeight);
        const drySoil =
          parseFloat(item.drySoilWeight) - parseFloat(item.containerWeight);
        if (wetSoil > 0 && drySoil > 0) {
          const moisture = ((wetSoil - drySoil) / drySoil) * 100;
          item.moistureContent = moisture.toFixed(2);
        }
      }
    }

    const newFormData = { ...formData, liquidLimitData: newData };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  const updatePlasticLimitData = (
    index: number,
    field: string,
    value: string
  ) => {
    const newData = [...formData.plasticLimitData];
    newData[index] = { ...newData[index], [field]: value };

    // Auto-calculate moisture content
    if (
      field === "containerWeight" ||
      field === "wetSoilWeight" ||
      field === "drySoilWeight"
    ) {
      const item = newData[index];
      if (item.containerWeight && item.wetSoilWeight && item.drySoilWeight) {
        const wetSoil =
          parseFloat(item.wetSoilWeight) - parseFloat(item.containerWeight);
        const drySoil =
          parseFloat(item.drySoilWeight) - parseFloat(item.containerWeight);
        if (wetSoil > 0 && drySoil > 0) {
          const moisture = ((wetSoil - drySoil) / drySoil) * 100;
          item.moistureContent = moisture.toFixed(2);
        }
      }
    }

    const newFormData = { ...formData, plasticLimitData: newData };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  const calculateAverage = (data: any[], field: string) => {
    const values = data
      .map((item) => parseFloat(item[field]))
      .filter((val) => !isNaN(val));
    if (values.length === 0) return "0.00";
    const sum = values.reduce((a, b) => a + b, 0);
    return (sum / values.length).toFixed(2);
  };

  const calculateLiquidLimit = () => {
    // Flow curve method - plot moisture content vs log(blows) and find 25 blows intercept
    const validData = formData.liquidLimitData.filter(
      (item) => item.moistureContent && item.blows && parseFloat(item.blows) > 0
    );

    if (validData.length < 2) return "Insufficient data";

    // Simple linear interpolation between points around 25 blows
    const sortedData = validData.sort(
      (a, b) => parseFloat(a.blows) - parseFloat(b.blows)
    );

    // Find points around 25 blows
    const targetBlows = 25;
    let lowerPoint = null;
    let upperPoint = null;

    for (let i = 0; i < sortedData.length - 1; i++) {
      const current = sortedData[i];
      const next = sortedData[i + 1];
      const currentBlows = parseFloat(current.blows);
      const nextBlows = parseFloat(next.blows);

      if (currentBlows <= targetBlows && nextBlows >= targetBlows) {
        lowerPoint = current;
        upperPoint = next;
        break;
      }
    }

    if (lowerPoint && upperPoint) {
      // Linear interpolation
      const x1 = Math.log10(parseFloat(lowerPoint.blows));
      const x2 = Math.log10(parseFloat(upperPoint.blows));
      const y1 = parseFloat(lowerPoint.moistureContent);
      const y2 = parseFloat(upperPoint.moistureContent);
      const targetX = Math.log10(targetBlows);

      const liquidLimit = y1 + ((y2 - y1) / (x2 - x1)) * (targetX - x1);
      return liquidLimit.toFixed(2);
    }

    return "Cannot interpolate";
  };

  const calculatePlasticLimit = () => {
    return calculateAverage(formData.plasticLimitData, "moistureContent");
  };

  const calculatePlasticityIndex = () => {
    const ll = parseFloat(calculateLiquidLimit());
    const pl = parseFloat(calculatePlasticLimit());

    if (!isNaN(ll) && !isNaN(pl) && ll > pl) {
      return (ll - pl).toFixed(2);
    }
    return "N/A";
  };

  const liquidLimit = calculateLiquidLimit();
  const plasticLimit = calculatePlasticLimit();
  const plasticityIndex = calculatePlasticityIndex();

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Liquid Limit Test */}
      <Card>
        <CardHeader>
          <CardTitle>Liquid Limit Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left">
                    Test No.
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Container No.
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Container Weight (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Wet Soil + Container (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Dry Soil + Container (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Moisture Content (%)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    No. of Blows
                  </th>
                </tr>
              </thead>
              <tbody>
                {formData.liquidLimitData.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 p-2 font-medium">
                      {item.id}
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.containerNo}
                        onChange={(e) =>
                          updateLiquidLimitData(
                            index,
                            "containerNo",
                            e.target.value
                          )
                        }
                        placeholder="CN-001"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.containerWeight}
                        onChange={(e) =>
                          updateLiquidLimitData(
                            index,
                            "containerWeight",
                            e.target.value
                          )
                        }
                        placeholder="25.5"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.wetSoilWeight}
                        onChange={(e) =>
                          updateLiquidLimitData(
                            index,
                            "wetSoilWeight",
                            e.target.value
                          )
                        }
                        placeholder="125.5"
                        className="w-24"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.drySoilWeight}
                        onChange={(e) =>
                          updateLiquidLimitData(
                            index,
                            "drySoilWeight",
                            e.target.value
                          )
                        }
                        placeholder="115.2"
                        className="w-24"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.moistureContent}
                        readOnly
                        className="w-20 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.blows}
                        onChange={(e) =>
                          updateLiquidLimitData(index, "blows", e.target.value)
                        }
                        placeholder="25"
                        className="w-16"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-semibold text-blue-900">
              Calculated Liquid Limit
            </h4>
            <p className="text-blue-800 text-lg font-mono">{liquidLimit}%</p>
            <p className="text-sm text-blue-700 mt-1">
              Calculated using flow curve method at 25 blows
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Plastic Limit Test */}
      <Card>
        <CardHeader>
          <CardTitle>Plastic Limit Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left">
                    Test No.
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Container No.
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Container Weight (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Wet Soil + Container (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Dry Soil + Container (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Moisture Content (%)
                  </th>
                </tr>
              </thead>
              <tbody>
                {formData.plasticLimitData.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 p-2 font-medium">
                      {item.id}
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.containerNo}
                        onChange={(e) =>
                          updatePlasticLimitData(
                            index,
                            "containerNo",
                            e.target.value
                          )
                        }
                        placeholder="CN-001"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.containerWeight}
                        onChange={(e) =>
                          updatePlasticLimitData(
                            index,
                            "containerWeight",
                            e.target.value
                          )
                        }
                        placeholder="25.5"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.wetSoilWeight}
                        onChange={(e) =>
                          updatePlasticLimitData(
                            index,
                            "wetSoilWeight",
                            e.target.value
                          )
                        }
                        placeholder="85.5"
                        className="w-24"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.drySoilWeight}
                        onChange={(e) =>
                          updatePlasticLimitData(
                            index,
                            "drySoilWeight",
                            e.target.value
                          )
                        }
                        placeholder="82.1"
                        className="w-24"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.moistureContent}
                        readOnly
                        className="w-20 bg-gray-50"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <h4 className="font-semibold text-green-900">
              Calculated Plastic Limit
            </h4>
            <p className="text-green-800 text-lg font-mono">{plasticLimit}%</p>
            <p className="text-sm text-green-700 mt-1">
              Average of all plastic limit determinations
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Atterberg Limits Results Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-900">Liquid Limit (LL)</h4>
              <p className="text-2xl font-mono text-blue-800">{liquidLimit}%</p>
            </div>
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded">
              <h4 className="font-semibold text-green-900">
                Plastic Limit (PL)
              </h4>
              <p className="text-2xl font-mono text-green-800">
                {plasticLimit}%
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded">
              <h4 className="font-semibold text-purple-900">
                Plasticity Index (PI)
              </h4>
              <p className="text-2xl font-mono text-purple-800">
                {plasticityIndex}
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
            <h4 className="font-semibold text-gray-900 mb-2">
              Soil Classification (Based on PI)
            </h4>
            <div className="text-sm text-gray-700">
              {parseFloat(plasticityIndex) <= 0 && <p>Non-plastic soil</p>}
              {parseFloat(plasticityIndex) > 0 &&
                parseFloat(plasticityIndex) <= 7 && (
                  <p>Slightly plastic clay</p>
                )}
              {parseFloat(plasticityIndex) > 7 &&
                parseFloat(plasticityIndex) <= 17 && <p>Medium plastic clay</p>}
              {parseFloat(plasticityIndex) > 17 && <p>Highly plastic clay</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
