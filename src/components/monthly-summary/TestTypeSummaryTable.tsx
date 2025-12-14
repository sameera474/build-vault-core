import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface TestReport {
  id: string;
  test_date: string;
  report_number: string;
  test_type?: string;
  road_name?: string;
  covered_chainage?: string;
  chainage_from?: string;
  chainage_to?: string;
  side?: string;
  technician_name?: string;
  compliance_status?: string;
  status?: string;
  data_json?: any;
  summary_json?: any;
  laboratory_test_no?: string;
}

interface TestTypeSummaryTableProps {
  testType: string;
  reports: TestReport[];
  projectName?: string;
}

// Define columns for each test type based on the reference images
const getColumnsForTestType = (testType: string) => {
  switch (testType) {
    case "Field Density":
      return [
        { key: "test_date", label: "Date of Test", width: "w-24" },
        { key: "report_number", label: "Test Report No", width: "w-28" },
        { key: "covered_chainage", label: "Covered Chainage", width: "w-32" },
        { key: "test_location", label: "Test Location", width: "w-24" },
        { key: "layer_no", label: "Layer No", width: "w-16" },
        { key: "depth_mm", label: "Depth (mm) ERL", width: "w-20" },
        { key: "side", label: "Side", width: "w-14" },
        { key: "offset_m", label: "Offset (m)", width: "w-16" },
        { key: "hole_depth_mm", label: "Hole Depth (mm)", width: "w-20" },
        { key: "moisture_content", label: "M.C", width: "w-14" },
        { key: "field_dry_density", label: "F.D.D", width: "w-16" },
        { key: "optimum_moisture", label: "O.M.C", width: "w-14" },
        { key: "max_dry_density", label: "M.D.D", width: "w-16" },
        { key: "laboratory_sample_no", label: "Lab Sample No", width: "w-24" },
        { key: "compaction", label: "Compaction (%)", width: "w-20" },
        { key: "compliance", label: "App/Not", width: "w-16" },
        { key: "remarks", label: "Remarks", width: "w-24" },
      ];
    case "Concrete Compression":
      return [
        { key: "sample_no", label: "Sample No", width: "w-20" },
        { key: "date_of_cast", label: "Date of Cast", width: "w-24" },
        { key: "test_date", label: "Date of Test", width: "w-24" },
        { key: "agg_days", label: "Age Days", width: "w-16" },
        { key: "structure", label: "Structure", width: "w-32" },
        { key: "location", label: "Location", width: "w-28" },
        { key: "concrete_type", label: "Type of Concrete", width: "w-24" },
        { key: "max_load", label: "Max Load (KN)", width: "w-20" },
        { key: "strength_7", label: "7 Days (N/mm²)", width: "w-20" },
        { key: "strength_28", label: "28 Days (N/mm²)", width: "w-20" },
        { key: "average", label: "Average", width: "w-16" },
        { key: "remarks", label: "Remarks", width: "w-24" },
      ];
    case "Marshall Stability":
    case "Hot Mix Design":
      return [
        { key: "sample_no", label: "Sample No", width: "w-20" },
        { key: "test_date", label: "Date", width: "w-24" },
        { key: "specimen_height", label: "Height (mm)", width: "w-20" },
        { key: "bulk_density", label: "Bulk Density", width: "w-20" },
        { key: "air_voids", label: "Air Voids (%)", width: "w-20" },
        { key: "vma", label: "VMA (%)", width: "w-16" },
        { key: "vfa", label: "VFA (%)", width: "w-16" },
        { key: "stability", label: "Stability (kN)", width: "w-20" },
        { key: "flow", label: "Flow (mm)", width: "w-16" },
        { key: "compliance", label: "App/Not", width: "w-16" },
        { key: "remarks", label: "Remarks", width: "w-24" },
      ];
    case "Sieve Analysis":
      return [
        { key: "test_date", label: "Date of Test", width: "w-24" },
        { key: "report_number", label: "Test Report No", width: "w-28" },
        { key: "sample_id", label: "Sample ID", width: "w-24" },
        { key: "material_type", label: "Material Type", width: "w-24" },
        { key: "fineness_modulus", label: "Fineness Modulus", width: "w-24" },
        { key: "compliance", label: "App/Not", width: "w-16" },
        { key: "remarks", label: "Remarks", width: "w-24" },
      ];
    case "CBR":
      return [
        { key: "test_date", label: "Date of Test", width: "w-24" },
        { key: "report_number", label: "Test Report No", width: "w-28" },
        { key: "sample_id", label: "Sample ID", width: "w-24" },
        { key: "cbr_value", label: "CBR Value (%)", width: "w-24" },
        { key: "swell", label: "Swell (%)", width: "w-20" },
        { key: "compliance", label: "App/Not", width: "w-16" },
        { key: "remarks", label: "Remarks", width: "w-24" },
      ];
    case "Proctor Compaction":
      return [
        { key: "test_date", label: "Date of Test", width: "w-24" },
        { key: "report_number", label: "Test Report No", width: "w-28" },
        { key: "sample_id", label: "Sample ID", width: "w-24" },
        { key: "max_dry_density", label: "MDD (g/cm³)", width: "w-24" },
        { key: "optimum_moisture", label: "OMC (%)", width: "w-20" },
        { key: "compliance", label: "App/Not", width: "w-16" },
        { key: "remarks", label: "Remarks", width: "w-24" },
      ];
    case "Atterberg Limits":
      return [
        { key: "test_date", label: "Date of Test", width: "w-24" },
        { key: "report_number", label: "Test Report No", width: "w-28" },
        { key: "sample_id", label: "Sample ID", width: "w-24" },
        { key: "liquid_limit", label: "LL (%)", width: "w-16" },
        { key: "plastic_limit", label: "PL (%)", width: "w-16" },
        { key: "plasticity_index", label: "PI (%)", width: "w-16" },
        { key: "compliance", label: "App/Not", width: "w-16" },
        { key: "remarks", label: "Remarks", width: "w-24" },
      ];
    default:
      return [
        { key: "test_date", label: "Date of Test", width: "w-24" },
        { key: "report_number", label: "Test Report No", width: "w-28" },
        { key: "road_name", label: "Road Name", width: "w-24" },
        { key: "covered_chainage", label: "Chainage", width: "w-24" },
        { key: "side", label: "Side", width: "w-14" },
        { key: "technician_name", label: "Technician", width: "w-24" },
        { key: "compliance", label: "App/Not", width: "w-16" },
        { key: "remarks", label: "Remarks", width: "w-24" },
      ];
  }
};

const getCellValue = (report: TestReport, key: string): string => {
  const dataJson = report.data_json || {};
  const summaryJson = report.summary_json || {};

  switch (key) {
    case "test_date":
      return report.test_date ? format(new Date(report.test_date), "dd.MM.yyyy") : "-";
    case "report_number":
      return report.report_number || "-";
    case "covered_chainage":
      return report.covered_chainage || 
        (report.chainage_from && report.chainage_to 
          ? `${report.chainage_from}-${report.chainage_to}` 
          : "-");
    case "test_location":
      return dataJson.test_location || "-";
    case "layer_no":
      return dataJson.layer_no || dataJson.layer || "TOP";
    case "depth_mm":
      return dataJson.depth_mm || "-";
    case "side":
      return (report.side || dataJson.side || "-").toUpperCase();
    case "offset_m":
      return dataJson.offset_m || "-";
    case "hole_depth_mm":
      return dataJson.hole_depth_mm || "-";
    case "moisture_content":
      return summaryJson.field_moisture?.toFixed(1) || dataJson.moisture_content_percent || "-";
    case "field_dry_density":
      return summaryJson.field_dry_density?.toFixed(3) || dataJson.dry_density_g_cm3 || "-";
    case "optimum_moisture":
      return summaryJson.optimum_moisture?.toFixed(1) || dataJson.optimum_moisture_percent || "-";
    case "max_dry_density":
      return summaryJson.max_dry_density?.toFixed(3) || dataJson.max_dry_density_g_cm3 || "-";
    case "laboratory_sample_no":
      return report.laboratory_test_no || dataJson.proctor_report_no || "-";
    case "compaction":
      const compaction = summaryJson.degree_of_compaction || dataJson.degree_of_compaction_actual;
      return compaction ? parseFloat(compaction).toFixed(1) : "-";
    case "compliance":
      const status = report.compliance_status || dataJson.compliance_status;
      if (status === "pass" || status === "PASS") return "APP";
      if (status === "fail" || status === "FAIL") return "NOT";
      return "-";
    case "remarks":
      return dataJson.remarks || dataJson.notes || report.status === "rejected" ? "RETEST" : "";
    case "road_name":
      return report.road_name || "-";
    case "technician_name":
      return report.technician_name || "-";
    // Concrete specific
    case "sample_no":
      return dataJson.sample_no || report.report_number || "-";
    case "date_of_cast":
      return dataJson.date_of_cast ? format(new Date(dataJson.date_of_cast), "dd.MM.yyyy") : "-";
    case "agg_days":
      return dataJson.age_days || dataJson.curing_days || "-";
    case "structure":
      return dataJson.structure || dataJson.structure_type || "-";
    case "location":
      return dataJson.location || report.road_name || "-";
    case "concrete_type":
      return dataJson.concrete_type || dataJson.mix_grade || "-";
    case "max_load":
      return dataJson.max_load_kn?.toFixed(1) || dataJson.crushing_load || "-";
    case "strength_7":
      return dataJson.strength_7_days?.toFixed(1) || "-";
    case "strength_28":
      return dataJson.strength_28_days?.toFixed(1) || dataJson.compressive_strength || "-";
    case "average":
      return dataJson.average_strength?.toFixed(1) || "-";
    // Marshall/Asphalt specific
    case "specimen_height":
      return dataJson.specimen_height?.toFixed(1) || "-";
    case "bulk_density":
      return dataJson.bulk_density?.toFixed(3) || "-";
    case "air_voids":
      return dataJson.air_voids?.toFixed(1) || "-";
    case "vma":
      return dataJson.vma?.toFixed(1) || "-";
    case "vfa":
      return dataJson.vfa?.toFixed(1) || "-";
    case "stability":
      return dataJson.stability_kn?.toFixed(1) || dataJson.stability || "-";
    case "flow":
      return dataJson.flow_mm?.toFixed(2) || dataJson.flow || "-";
    // Other tests
    case "sample_id":
      return dataJson.sample_id || report.report_number || "-";
    case "material_type":
      return dataJson.material_type || "-";
    case "fineness_modulus":
      return dataJson.fineness_modulus?.toFixed(2) || "-";
    case "cbr_value":
      return dataJson.cbr_value?.toFixed(1) || "-";
    case "swell":
      return dataJson.swell_percent?.toFixed(2) || "-";
    case "liquid_limit":
      return dataJson.liquid_limit?.toFixed(1) || "-";
    case "plastic_limit":
      return dataJson.plastic_limit?.toFixed(1) || "-";
    case "plasticity_index":
      return dataJson.plasticity_index?.toFixed(1) || "-";
    default:
      return dataJson[key] || "-";
  }
};

export default function TestTypeSummaryTable({
  testType,
  reports,
  projectName,
}: TestTypeSummaryTableProps) {
  const columns = getColumnsForTestType(testType);

  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No {testType} reports found for this period
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{testType} Summary</h3>
        <Badge variant="secondary">{reports.length} reports</Badge>
      </div>
      
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((col) => (
                <TableHead 
                  key={col.key} 
                  className={`${col.width} text-xs font-semibold whitespace-nowrap`}
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report, idx) => (
              <TableRow 
                key={report.id} 
                className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}
              >
                {columns.map((col) => (
                  <TableCell 
                    key={col.key} 
                    className="text-xs py-2 whitespace-nowrap"
                  >
                    {col.key === "compliance" ? (
                      <Badge
                        variant={
                          getCellValue(report, col.key) === "APP"
                            ? "default"
                            : getCellValue(report, col.key) === "NOT"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-[10px] px-1.5"
                      >
                        {getCellValue(report, col.key)}
                      </Badge>
                    ) : (
                      getCellValue(report, col.key)
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export { getColumnsForTestType, getCellValue };
export type { TestReport };
