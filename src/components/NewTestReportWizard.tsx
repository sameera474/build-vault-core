import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { reportService } from "@/services/reportService";
import { Step1General } from "./wizard/Step1General";
import { Step2DataEntry } from "./wizard/Step2DataEntry";
import { Step3Summary } from "./wizard/Step3Summary";
import { Step4Review } from "./wizard/Step4Review";

interface WizardData {
  // Step 1 - General Info
  project_id?: string;
  gps_latitude?: number;
  gps_longitude?: number;
  road_name?: string;
  material?: string;
  custom_material?: string;
  test_type?: string;
  doc_code?: string;
  report_number?: string;
  chainage_from?: string;
  chainage_to?: string;
  test_date?: string;
  time_of_test?: string;
  side?: string;
  technician_name?: string;
  technician_id?: string;
  weather_conditions?: string;
  site_conditions?: string;

  // Step 2 - Test Data
  data_json?: any;

  // Step 3 - Summary & Results
  summary_json?: any;
  compliance_status?: string;
  notes?: string;

  // Step 4 - Review (read-only)
}

interface NewTestReportWizardProps {
  onClose?: () => void;
  existingReportId?: string;
}

export function NewTestReportWizard({
  onClose,
  existingReportId,
}: NewTestReportWizardProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({});
  const [reportId, setReportId] = useState<string | null>(
    existingReportId || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(
    !!existingReportId
  );
  
  // Track if we've already loaded the report to prevent infinite loops
  const hasLoadedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  
  // Keep onClose ref updated
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  // Load existing report data if editing - only run once per existingReportId
  useEffect(() => {
    // Skip if no existingReportId or already loaded for this ID
    if (!existingReportId || hasLoadedRef.current) return;
    
    // Mark as loading to prevent duplicate calls
    hasLoadedRef.current = true;
    
    const loadExistingReport = async () => {
      setIsLoadingExisting(true);
      try {
        const report = await reportService.fetchReport(existingReportId);

        // Populate wizard data from existing report
        const loadedData: WizardData = {
          project_id: report.project_id,
          gps_latitude: report.gps_latitude,
          gps_longitude: report.gps_longitude,
          road_name: report.road_name,
          material:
            report.material ||
            (report.custom_material ? "custom" : undefined),
          custom_material: report.custom_material,
          test_type: report.test_type,
          doc_code: report.doc_code,
          report_number: report.report_number,
          chainage_from: report.chainage_from,
          chainage_to: report.chainage_to,
          test_date: report.test_date,
          time_of_test: report.time_of_test,
          side: report.side,
          technician_name: report.technician_name,
          technician_id: report.technician_id,
          weather_conditions: report.weather_conditions,
          site_conditions: report.site_conditions,
          data_json: report.data_json || {},
          summary_json: report.summary_json || {},
          compliance_status: report.compliance_status,
          notes: report.notes,
        };

        setWizardData(loadedData);

        // Determine which step to start from based on completion
        let startStep = 1;
        if (
          loadedData.data_json &&
          Object.keys(loadedData.data_json).length > 0
        ) {
          startStep = 3; // Has test data, start at summary
        } else if (loadedData.test_type && loadedData.project_id) {
          startStep = 2; // Has basic info, start at data entry
        }

        setCurrentStep(startStep);

        toast({
          title: "Draft Loaded",
          description:
            "Continue editing your test report from where you left off.",
        });
      } catch (error) {
        console.error("Error loading existing report:", error);
        toast({
          title: "Error",
          description: "Failed to load the draft report. Please try again.",
          variant: "destructive",
        });
        if (onCloseRef.current) {
          onCloseRef.current();
        } else {
          navigate("/test-reports");
        }
      } finally {
        setIsLoadingExisting(false);
      }
    };

    loadExistingReport();
  }, [existingReportId, navigate]);
  
  // Reset the hasLoadedRef when existingReportId changes to a different value
  useEffect(() => {
    return () => {
      hasLoadedRef.current = false;
    };
  }, [existingReportId]);

  // Auto-save when moving between steps
  const autoSave = async (data: WizardData) => {
    if (!reportId) return;

    try {
      await reportService.saveReportData(reportId, {
        data_json: data.data_json || {},
        summary_json: data.summary_json || {},
        graphs_json: {},
      });
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  };

  const updateWizardData = (stepData: Partial<WizardData>) => {
    setWizardData((prev) => {
      const updated = { ...prev, ...stepData };
      // Auto-save on data changes
      if (reportId && (stepData.data_json || stepData.summary_json)) {
        autoSave(updated);
      }
      return updated;
    });
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      // Create the test report when moving from step 1 to step 2
      if (
        !wizardData.project_id ||
        !wizardData.test_date ||
        !wizardData.test_type
      ) {
        toast({
          title: "Required Fields Missing",
          description: "Please fill in all required fields before proceeding.",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      try {
        // Build enum-safe material fields
        const materialEnumValue =
          wizardData.material === "custom" ? null : wizardData.material;
        const customMaterial =
          wizardData.material === "custom"
            ? wizardData.custom_material || null
            : null;

        const report = await reportService.createReport({
          project_id: wizardData.project_id,
          report_number: wizardData.report_number,
          doc_code: wizardData.doc_code,
          material: materialEnumValue as any,
          custom_material: customMaterial,
          test_type: wizardData.test_type,
          road_name: wizardData.road_name,
          chainage_from: wizardData.chainage_from,
          chainage_to: wizardData.chainage_to,
          test_date: wizardData.test_date,
          time_of_test: wizardData.time_of_test,
          side: wizardData.side as any,
          technician_name: wizardData.technician_name,
          technician_id: wizardData.technician_id,
          weather_conditions: wizardData.weather_conditions,
          site_conditions: wizardData.site_conditions,
          gps_latitude: wizardData.gps_latitude,
          gps_longitude: wizardData.gps_longitude,
          status: "submitted" as any,
        });

        setReportId(report.id);

        toast({
          title: "Test Report Created",
          description: `Report ${report.report_number} has been created successfully.`,
        });
      } catch (error) {
        console.error("Error creating report:", error);
        toast({
          title: "Error",
          description: "Failed to create test report. Please try again.",
          variant: "destructive",
        });
        return;
      } finally {
        setIsLoading(false);
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSaveDraft = async () => {
    if (!reportId) return;

    setIsLoading(true);
    try {
      await autoSave(wizardData);
      toast({
        title: "Draft Saved",
        description: "Your test report has been saved as a draft.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!reportId) return;

    setIsLoading(true);
    try {
      // The report is already submitted on creation, so we just close the wizard
      // await reportService.submitForApproval(reportId);
      toast({
        title: "Report Created & Submitted",
        description:
          "Your test report has been created and submitted for approval.",
      });
      if (onClose) {
        onClose();
      } else {
        navigate("/test-reports");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1General data={wizardData} onUpdate={updateWizardData} />;
      case 2:
        return (
          <Step2DataEntry
            data={wizardData}
            onUpdate={updateWizardData}
            testType={wizardData.test_type}
          />
        );
      case 3:
        return <Step3Summary data={wizardData} onUpdate={updateWizardData} />;
      case 4:
        return (
          <Step4Review
            data={wizardData}
            onSaveDraft={handleSaveDraft}
            onSubmitForApproval={handleSubmitForApproval}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "General Project Information";
      case 2:
        return "Test Data Entry";
      case 3:
        return "Summary & Results";
      case 4:
        return "Final Review";
      default:
        return "";
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create Test Report</h1>
          <p className="text-muted-foreground">
            Follow the step-by-step wizard to create a comprehensive test report
          </p>
        </div>
        {onClose ? (
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        ) : (
          <Button variant="outline" onClick={() => navigate("/test-reports")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Step {currentStep} of {totalSteps}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="text-center">
              <h2 className="text-xl font-semibold">{getStepTitle()}</h2>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">{renderCurrentStep()}</CardContent>
      </Card>

      {/* Navigation */}
      {currentStep < 4 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <Button onClick={handleNext} disabled={isLoading}>
            {isLoading ? (
              "Creating..."
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
