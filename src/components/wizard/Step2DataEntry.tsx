import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock } from "lucide-react";
import { FieldDensityTest } from "./tests/FieldDensityTest";
import { ConcreteCompressionTest } from "./tests/ConcreteCompressionTest";
import { AtterbergLimitsTest } from "./tests/AtterbergLimitsTest";
import { ProctorCompactionTest } from "./tests/ProctorCompactionTest";
import { CBRTest } from "./tests/CBRTest";
import { SieveAnalysisTest } from "./tests/SieveAnalysisTest";
import { AggregateImpactValueTest } from "./tests/AggregateImpactValueTest";
import { WaterAbsorptionTest } from "./tests/WaterAbsorptionTest";
import { LosAngelesAbrasionTest } from "./tests/LosAngelesAbrasionTest";
import { MarshallStabilityTest } from "./tests/MarshallStabilityTest";
import { SpreadRateOfBinderTest } from "./tests/SpreadRateOfBinderTest";
import { UnitWeightSandConeTest } from "./tests/UnitWeightSandConeTest";
import { AsphaltLayingRecordTest } from "./tests/AsphaltLayingRecordTest";
import { AsphaltCoreDensityTest } from "./tests/AsphaltCoreDensityTest";
import { QuantitativeExtractionTest } from "./tests/QuantitativeExtractionTest";
import { IndividualGradationsTest } from "./tests/IndividualGradationsTest";
import { HotMixDesignTest } from "./tests/HotMixDesignTest";
import { ShapeIndexTest } from "./tests/ShapeIndexTest";
import { BulkSpecificGravityFineTest } from "./tests/BulkSpecificGravityFineTest";
import { BulkSpecificGravityCoarseTest } from "./tests/BulkSpecificGravityCoarseTest";
import { ClaySiltDustFractionTest } from "./tests/ClaySiltDustFractionTest";
import { AggregateCrushingValueTest } from "./tests/AggregateCrushingValueTest";
import { BulkDensityTest } from "./tests/BulkDensityTest";

interface Step2DataEntryProps {
  data: any;
  onUpdate: (data: any) => void;
  testType?: string;
}

export function Step2DataEntry({
  data,
  onUpdate,
  testType,
}: Step2DataEntryProps) {
  const [testData, setTestData] = useState(data.data_json || {});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const { toast } = useToast();

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    setSaveStatus("saving");
    try {
      onUpdate({ data_json: testData });
      setSaveStatus("saved");

      // Show success toast for first save or after errors
      if (saveStatus !== "saved") {
        toast({
          title: "Auto-saved",
          description: "Your test data has been automatically saved.",
          duration: 2000,
        });
      }

      // Reset to idle after showing saved status briefly
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      setSaveStatus("idle");
      toast({
        title: "Save Error",
        description: "Failed to save your data. Please try again.",
        variant: "destructive",
      });
    }
  }, [testData, onUpdate, saveStatus, toast]);

  useEffect(() => {
    const timer = setTimeout(autoSave, 2000); // Auto-save after 2 seconds of inactivity
    return () => clearTimeout(timer);
  }, [testData, autoSave]);

  const updateTestData = (newData: any) => {
    setTestData((prev) => ({ ...prev, ...newData }));
  };

  const renderTestInterface = () => {
    // Pass parent data (Step 1 fields) to test components for auto-fill
    const parentData = {
      side: data.side,
      chainage_from: data.chainage_from,
      chainage_to: data.chainage_to,
      road_offset: data.road_offset,
      road_name: data.road_name,
      test_date: data.test_date,
      technician_name: data.technician_name,
    };

    switch (testType) {
      case "Field Density":
        return <FieldDensityTest data={testData} onUpdate={updateTestData} parentData={parentData} />;

      case "Compressive Strength of Concrete":
        return (
          <ConcreteCompressionTest data={testData} onUpdate={updateTestData} />
        );

      case "Atterberg Limits":
        return (
          <AtterbergLimitsTest data={testData} onUpdate={updateTestData} />
        );

      case "Proctor Compaction":
        return (
          <ProctorCompactionTest data={testData} onUpdate={updateTestData} parentData={parentData} />
        );

      case "CBR":
        return <CBRTest data={testData} onUpdate={updateTestData} parentData={parentData} />;

      case "Sieve Analysis":
        return <SieveAnalysisTest data={testData} onUpdate={updateTestData} />;

      case "Aggregate Impact Value":
        return (
          <AggregateImpactValueTest data={testData} onUpdate={updateTestData} />
        );

      case "Water Absorption":
        return (
          <WaterAbsorptionTest data={testData} onUpdate={updateTestData} />
        );

      case "Los Angeles Abrasion":
        return (
          <LosAngelesAbrasionTest data={testData} onUpdate={updateTestData} />
        );

      case "Marshall Stability":
        return (
          <MarshallStabilityTest data={testData} onUpdate={updateTestData} />
        );

      case "Spread Rate of Binder":
        return (
          <SpreadRateOfBinderTest data={testData} onUpdate={updateTestData} />
        );

      case "Unit Weight of Sand Cone":
        return (
          <UnitWeightSandConeTest data={testData} onUpdate={updateTestData} parentData={parentData} />
        );

      case "Asphalt Laying Record":
        return (
          <AsphaltLayingRecordTest data={testData} onUpdate={updateTestData} parentData={parentData} />
        );

      case "Asphalt Core Density":
        return (
          <AsphaltCoreDensityTest data={testData} onUpdate={updateTestData} />
        );

      case "Quantitative Extraction":
        return (
          <QuantitativeExtractionTest
            data={testData}
            onUpdate={updateTestData}
          />
        );

      case "Individual Gradations":
        return (
          <IndividualGradationsTest data={testData} onUpdate={updateTestData} />
        );

      case "Hot Mix Design":
        return <HotMixDesignTest data={testData} onUpdate={updateTestData} />;

      case "Shape Index (Flakiness/Elongation)":
        return <ShapeIndexTest data={testData} onUpdate={updateTestData} />;

      case "Bulk Specific Gravity (Fine)":
        return (
          <BulkSpecificGravityFineTest
            data={testData}
            onUpdate={updateTestData}
          />
        );

      case "Bulk Specific Gravity (Coarse)":
        return (
          <BulkSpecificGravityCoarseTest
            data={testData}
            onUpdate={updateTestData}
          />
        );

      case "Clay Silt Dust Fraction":
        return (
          <ClaySiltDustFractionTest data={testData} onUpdate={updateTestData} />
        );

      case "Aggregate Crushing Value":
        return (
          <AggregateCrushingValueTest
            data={testData}
            onUpdate={updateTestData}
          />
        );

      case "Bulk Density":
        return <BulkDensityTest data={testData} onUpdate={updateTestData} />;

      default:
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">
              Debug: Test Type = "{testType}"
            </h3>
            <p className="text-muted-foreground mb-4">
              Test type received:{" "}
              {testType ? `"${testType}"` : "undefined/null"}
            </p>
            <div className="bg-muted/30 border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
              <p className="text-muted-foreground">
                Excel-like grid with formulas, validation, copy/paste, undo/redo
                features will be implemented here.
                <br />
                Features: SUM, AVG, MIN, MAX formulas • Typed columns • Freeze
                headers • Add/remove rows
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Test Info Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>Test Data Entry</CardTitle>
              {saveStatus === "saving" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 animate-spin" />
                  Saving...
                </div>
              )}
              {saveStatus === "saved" && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Auto-saved
                </div>
              )}
            </div>
            <Badge variant="outline">{testType || "Unknown Test"}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Report Number:</span>
              <p className="text-muted-foreground">
                {data.report_number || "Not generated"}
              </p>
            </div>
            <div>
              <span className="font-medium">Road:</span>
              <p className="text-muted-foreground">
                {data.road_name || "Not specified"}
              </p>
            </div>
            <div>
              <span className="font-medium">Chainage:</span>
              <p className="text-muted-foreground">
                {data.chainage_from && data.chainage_to
                  ? `${data.chainage_from} to ${data.chainage_to}`
                  : "Not specified"}
              </p>
            </div>
            <div>
              <span className="font-medium">Date:</span>
              <p className="text-muted-foreground">
                {data.test_date || "Not specified"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Test Interface */}
      {renderTestInterface()}

      {/* Instructions */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-2">Instructions:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Enter test data in the fields above</li>
            <li>• Data is automatically saved every 2 seconds (look for the green checkmark)</li>
            <li>• Auto-save notifications appear when data is successfully saved</li>
            <li>• Use Tab to navigate between fields quickly</li>
            <li>• Required calculations are performed automatically</li>
            <li>• Red fields indicate validation errors</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
