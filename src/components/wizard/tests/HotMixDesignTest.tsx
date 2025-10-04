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

interface MixTrial {
  id: string;
  trialNumber: string;
  asphaltContent: string;
  bulkDensity: string;
  stability: string;
  flow: string;
  voids: string;
  vfb: string;
  vfa: string;
}

interface HotMixDesignTestProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function HotMixDesignTest({ data, onUpdate }: HotMixDesignTestProps) {
  const [formData, setFormData] = useState({
    projectName: data.projectName || "",
    mixType: data.mixType || "Asphalt Wearing Course",
    dateOfTesting: data.dateOfTesting || "",
    testedBy: data.testedBy || "",
    aggregateType: data.aggregateType || "Crushed Stone",
    binderGrade: data.binderGrade || "60/70",
    targetStability: data.targetStability || "9000",
    targetFlow: data.targetFlow || "3.0",
    targetVoids: data.targetVoids || "4.0",
    targetVFB: data.targetVFB || "75",
    targetVFA: data.targetVFA || "65",
    mixTrials: data.mixTrials || [
      {
        id: "1",
        trialNumber: "1",
        asphaltContent: "",
        bulkDensity: "",
        stability: "",
        flow: "",
        voids: "",
        vfb: "",
        vfa: "",
      },
      {
        id: "2",
        trialNumber: "2",
        asphaltContent: "",
        bulkDensity: "",
        stability: "",
        flow: "",
        voids: "",
        vfb: "",
        vfa: "",
      },
      {
        id: "3",
        trialNumber: "3",
        asphaltContent: "",
        bulkDensity: "",
        stability: "",
        flow: "",
        voids: "",
        vfb: "",
        vfa: "",
      },
      {
        id: "4",
        trialNumber: "4",
        asphaltContent: "",
        bulkDensity: "",
        stability: "",
        flow: "",
        voids: "",
        vfb: "",
        vfa: "",
      },
      {
        id: "5",
        trialNumber: "5",
        asphaltContent: "",
        bulkDensity: "",
        stability: "",
        flow: "",
        voids: "",
        vfb: "",
        vfa: "",
      },
    ],
  });

  const updateFormData = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onUpdate(newData);
  };

  const updateMixTrial = (index: number, field: string, value: string) => {
    const newData = [...formData.mixTrials];
    newData[index] = { ...newData[index], [field]: value };

    // Auto-calculate derived parameters
    if (field === "bulkDensity" || field === "asphaltContent") {
      const item = newData[index];
      if (item.bulkDensity && item.asphaltContent) {
        const bulkDensity = parseFloat(item.bulkDensity);
        const asphaltContent = parseFloat(item.asphaltContent) / 100;
        const theoreticalDensity = 2.65; // Typical aggregate density

        // Voids in mineral aggregate (VMA) calculation
        const effectiveAsphaltDensity = 1.03; // Typical asphalt density
        const vfb =
          ((bulkDensity * asphaltContent) / effectiveAsphaltDensity) * 100;
        item.vfb = vfb.toFixed(1);

        // Voids filled with asphalt (VFA)
        const vfa = (vfb / (100 - parseFloat(item.voids || "0"))) * 100;
        item.vfa = vfa.toFixed(1);
      }
    }

    const newFormData = { ...formData, mixTrials: newData };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  const addMixTrial = () => {
    const newTrial = {
      id: (formData.mixTrials.length + 1).toString(),
      trialNumber: (formData.mixTrials.length + 1).toString(),
      asphaltContent: "",
      bulkDensity: "",
      stability: "",
      flow: "",
      voids: "",
      vfb: "",
      vfa: "",
    };
    const newData = {
      ...formData,
      mixTrials: [...formData.mixTrials, newTrial],
    };
    setFormData(newData);
    onUpdate(newData);
  };

  const removeMixTrial = (index: number) => {
    if (formData.mixTrials.length > 3) {
      const newData = {
        ...formData,
        mixTrials: formData.mixTrials.filter((_, i) => i !== index),
      };
      setFormData(newData);
      onUpdate(newData);
    }
  };

  const findOptimalMix = () => {
    const validTrials = formData.mixTrials.filter(
      (trial) =>
        trial.stability && trial.flow && trial.voids && trial.vfb && trial.vfa
    );

    if (validTrials.length === 0) return null;

    // Find trial that best meets all criteria
    const targetStability = parseFloat(formData.targetStability);
    const targetFlow = parseFloat(formData.targetFlow);
    const targetVoids = parseFloat(formData.targetVoids);
    const targetVFB = parseFloat(formData.targetVFB);
    const targetVFA = parseFloat(formData.targetVFA);

    let bestTrial = null;
    let bestScore = Infinity;

    validTrials.forEach((trial) => {
      const stability = parseFloat(trial.stability);
      const flow = parseFloat(trial.flow);
      const voids = parseFloat(trial.voids);
      const vfb = parseFloat(trial.vfb);
      const vfa = parseFloat(trial.vfa);

      // Calculate deviation from targets
      const stabilityDev =
        Math.abs(stability - targetStability) / targetStability;
      const flowDev = Math.abs(flow - targetFlow) / targetFlow;
      const voidsDev = Math.abs(voids - targetVoids) / targetVoids;
      const vfbDev = Math.abs(vfb - targetVFB) / targetVFB;
      const vfaDev = Math.abs(vfa - targetVFA) / targetVFA;

      const totalScore = stabilityDev + flowDev + voidsDev + vfbDev + vfaDev;

      if (totalScore < bestScore) {
        bestScore = totalScore;
        bestTrial = trial;
      }
    });

    return bestTrial;
  };

  const getMixDesignStatus = () => {
    const optimalMix = findOptimalMix();
    if (!optimalMix) return "Insufficient data for mix design";

    const stability = parseFloat(optimalMix.stability);
    const flow = parseFloat(optimalMix.flow);
    const voids = parseFloat(optimalMix.voids);
    const vfb = parseFloat(optimalMix.vfb);
    const vfa = parseFloat(optimalMix.vfa);

    const targetStability = parseFloat(formData.targetStability);
    const targetFlow = parseFloat(formData.targetFlow);
    const targetVoids = parseFloat(formData.targetVoids);
    const targetVFB = parseFloat(formData.targetVFB);
    const targetVFA = parseFloat(formData.targetVFA);

    const checks = [
      stability >= targetStability * 0.9,
      Math.abs(flow - targetFlow) <= 0.5,
      Math.abs(voids - targetVoids) <= 1.0,
      Math.abs(vfb - targetVFB) <= 5.0,
      Math.abs(vfa - targetVFA) <= 5.0,
    ];

    const passedChecks = checks.filter(Boolean).length;

    if (passedChecks === 5)
      return "Excellent - All parameters within specification";
    if (passedChecks >= 4) return "Good - Most parameters acceptable";
    if (passedChecks >= 3) return "Fair - Requires adjustment";
    return "Poor - Significant adjustments needed";
  };

  const optimalMix = findOptimalMix();
  const mixDesignStatus = getMixDesignStatus();

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
                  <SelectItem value="Asphalt Wearing Course">
                    Asphalt Wearing Course
                  </SelectItem>
                  <SelectItem value="Asphalt Binder Course">
                    Asphalt Binder Course
                  </SelectItem>
                  <SelectItem value="Dense Bituminous Macadam">
                    Dense Bituminous Macadam
                  </SelectItem>
                  <SelectItem value="Bituminous Concrete">
                    Bituminous Concrete
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
                  <SelectItem value="Crushed Stone">Crushed Stone</SelectItem>
                  <SelectItem value="Gravel">Gravel</SelectItem>
                  <SelectItem value="Sand">Sand</SelectItem>
                  <SelectItem value="Recycled Aggregate">
                    Recycled Aggregate
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="binderGrade">Binder Grade</Label>
              <Select
                value={formData.binderGrade}
                onValueChange={(value) => updateFormData("binderGrade", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30/40">30/40</SelectItem>
                  <SelectItem value="40/50">40/50</SelectItem>
                  <SelectItem value="60/70">60/70</SelectItem>
                  <SelectItem value="80/100">80/100</SelectItem>
                  <SelectItem value="VG-10">VG-10</SelectItem>
                  <SelectItem value="VG-30">VG-30</SelectItem>
                  <SelectItem value="VG-40">VG-40</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Target Parameters */}
          <div className="mt-6">
            <h4 className="text-lg font-semibold mb-4">
              Target Design Parameters
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="targetStability">Target Stability (N)</Label>
                <Input
                  id="targetStability"
                  type="number"
                  value={formData.targetStability}
                  onChange={(e) =>
                    updateFormData("targetStability", e.target.value)
                  }
                  placeholder="9000"
                />
              </div>
              <div>
                <Label htmlFor="targetFlow">Target Flow (mm)</Label>
                <Input
                  id="targetFlow"
                  type="number"
                  step="0.1"
                  value={formData.targetFlow}
                  onChange={(e) => updateFormData("targetFlow", e.target.value)}
                  placeholder="3.0"
                />
              </div>
              <div>
                <Label htmlFor="targetVoids">Target Air Voids (%)</Label>
                <Input
                  id="targetVoids"
                  type="number"
                  step="0.1"
                  value={formData.targetVoids}
                  onChange={(e) =>
                    updateFormData("targetVoids", e.target.value)
                  }
                  placeholder="4.0"
                />
              </div>
              <div>
                <Label htmlFor="targetVFB">Target VFB (%)</Label>
                <Input
                  id="targetVFB"
                  type="number"
                  step="0.1"
                  value={formData.targetVFB}
                  onChange={(e) => updateFormData("targetVFB", e.target.value)}
                  placeholder="75"
                />
              </div>
              <div>
                <Label htmlFor="targetVFA">Target VFA (%)</Label>
                <Input
                  id="targetVFA"
                  type="number"
                  step="0.1"
                  value={formData.targetVFA}
                  onChange={(e) => updateFormData("targetVFA", e.target.value)}
                  placeholder="65"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mix Design Trials */}
      <Card>
        <CardHeader>
          <CardTitle>Marshall Mix Design Trials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left">
                    Trial
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Asphalt Content (%)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Bulk Density (kg/m³)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Stability (N)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Flow (mm)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Air Voids (%)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    VFB (%)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    VFA (%)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {formData.mixTrials.map((trial, index) => (
                  <tr key={trial.id}>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={trial.trialNumber}
                        onChange={(e) =>
                          updateMixTrial(index, "trialNumber", e.target.value)
                        }
                        placeholder="1"
                        className="w-12"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={trial.asphaltContent}
                        onChange={(e) =>
                          updateMixTrial(
                            index,
                            "asphaltContent",
                            e.target.value
                          )
                        }
                        placeholder="5.0"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={trial.bulkDensity}
                        onChange={(e) =>
                          updateMixTrial(index, "bulkDensity", e.target.value)
                        }
                        placeholder="2400"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={trial.stability}
                        onChange={(e) =>
                          updateMixTrial(index, "stability", e.target.value)
                        }
                        placeholder="9500"
                        className="w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={trial.flow}
                        onChange={(e) =>
                          updateMixTrial(index, "flow", e.target.value)
                        }
                        placeholder="3.2"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={trial.voids}
                        onChange={(e) =>
                          updateMixTrial(index, "voids", e.target.value)
                        }
                        placeholder="4.0"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={trial.vfb}
                        readOnly
                        className="w-16 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={trial.vfa}
                        readOnly
                        className="w-16 bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMixTrial(index)}
                        disabled={formData.mixTrials.length <= 3}
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
            <Button onClick={addMixTrial} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Mix Trial
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Hot Mix Design Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-900">
                Optimal Asphalt Content
              </h4>
              <p className="text-3xl font-mono text-blue-800">
                {optimalMix ? `${optimalMix.asphaltContent}%` : "N/A"}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                From mix design trials
              </p>
            </div>
            <div className="text-center p-6 bg-green-50 border border-green-200 rounded">
              <h4 className="font-semibold text-green-900">Design Stability</h4>
              <p className="text-3xl font-mono text-green-800">
                {optimalMix ? `${optimalMix.stability} N` : "N/A"}
              </p>
              <p className="text-sm text-green-700 mt-1">
                Marshall stability value
              </p>
            </div>
            <div className="text-center p-6 bg-orange-50 border border-orange-200 rounded">
              <h4 className="font-semibold text-orange-900">Design Status</h4>
              <div className="text-orange-800 mt-2">
                <p className="text-lg font-medium">{mixDesignStatus}</p>
              </div>
            </div>
          </div>

          {optimalMix && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
              <h4 className="font-semibold text-gray-900 mb-2">
                Optimal Mix Parameters (Trial {optimalMix.trialNumber})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Asphalt Content:</span>
                  <p className="text-muted-foreground">
                    {optimalMix.asphaltContent}%
                  </p>
                </div>
                <div>
                  <span className="font-medium">Stability:</span>
                  <p className="text-muted-foreground">
                    {optimalMix.stability} N
                  </p>
                </div>
                <div>
                  <span className="font-medium">Flow:</span>
                  <p className="text-muted-foreground">{optimalMix.flow} mm</p>
                </div>
                <div>
                  <span className="font-medium">Air Voids:</span>
                  <p className="text-muted-foreground">{optimalMix.voids}%</p>
                </div>
                <div>
                  <span className="font-medium">VFB:</span>
                  <p className="text-muted-foreground">{optimalMix.vfb}%</p>
                </div>
                <div>
                  <span className="font-medium">VFA:</span>
                  <p className="text-muted-foreground">{optimalMix.vfa}%</p>
                </div>
                <div>
                  <span className="font-medium">Bulk Density:</span>
                  <p className="text-muted-foreground">
                    {optimalMix.bulkDensity} kg/m³
                  </p>
                </div>
                <div>
                  <span className="font-medium">Test Standard:</span>
                  <p className="text-muted-foreground">
                    ASTM D1559 / AASHTO T245
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-900 mb-2">
              Marshall Design Criteria
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>
                • Stability: ≥ 8000 N for wearing course, ≥ 6000 N for binder
                course
              </li>
              <li>• Flow: 2-4 mm (acceptable range), 3 mm (optimum)</li>
              <li>• Air voids: 3-5% (acceptable), 4% (optimum)</li>
              <li>• VFB: 70-80% (acceptable), 75% (optimum)</li>
              <li>• VFA: 60-75% (acceptable), 65% (optimum)</li>
              <li>• Minimum 5 trials with asphalt content varying by 0.5%</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded">
            <h4 className="font-semibold text-purple-900 mb-2">
              Mix Design Procedure
            </h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Prepare aggregate blend meeting gradation requirements</li>
              <li>
                • Select 5 asphalt contents varying by 0.5% around estimated
                value
              </li>
              <li>• Mix and compact specimens at each asphalt content</li>
              <li>• Test Marshall stability and flow for each trial</li>
              <li>• Calculate volumetric properties (voids, VFB, VFA)</li>
              <li>• Select optimum asphalt content meeting all criteria</li>
              <li>• Verify design with additional testing if required</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <h4 className="font-semibold text-red-900 mb-2">
              Quality Control Considerations
            </h4>
            <div className="text-sm text-red-800">
              <ul className="space-y-1">
                <li>
                  • Aggregate quality and gradation consistency is critical
                </li>
                <li>
                  • Asphalt binder properties must meet specification
                  requirements
                </li>
                <li>• Mixing and compaction temperatures must be controlled</li>
                <li>
                  • Laboratory conditions should simulate field conditions
                </li>
                <li>
                  • Design should account for production and construction
                  variations
                </li>
                <li>
                  • Regular verification testing ensures continued quality
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
