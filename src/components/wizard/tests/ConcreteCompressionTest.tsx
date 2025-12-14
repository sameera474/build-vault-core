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

interface SpecimenData {
  id: string;
  weight: string;
  length: string;
  breadth: string;
  height: string;
  machineReading: string;
  maxLoad: string;
  compressiveStrength: string;
}

interface ConcreteCompressionTestProps {
  data: any;
  onUpdate: (data: any) => void;
  parentData?: any;
}

export function ConcreteCompressionTest({
  data,
  onUpdate,
}: ConcreteCompressionTestProps) {
  const [formData, setFormData] = useState({
    structure: data.structure || "",
    typeOfConcrete: data.typeOfConcrete || "",
    strengthCategory: data.strengthCategory || "",
    slump: data.slump || "",
    conditionOfCuring: data.conditionOfCuring || "",
    methodOfCompaction: data.methodOfCompaction || "",
    dateOfCasting: data.dateOfCasting || "",
    timeOfCasting: data.timeOfCasting || "",
    placeOfCasting: data.placeOfCasting || "",
    castedBy: data.castedBy || "",
    specimenNo: data.specimenNo || "",
    dateOfTesting7Days: data.dateOfTesting7Days || "",
    dateOfTesting28Days: data.dateOfTesting28Days || "",
    timeOfTesting: data.timeOfTesting || "",
    specimens: data.specimens || [
      {
        id: "A",
        weight: "",
        length: "150",
        breadth: "150",
        height: "150",
        machineReading: "",
        maxLoad: "",
        compressiveStrength: "",
      },
      {
        id: "B",
        weight: "",
        length: "150",
        breadth: "150",
        height: "150",
        machineReading: "",
        maxLoad: "",
        compressiveStrength: "",
      },
      {
        id: "C",
        weight: "",
        length: "150",
        breadth: "150",
        height: "150",
        machineReading: "",
        maxLoad: "",
        compressiveStrength: "",
      },
      {
        id: "D",
        weight: "",
        length: "150",
        breadth: "150",
        height: "150",
        machineReading: "",
        maxLoad: "",
        compressiveStrength: "",
      },
      {
        id: "E",
        weight: "",
        length: "150",
        breadth: "150",
        height: "150",
        machineReading: "",
        maxLoad: "",
        compressiveStrength: "",
      },
      {
        id: "F",
        weight: "",
        length: "150",
        breadth: "150",
        height: "150",
        machineReading: "",
        compressiveStrength: "",
      },
    ],
  });

  const updateFormData = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onUpdate(newData);
  };

  const updateSpecimen = (index: number, field: string, value: string) => {
    const newSpecimens = [...formData.specimens];
    newSpecimens[index] = { ...newSpecimens[index], [field]: value };

    // Auto-calculate compressive strength if max load is provided
    if (field === "maxLoad" && value) {
      const maxLoad = parseFloat(value);
      const crossSectionArea = 225; // 15cm x 15cm = 225 cm²
      const compressiveStrength = (maxLoad * 1000) / crossSectionArea; // Convert to N/mm²
      newSpecimens[index].compressiveStrength = compressiveStrength.toFixed(1);
    }

    const newData = { ...formData, specimens: newSpecimens };
    setFormData(newData);
    onUpdate(newData);
  };

  const calculateAverage = (field: string, specimens: any[]) => {
    const values = specimens
      .map((s) => parseFloat(s[field]))
      .filter((v) => !isNaN(v));
    if (values.length === 0) return "0.0";
    const sum = values.reduce((a, b) => a + b, 0);
    return (sum / values.length).toFixed(1);
  };

  const day7Specimens = formData.specimens.slice(0, 3);
  const day28Specimens = formData.specimens.slice(3, 6);

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
              <Label htmlFor="structure">Structure</Label>
              <Input
                id="structure"
                value={formData.structure}
                onChange={(e) => updateFormData("structure", e.target.value)}
                placeholder="e.g., 1.Column Concrete (1st step) (No.2)"
              />
            </div>
            <div>
              <Label htmlFor="typeOfConcrete">Type of Concrete</Label>
              <Input
                id="typeOfConcrete"
                value={formData.typeOfConcrete}
                onChange={(e) =>
                  updateFormData("typeOfConcrete", e.target.value)
                }
                placeholder="e.g., 30/20"
              />
            </div>
            <div>
              <Label htmlFor="strengthCategory">Strength Category</Label>
              <Select
                value={formData.strengthCategory}
                onValueChange={(value) =>
                  updateFormData("strengthCategory", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="slump">Slump (mm)</Label>
              <Input
                id="slump"
                type="number"
                value={formData.slump}
                onChange={(e) => updateFormData("slump", e.target.value)}
                placeholder="130"
              />
            </div>
            <div>
              <Label htmlFor="conditionOfCuring">
                Condition of Curing and Storage
              </Label>
              <Input
                id="conditionOfCuring"
                value={formData.conditionOfCuring}
                onChange={(e) =>
                  updateFormData("conditionOfCuring", e.target.value)
                }
                placeholder="e.g., Water tank"
              />
            </div>
            <div>
              <Label htmlFor="methodOfCompaction">Method of Compaction</Label>
              <Select
                value={formData.methodOfCompaction}
                onValueChange={(value) =>
                  updateFormData("methodOfCompaction", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hand method">Hand method</SelectItem>
                  <SelectItem value="Vibration">Vibration</SelectItem>
                  <SelectItem value="Mechanical">Mechanical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Casting Information */}
      <Card>
        <CardHeader>
          <CardTitle>Casting Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateOfCasting">Date of Casting</Label>
              <Input
                id="dateOfCasting"
                type="date"
                value={formData.dateOfCasting}
                onChange={(e) =>
                  updateFormData("dateOfCasting", e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="timeOfCasting">Time of Casting</Label>
              <Input
                id="timeOfCasting"
                type="time"
                value={formData.timeOfCasting}
                onChange={(e) =>
                  updateFormData("timeOfCasting", e.target.value)
                }
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="placeOfCasting">Place of Casting</Label>
              <Textarea
                id="placeOfCasting"
                value={formData.placeOfCasting}
                onChange={(e) =>
                  updateFormData("placeOfCasting", e.target.value)
                }
                placeholder="e.g., 1. 0+075 Toilet Block / 2.0+113,0+140"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="castedBy">Casted By</Label>
              <Input
                id="castedBy"
                value={formData.castedBy}
                onChange={(e) => updateFormData("castedBy", e.target.value)}
                placeholder="Name of person who casted"
              />
            </div>
            <div>
              <Label htmlFor="specimenNo">Specimen No. (TEST NO)</Label>
              <Input
                id="specimenNo"
                value={formData.specimenNo}
                onChange={(e) => updateFormData("specimenNo", e.target.value)}
                placeholder="e.g., CON/192"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dateOfTesting7Days">
                Date of Testing (7 Days)
              </Label>
              <Input
                id="dateOfTesting7Days"
                type="date"
                value={formData.dateOfTesting7Days}
                onChange={(e) =>
                  updateFormData("dateOfTesting7Days", e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="dateOfTesting28Days">
                Date of Testing (28 Days)
              </Label>
              <Input
                id="dateOfTesting28Days"
                type="date"
                value={formData.dateOfTesting28Days}
                onChange={(e) =>
                  updateFormData("dateOfTesting28Days", e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="timeOfTesting">Time of Testing</Label>
              <Input
                id="timeOfTesting"
                type="time"
                value={formData.timeOfTesting}
                onChange={(e) =>
                  updateFormData("timeOfTesting", e.target.value)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7 Days Testing Results */}
      <Card>
        <CardHeader>
          <CardTitle>7 Days Testing Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-2 text-left text-foreground">
                    Specimen
                  </th>
                  <th className="border border-border p-2 text-left text-foreground">
                    Weight (g)
                  </th>
                  <th className="border border-border p-2 text-left text-foreground">
                    Dimensions (mm)
                  </th>
                  <th className="border border-border p-2 text-left text-foreground">
                    Volume (cm³)
                  </th>
                  <th className="border border-border p-2 text-left text-foreground">
                    Area (cm²)
                  </th>
                  <th className="border border-border p-2 text-left text-foreground">
                    Density (g/cm³)
                  </th>
                  <th className="border border-border p-2 text-left text-foreground">
                    Machine Reading (KN)
                  </th>
                  <th className="border border-border p-2 text-left text-foreground">
                    Max Load (KN)
                  </th>
                  <th className="border border-border p-2 text-left text-foreground">
                    Compressive Strength (N/mm²)
                  </th>
                </tr>
              </thead>
              <tbody>
                {day7Specimens.map((specimen, index) => (
                  <tr key={specimen.id}>
                    <td className="border border-border p-2 font-medium text-foreground">
                      {specimen.id}
                    </td>
                    <td className="border border-border p-2 text-foreground">
                      <Input
                        value={specimen.weight}
                        onChange={(e) =>
                          updateSpecimen(index, "weight", e.target.value)
                        }
                        placeholder="8605"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-border p-2 text-foreground">
                      <div className="flex gap-1">
                        <Input
                          value={specimen.length}
                          onChange={(e) =>
                            updateSpecimen(index, "length", e.target.value)
                          }
                          placeholder="150"
                          className="w-16"
                        />
                        ×
                        <Input
                          value={specimen.breadth}
                          onChange={(e) =>
                            updateSpecimen(index, "breadth", e.target.value)
                          }
                          placeholder="150"
                          className="w-16"
                        />
                        ×
                        <Input
                          value={specimen.height}
                          onChange={(e) =>
                            updateSpecimen(index, "height", e.target.value)
                          }
                          placeholder="150"
                          className="w-16"
                        />
                      </div>
                    </td>
                    <td className="border border-border p-2 text-foreground">
                      {specimen.length && specimen.breadth && specimen.height
                        ? (
                            (parseFloat(specimen.length) *
                              parseFloat(specimen.breadth) *
                              parseFloat(specimen.height)) /
                            1000
                          ).toFixed(0)
                        : "3375"}
                    </td>
                    <td className="border border-border p-2 text-foreground">225</td>
                    <td className="border border-border p-2 text-foreground">
                      {specimen.weight &&
                      specimen.length &&
                      specimen.breadth &&
                      specimen.height
                        ? (
                            (parseFloat(specimen.weight) * 1000) /
                            (parseFloat(specimen.length) *
                              parseFloat(specimen.breadth) *
                              parseFloat(specimen.height))
                          ).toFixed(3)
                        : ""}
                    </td>
                    <td className="border border-border p-2 text-foreground">
                      <Input
                        value={specimen.machineReading}
                        onChange={(e) =>
                          updateSpecimen(
                            index,
                            "machineReading",
                            e.target.value
                          )
                        }
                        placeholder="603.8"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-border p-2 text-foreground">
                      <Input
                        value={specimen.maxLoad}
                        onChange={(e) =>
                          updateSpecimen(index, "maxLoad", e.target.value)
                        }
                        placeholder="605.9"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-border p-2 text-foreground">
                      <Input
                        value={specimen.compressiveStrength}
                        readOnly
                        placeholder="26.9"
                        className="w-20 bg-muted"
                      />
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted font-medium">
                  <td className="border border-border p-2 text-foreground" colSpan={8}>
                    Average Compressive Strength (7 days)
                  </td>
                  <td className="border border-border p-2 text-foreground">
                    {calculateAverage("compressiveStrength", day7Specimens)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 28 Days Testing Results */}
      <Card>
        <CardHeader>
          <CardTitle>28 Days Testing Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-2 text-left text-foreground">
                    Specimen
                  </th>
                  <th className="border border-border p-2 text-left text-foreground">
                    Weight (g)
                  </th>
                  <th className="border border-border p-2 text-left text-foreground">
                    Dimensions (mm)
                  </th>
                  <th className="border border-border p-2 text-left text-foreground">
                    Volume (cm³)
                  </th>
                  <th className="border border-border p-2 text-left text-foreground">
                    Area (cm²)
                  </th>
                  <th className="border border-border p-2 text-left text-foreground">
                    Density (g/cm³)
                  </th>
                  <th className="border border-border p-2 text-left text-foreground">
                    Machine Reading (KN)
                  </th>
                  <th className="border border-border p-2 text-left text-foreground">
                    Max Load (KN)
                  </th>
                  <th className="border border-border p-2 text-left text-foreground">
                    Compressive Strength (N/mm²)
                  </th>
                </tr>
              </thead>
              <tbody>
                {day28Specimens.map((specimen, index) => (
                  <tr key={specimen.id}>
                    <td className="border border-border p-2 font-medium text-foreground">
                      {specimen.id}
                    </td>
                    <td className="border border-border p-2 text-foreground">
                      <Input
                        value={specimen.weight}
                        onChange={(e) =>
                          updateSpecimen(index + 3, "weight", e.target.value)
                        }
                        placeholder="8486"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-border p-2 text-foreground">
                      <div className="flex gap-1">
                        <Input
                          value={specimen.length}
                          onChange={(e) =>
                            updateSpecimen(index + 3, "length", e.target.value)
                          }
                          placeholder="150"
                          className="w-16"
                        />
                        ×
                        <Input
                          value={specimen.breadth}
                          onChange={(e) =>
                            updateSpecimen(index + 3, "breadth", e.target.value)
                          }
                          placeholder="150"
                          className="w-16"
                        />
                        ×
                        <Input
                          value={specimen.height}
                          onChange={(e) =>
                            updateSpecimen(index + 3, "height", e.target.value)
                          }
                          placeholder="150"
                          className="w-16"
                        />
                      </div>
                    </td>
                    <td className="border border-border p-2 text-foreground">
                      {specimen.length && specimen.breadth && specimen.height
                        ? (
                            (parseFloat(specimen.length) *
                              parseFloat(specimen.breadth) *
                              parseFloat(specimen.height)) /
                            1000
                          ).toFixed(0)
                        : "3375"}
                    </td>
                    <td className="border border-border p-2 text-foreground">225</td>
                    <td className="border border-border p-2 text-foreground">
                      {specimen.weight &&
                      specimen.length &&
                      specimen.breadth &&
                      specimen.height
                        ? (
                            (parseFloat(specimen.weight) * 1000) /
                            (parseFloat(specimen.length) *
                              parseFloat(specimen.breadth) *
                              parseFloat(specimen.height))
                          ).toFixed(3)
                        : ""}
                    </td>
                    <td className="border border-border p-2 text-foreground">
                      <Input
                        value={specimen.machineReading}
                        onChange={(e) =>
                          updateSpecimen(
                            index + 3,
                            "machineReading",
                            e.target.value
                          )
                        }
                        placeholder="554.6"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-border p-2 text-foreground">
                      <Input
                        value={specimen.maxLoad}
                        onChange={(e) =>
                          updateSpecimen(index + 3, "maxLoad", e.target.value)
                        }
                        placeholder="556.5"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-border p-2 text-foreground">
                      <Input
                        value={specimen.compressiveStrength}
                        readOnly
                        placeholder="24.7"
                        className="w-20 bg-muted"
                      />
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted font-medium">
                  <td className="border border-border p-2 text-foreground" colSpan={8}>
                    Average Compressive Strength (28 days)
                  </td>
                  <td className="border border-border p-2 text-foreground">
                    {calculateAverage("compressiveStrength", day28Specimens)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
