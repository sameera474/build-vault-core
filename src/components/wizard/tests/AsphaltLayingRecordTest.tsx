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

interface LayerData {
  id: string;
  layerType: string;
  thickness: string;
  temperature: string;
  layingSpeed: string;
  compactionPasses: string;
  rollerType: string;
}

interface AsphaltLayingRecordTestProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function AsphaltLayingRecordTest({
  data,
  onUpdate,
}: AsphaltLayingRecordTestProps) {
  const [formData, setFormData] = useState({
    projectName: data.projectName || "",
    roadSection: data.roadSection || "",
    chainageFrom: data.chainageFrom || "",
    chainageTo: data.chainageTo || "",
    dateOfLaying: data.dateOfLaying || "",
    startTime: data.startTime || "",
    endTime: data.endTime || "",
    contractorName: data.contractorName || "",
    supervisorName: data.supervisorName || "",
    mixType: data.mixType || "Dense Bituminous Macadam",
    asphaltContent: data.asphaltContent || "",
    aggregateType: data.aggregateType || "",
    binderGrade: data.binderGrade || "60/70",
    plantName: data.plantName || "",
    haulDistance: data.haulDistance || "",
    deliveryTemperature: data.deliveryTemperature || "",
    layingTemperature: data.layingTemperature || "",
    compactionTemperature: data.compactionTemperature || "",
    weatherConditions: data.weatherConditions || "",
    ambientTemperature: data.ambientTemperature || "",
    windSpeed: data.windSpeed || "",
    humidity: data.humidity || "",
    paverMake: data.paverMake || "",
    paverModel: data.paverModel || "",
    screedWidth: data.screedWidth || "",
    layingSpeed: data.layingSpeed || "",
    layerData: data.layerData || [
      {
        id: "1",
        layerType: "Binder Course",
        thickness: "",
        temperature: "",
        layingSpeed: "",
        compactionPasses: "",
        rollerType: "Vibratory",
      },
      {
        id: "2",
        layerType: "Wearing Course",
        thickness: "",
        temperature: "",
        layingSpeed: "",
        compactionPasses: "",
        rollerType: "Pneumatic",
      },
    ],
    qualityObservations: data.qualityObservations || "",
    nonConformities: data.nonConformities || "",
    correctiveActions: data.correctiveActions || "",
    remarks: data.remarks || "",
  });

  const updateFormData = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onUpdate(newData);
  };

  const updateLayerData = (index: number, field: string, value: string) => {
    const newData = [...formData.layerData];
    newData[index] = { ...newData[index], [field]: value };
    const newFormData = { ...formData, layerData: newData };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  const addLayer = () => {
    const newLayer = {
      id: (formData.layerData.length + 1).toString(),
      layerType: `Layer ${formData.layerData.length + 1}`,
      thickness: "",
      temperature: "",
      layingSpeed: "",
      compactionPasses: "",
      rollerType: "Vibratory",
    };
    const newData = {
      ...formData,
      layerData: [...formData.layerData, newLayer],
    };
    setFormData(newData);
    onUpdate(newData);
  };

  const removeLayer = (index: number) => {
    if (formData.layerData.length > 1) {
      const newData = {
        ...formData,
        layerData: formData.layerData.filter((_, i) => i !== index),
      };
      setFormData(newData);
      onUpdate(newData);
    }
  };

  const calculateTotalThickness = () => {
    const validThicknesses = formData.layerData.filter(
      (item) => item.thickness && parseFloat(item.thickness) > 0
    );

    if (validThicknesses.length === 0) return "0.00";

    const sum = validThicknesses.reduce(
      (acc, item) => acc + parseFloat(item.thickness),
      0
    );
    return sum.toFixed(2);
  };

  const getTemperatureStatus = (temp: number) => {
    if (temp >= 140 && temp <= 160) return "Optimal - Good workability";
    if (temp >= 130 && temp <= 170) return "Acceptable - Moderate workability";
    if (temp < 130) return "Too Low - Poor compaction";
    return "Too High - Excessive oxidation";
  };

  const getWeatherSuitability = () => {
    const temp = parseFloat(formData.ambientTemperature) || 0;
    const wind = parseFloat(formData.windSpeed) || 0;
    const humidity = parseFloat(formData.humidity) || 0;

    if (temp >= 10 && temp <= 35 && wind <= 20 && humidity <= 80) {
      return "Excellent - Optimal conditions";
    }
    if (temp >= 5 && temp <= 40 && wind <= 30 && humidity <= 90) {
      return "Good - Suitable conditions";
    }
    if (temp < 5 || temp > 40 || wind > 30 || humidity > 90) {
      return "Poor - Not recommended";
    }
    return "Fair - Monitor closely";
  };

  const totalThickness = calculateTotalThickness();

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
              <Label htmlFor="chainageFrom">Chainage From (km)</Label>
              <Input
                id="chainageFrom"
                value={formData.chainageFrom}
                onChange={(e) => updateFormData("chainageFrom", e.target.value)}
                placeholder="0.000"
              />
            </div>
            <div>
              <Label htmlFor="chainageTo">Chainage To (km)</Label>
              <Input
                id="chainageTo"
                value={formData.chainageTo}
                onChange={(e) => updateFormData("chainageTo", e.target.value)}
                placeholder="1.000"
              />
            </div>
            <div>
              <Label htmlFor="dateOfLaying">Date of Laying</Label>
              <Input
                id="dateOfLaying"
                type="date"
                value={formData.dateOfLaying}
                onChange={(e) => updateFormData("dateOfLaying", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="contractorName">Contractor Name</Label>
              <Input
                id="contractorName"
                value={formData.contractorName}
                onChange={(e) =>
                  updateFormData("contractorName", e.target.value)
                }
                placeholder="Contractor company"
              />
            </div>
            <div>
              <Label htmlFor="supervisorName">Supervisor Name</Label>
              <Input
                id="supervisorName"
                value={formData.supervisorName}
                onChange={(e) =>
                  updateFormData("supervisorName", e.target.value)
                }
                placeholder="Site supervisor"
              />
            </div>
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => updateFormData("startTime", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => updateFormData("endTime", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Material Information */}
      <Card>
        <CardHeader>
          <CardTitle>Material Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="aggregateType">Aggregate Type</Label>
              <Input
                id="aggregateType"
                value={formData.aggregateType}
                onChange={(e) =>
                  updateFormData("aggregateType", e.target.value)
                }
                placeholder="Crushed stone, gravel, etc."
              />
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
                  <SelectItem value="30/40">30/40 Penetration Grade</SelectItem>
                  <SelectItem value="40/50">40/50 Penetration Grade</SelectItem>
                  <SelectItem value="60/70">60/70 Penetration Grade</SelectItem>
                  <SelectItem value="80/100">
                    80/100 Penetration Grade
                  </SelectItem>
                  <SelectItem value="PMB">Polymer Modified Binder</SelectItem>
                  <SelectItem value="CRMB">Crumb Rubber Modified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="plantName">Asphalt Plant Name</Label>
              <Input
                id="plantName"
                value={formData.plantName}
                onChange={(e) => updateFormData("plantName", e.target.value)}
                placeholder="Plant location/name"
              />
            </div>
            <div>
              <Label htmlFor="haulDistance">Haul Distance (km)</Label>
              <Input
                id="haulDistance"
                type="number"
                step="0.1"
                value={formData.haulDistance}
                onChange={(e) => updateFormData("haulDistance", e.target.value)}
                placeholder="15.0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Temperature Information */}
      <Card>
        <CardHeader>
          <CardTitle>Temperature Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deliveryTemperature">
                Delivery Temperature (°C)
              </Label>
              <Input
                id="deliveryTemperature"
                type="number"
                step="0.1"
                value={formData.deliveryTemperature}
                onChange={(e) =>
                  updateFormData("deliveryTemperature", e.target.value)
                }
                placeholder="150"
              />
            </div>
            <div>
              <Label htmlFor="layingTemperature">Laying Temperature (°C)</Label>
              <Input
                id="layingTemperature"
                type="number"
                step="0.1"
                value={formData.layingTemperature}
                onChange={(e) =>
                  updateFormData("layingTemperature", e.target.value)
                }
                placeholder="145"
              />
            </div>
            <div>
              <Label htmlFor="compactionTemperature">
                Compaction Temperature (°C)
              </Label>
              <Input
                id="compactionTemperature"
                type="number"
                step="0.1"
                value={formData.compactionTemperature}
                onChange={(e) =>
                  updateFormData("compactionTemperature", e.target.value)
                }
                placeholder="135"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weather Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Weather Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weatherConditions">Weather Description</Label>
              <Textarea
                id="weatherConditions"
                value={formData.weatherConditions}
                onChange={(e) =>
                  updateFormData("weatherConditions", e.target.value)
                }
                placeholder="Sunny, cloudy, rainy, etc."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="ambientTemperature">
                Ambient Temperature (°C)
              </Label>
              <Input
                id="ambientTemperature"
                type="number"
                step="0.1"
                value={formData.ambientTemperature}
                onChange={(e) =>
                  updateFormData("ambientTemperature", e.target.value)
                }
                placeholder="25"
              />
            </div>
            <div>
              <Label htmlFor="windSpeed">Wind Speed (km/h)</Label>
              <Input
                id="windSpeed"
                type="number"
                step="0.1"
                value={formData.windSpeed}
                onChange={(e) => updateFormData("windSpeed", e.target.value)}
                placeholder="10"
              />
            </div>
            <div>
              <Label htmlFor="humidity">Humidity (%)</Label>
              <Input
                id="humidity"
                type="number"
                step="0.1"
                value={formData.humidity}
                onChange={(e) => updateFormData("humidity", e.target.value)}
                placeholder="60"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paverMake">Paver Make</Label>
              <Input
                id="paverMake"
                value={formData.paverMake}
                onChange={(e) => updateFormData("paverMake", e.target.value)}
                placeholder="Caterpillar, Vogele, etc."
              />
            </div>
            <div>
              <Label htmlFor="paverModel">Paver Model</Label>
              <Input
                id="paverModel"
                value={formData.paverModel}
                onChange={(e) => updateFormData("paverModel", e.target.value)}
                placeholder="ABG, Super 1800, etc."
              />
            </div>
            <div>
              <Label htmlFor="screedWidth">Screed Width (m)</Label>
              <Input
                id="screedWidth"
                type="number"
                step="0.1"
                value={formData.screedWidth}
                onChange={(e) => updateFormData("screedWidth", e.target.value)}
                placeholder="3.5"
              />
            </div>
            <div>
              <Label htmlFor="layingSpeed">Laying Speed (m/min)</Label>
              <Input
                id="layingSpeed"
                type="number"
                step="0.1"
                value={formData.layingSpeed}
                onChange={(e) => updateFormData("layingSpeed", e.target.value)}
                placeholder="4.0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Layer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left">
                    Layer Type
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Thickness (mm)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Temperature (°C)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Laying Speed (m/min)
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Compaction Passes
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Roller Type
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {formData.layerData.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.layerType}
                        onChange={(e) =>
                          updateLayerData(index, "layerType", e.target.value)
                        }
                        placeholder="Binder Course"
                        className="w-24"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.thickness}
                        onChange={(e) =>
                          updateLayerData(index, "thickness", e.target.value)
                        }
                        placeholder="50"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.temperature}
                        onChange={(e) =>
                          updateLayerData(index, "temperature", e.target.value)
                        }
                        placeholder="145"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.layingSpeed}
                        onChange={(e) =>
                          updateLayerData(index, "layingSpeed", e.target.value)
                        }
                        placeholder="4.0"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.compactionPasses}
                        onChange={(e) =>
                          updateLayerData(
                            index,
                            "compactionPasses",
                            e.target.value
                          )
                        }
                        placeholder="8"
                        className="w-16"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Select
                        value={item.rollerType}
                        onValueChange={(value) =>
                          updateLayerData(index, "rollerType", value)
                        }
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Vibratory">Vibratory</SelectItem>
                          <SelectItem value="Static">Static</SelectItem>
                          <SelectItem value="Pneumatic">Pneumatic</SelectItem>
                          <SelectItem value="Tandem">Tandem</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLayer(index)}
                        disabled={formData.layerData.length <= 1}
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
            <Button onClick={addLayer} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Layer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quality Control */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Control & Observations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="qualityObservations">Quality Observations</Label>
            <Textarea
              id="qualityObservations"
              value={formData.qualityObservations}
              onChange={(e) =>
                updateFormData("qualityObservations", e.target.value)
              }
              placeholder="Surface finish, segregation, bleeding, etc."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="nonConformities">Non-Conformities</Label>
            <Textarea
              id="nonConformities"
              value={formData.nonConformities}
              onChange={(e) =>
                updateFormData("nonConformities", e.target.value)
              }
              placeholder="Any deviations from specifications"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="correctiveActions">Corrective Actions</Label>
            <Textarea
              id="correctiveActions"
              value={formData.correctiveActions}
              onChange={(e) =>
                updateFormData("correctiveActions", e.target.value)
              }
              placeholder="Actions taken to correct issues"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => updateFormData("remarks", e.target.value)}
              placeholder="Additional notes and observations"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Asphalt Laying Record Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-900">Total Thickness</h4>
              <p className="text-3xl font-mono text-blue-800">
                {totalThickness} mm
              </p>
              <p className="text-sm text-blue-700 mt-1">All layers combined</p>
            </div>
            <div className="text-center p-6 bg-green-50 border border-green-200 rounded">
              <h4 className="font-semibold text-green-900">
                Weather Suitability
              </h4>
              <div className="text-green-800 mt-2">
                <p className="text-lg font-medium">{getWeatherSuitability()}</p>
              </div>
            </div>
            <div className="text-center p-6 bg-orange-50 border border-orange-200 rounded">
              <h4 className="font-semibold text-orange-900">
                Laying Temperature
              </h4>
              <div className="text-orange-800 mt-2">
                <p className="text-lg font-medium">
                  {parseFloat(formData.layingTemperature) !== 0
                    ? getTemperatureStatus(
                        parseFloat(formData.layingTemperature)
                      )
                    : "Not recorded"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
            <h4 className="font-semibold text-gray-900 mb-2">
              Construction Summary
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Project:</span>
                <p className="text-muted-foreground">
                  {formData.projectName || "Not specified"}
                </p>
              </div>
              <div>
                <span className="font-medium">Section:</span>
                <p className="text-muted-foreground">
                  {formData.roadSection || "Not specified"}
                </p>
              </div>
              <div>
                <span className="font-medium">Chainage:</span>
                <p className="text-muted-foreground">
                  {formData.chainageFrom && formData.chainageTo
                    ? `${formData.chainageFrom} - ${formData.chainageTo} km`
                    : "Not specified"}
                </p>
              </div>
              <div>
                <span className="font-medium">Contractor:</span>
                <p className="text-muted-foreground">
                  {formData.contractorName || "Not specified"}
                </p>
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
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-900 mb-2">
              Quality Control Checklist
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Temperature maintained within specification range</li>
              <li>• Uniform spreading and compaction achieved</li>
              <li>• No segregation or bleeding observed</li>
              <li>• Surface finish meets smoothness requirements</li>
              <li>• Layer thickness within tolerance (±10mm)</li>
              <li>• Weather conditions suitable for laying</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded">
            <h4 className="font-semibold text-purple-900 mb-2">
              Construction Standards
            </h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>
                • IRC:SP:79-2018 - Guidelines for Construction of Bituminous
                Roads
              </li>
              <li>
                • MoRTH Specifications for Road and Bridge Works (5th Revision)
              </li>
              <li>
                • ASTM D2950/D2950M - Standard Test Method for Density of
                Bituminous Concrete
              </li>
              <li>
                • AASHTO R35 - Standard Practice for Superpave Volumetric Mix
                Design
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
