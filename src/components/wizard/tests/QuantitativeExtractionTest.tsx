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
  sampleId: string;
  initialWeight: string;
  extractedWeight: string;
  asphaltContent: string;
  aggregateWeight: string;
  recoveryPercentage: string;
}

interface QuantitativeExtractionTestProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function QuantitativeExtractionTest({
  data,
  onUpdate,
}: QuantitativeExtractionTestProps) {
  const [formData, setFormData] = useState({
    projectName: data.projectName || "",
    mixType: data.mixType || "Dense Bituminous Macadam",
    dateOfTesting: data.dateOfTesting || "",
    testedBy: data.testedBy || "",
    extractionMethod: data.extractionMethod || "Centrifuge",
    solventType: data.solventType || "Trichloroethylene",
    targetAsphaltContent: data.targetAsphaltContent || "",
    sampleData: data.sampleData || [
      {
        id: "1",
        sampleId: "S001",
        initialWeight: "",
        extractedWeight: "",
        asphaltContent: "",
        aggregateWeight: "",
        recoveryPercentage: "",
      },
      {
        id: "2",
        sampleId: "S002",
        initialWeight: "",
        extractedWeight: "",
        asphaltContent: "",
        aggregateWeight: "",
        recoveryPercentage: "",
      },
      {
        id: "3",
        sampleId: "S003",
        initialWeight: "",
        extractedWeight: "",
        asphaltContent: "",
        aggregateWeight: "",
        recoveryPercentage: "",
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
    if (field === "initialWeight" || field === "extractedWeight") {
      const item = newData[index];
      if (item.initialWeight && item.extractedWeight) {
        const initialWeight = parseFloat(item.initialWeight);
        const extractedWeight = parseFloat(item.extractedWeight);

        // Asphalt content = (initial - extracted) / initial × 100
        const asphaltContent =
          ((initialWeight - extractedWeight) / initialWeight) * 100;
        item.asphaltContent = asphaltContent.toFixed(2);

        // Aggregate weight = extracted weight
        item.aggregateWeight = extractedWeight.toFixed(3);

        // Recovery percentage (assuming 100% recovery for calculation)
        item.recoveryPercentage = "100.0";
      }
    }

    const newFormData = { ...formData, sampleData: newData };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  const addSample = () => {
    const newSample = {
      id: (formData.sampleData.length + 1).toString(),
      sampleId: `S${String(formData.sampleData.length + 1).padStart(3, "0")}`,
      initialWeight: "",
      extractedWeight: "",
      asphaltContent: "",
      aggregateWeight: "",
      recoveryPercentage: "",
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

  const calculateAverageAsphaltContent = () => {
    const validData = formData.sampleData.filter(
      (item) => item.asphaltContent && parseFloat(item.asphaltContent) > 0
    );

    if (validData.length === 0) return "0.00";

    const sum = validData.reduce(
      (acc, item) => acc + parseFloat(item.asphaltContent),
      0
    );
    return (sum / validData.length).toFixed(2);
  };

  const calculateStandardDeviation = () => {
    const validData = formData.sampleData.filter(
      (item) => item.asphaltContent && parseFloat(item.asphaltContent) > 0
    );

    if (validData.length < 2) return "0.00";

    const mean = parseFloat(calculateAverageAsphaltContent());
    const squaredDifferences = validData.map((item) =>
      Math.pow(parseFloat(item.asphaltContent) - mean, 2)
    );
    const variance =
      squaredDifferences.reduce((acc, val) => acc + val, 0) /
      (validData.length - 1);
    return Math.sqrt(variance).toFixed(2);
  };

  const getAsphaltContentStatus = (measured: number, target: number) => {
    if (target === 0) return "Target not specified";

    const deviation = Math.abs(measured - target);
    const tolerance = target * 0.05; // 5% tolerance

    if (deviation <= tolerance) return "Within specification";
    if (deviation <= target * 0.1) return "Acceptable deviation";
    return "Out of specification";
  };

  const averageAsphaltContent = calculateAverageAsphaltContent();
  const standardDeviation = calculateStandardDeviation();
  const targetAsphaltContent = parseFloat(formData.targetAsphaltContent) || 0;

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
              <Label htmlFor="extractionMethod">Extraction Method</Label>
              <Select
                value={formData.extractionMethod}
                onValueChange={(value) =>
                  updateFormData("extractionMethod", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Centrifuge">
                    Centrifuge Extraction
                  </SelectItem>
                  <SelectItem value="Reflux">Reflux Extraction</SelectItem>
                  <SelectItem value="Soxhlet">Soxhlet Extraction</SelectItem>
                  <SelectItem value="Nuclear">Nuclear Method</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="solventType">Solvent Type</Label>
              <Select
                value={formData.solventType}
                onValueChange={(value) => updateFormData("solventType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Trichloroethylene">
                    Trichloroethylene
                  </SelectItem>
                  <SelectItem value="Dichloromethane">
                    Dichloromethane
                  </SelectItem>
                  <SelectItem value="Toluene">Toluene</SelectItem>
                  <SelectItem value="Normal-Heptane">Normal Heptane</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="targetAsphaltContent">
                Target Asphalt Content (%)
              </Label>
              <Input
                id="targetAsphaltContent"
                type="number"
                step="0.1"
                value={formData.targetAsphaltContent}
                onChange={(e) =>
                  updateFormData("targetAsphaltContent", e.target.value)
                }
                placeholder="5.0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extraction Results */}
      <Card>
        <CardHeader>
          <CardTitle>Quantitative Extraction Results</CardTitle>
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
                    Initial Weight (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Extracted Weight (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Asphalt Content (%)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Aggregate Weight (g)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Recovery (%)
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
                        placeholder="S001"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.initialWeight}
                        onChange={(e) =>
                          updateSampleData(
                            index,
                            "initialWeight",
                            e.target.value
                          )
                        }
                        placeholder="500"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.extractedWeight}
                        onChange={(e) =>
                          updateSampleData(
                            index,
                            "extractedWeight",
                            e.target.value
                          )
                        }
                        placeholder="475"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.asphaltContent}
                        readOnly
                        className="w-20 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.aggregateWeight}
                        readOnly
                        className="w-20 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.recoveryPercentage}
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
          <CardTitle>Quantitative Extraction Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-900">
                Average Asphalt Content
              </h4>
              <p className="text-3xl font-mono text-blue-800">
                {averageAsphaltContent}%
              </p>
              <p className="text-sm text-blue-700 mt-1">By weight of mix</p>
            </div>
            <div className="text-center p-6 bg-green-50 border border-green-200 rounded">
              <h4 className="font-semibold text-green-900">
                Standard Deviation
              </h4>
              <p className="text-3xl font-mono text-green-800">
                {standardDeviation}%
              </p>
              <p className="text-sm text-green-700 mt-1">Variability measure</p>
            </div>
            <div className="text-center p-6 bg-orange-50 border border-orange-200 rounded">
              <h4 className="font-semibold text-orange-900">Quality Status</h4>
              <div className="text-orange-800 mt-2">
                <p className="text-lg font-medium">
                  {parseFloat(averageAsphaltContent) !== 0
                    ? getAsphaltContentStatus(
                        parseFloat(averageAsphaltContent),
                        targetAsphaltContent
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
                <span className="font-medium">Mix Type:</span>
                <p className="text-muted-foreground">{formData.mixType}</p>
              </div>
              <div>
                <span className="font-medium">Extraction Method:</span>
                <p className="text-muted-foreground">
                  {formData.extractionMethod}
                </p>
              </div>
              <div>
                <span className="font-medium">Solvent:</span>
                <p className="text-muted-foreground">{formData.solventType}</p>
              </div>
              <div>
                <span className="font-medium">Target Asphalt:</span>
                <p className="text-muted-foreground">
                  {formData.targetAsphaltContent}%
                </p>
              </div>
              <div>
                <span className="font-medium">Number of Samples:</span>
                <p className="text-muted-foreground">
                  {formData.sampleData.length}
                </p>
              </div>
              <div>
                <span className="font-medium">Test Standard:</span>
                <p className="text-muted-foreground">
                  ASTM D2172 / AASHTO T164
                </p>
              </div>
              <div>
                <span className="font-medium">Precision:</span>
                <p className="text-muted-foreground">±0.2% repeatability</p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-900 mb-2">
              Asphalt Content Specifications
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Dense Bituminous Macadam: 4.0-6.0% asphalt content</li>
              <li>• Bituminous Concrete: 4.5-6.5% asphalt content</li>
              <li>• Wearing course: 5.0-7.0% asphalt content</li>
              <li>• Tolerance: ±0.3% from target value</li>
              <li>• Minimum 3 samples per mix design</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded">
            <h4 className="font-semibold text-purple-900 mb-2">
              Test Procedure
            </h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Weigh representative sample (500-1000g)</li>
              <li>• Extract asphalt binder using appropriate solvent</li>
              <li>• Wash extracted aggregates thoroughly</li>
              <li>• Dry aggregates to constant weight</li>
              <li>• Calculate asphalt content by weight difference</li>
              <li>
                • Verify extraction efficiency (recovery greater than 95%)
              </li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <h4 className="font-semibold text-red-900 mb-2">
              Quality Control Notes
            </h4>
            <div className="text-sm text-red-800">
              <ul className="space-y-1">
                <li>
                  • Low asphalt content reduces durability and increases
                  permeability
                </li>
                <li>
                  • High asphalt content increases cost and may cause bleeding
                </li>
                <li>
                  • Consistent asphalt content ensures uniform pavement
                  performance
                </li>
                <li>
                  • Solvent recovery and disposal must follow environmental
                  regulations
                </li>
                <li>
                  • Calibration of extraction equipment is critical for accuracy
                </li>
                <li>
                  • Test results help optimize mix design and quality control
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
