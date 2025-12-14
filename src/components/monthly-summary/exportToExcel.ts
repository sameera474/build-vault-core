import * as XLSX from "xlsx";
import { format } from "date-fns";
import { getColumnsForTestType, getCellValue, type TestReport } from "./TestTypeSummaryTable";

interface Project {
  name: string;
  contract_number?: string;
  client_name?: string;
  consultant_name?: string;
  contractor_name?: string;
}

interface ExportOptions {
  project: Project;
  dateRange: { from: Date; to: Date };
  roadName?: string;
  material?: string;
  reportsByTestType: Record<string, TestReport[]>;
}

export function exportToExcel({
  project,
  dateRange,
  roadName,
  material,
  reportsByTestType,
}: ExportOptions) {
  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ["MONTHLY TEST SUMMARY REPORT"],
    [],
    ["Project Name:", project.name],
    ["Contract Number:", project.contract_number || "N/A"],
    ["Client:", project.client_name || "N/A"],
    ["Consultant:", project.consultant_name || "N/A"],
    ["Contractor:", project.contractor_name || "N/A"],
    [],
    ["Period:", `${format(dateRange.from, "dd MMM yyyy")} - ${format(dateRange.to, "dd MMM yyyy")}`],
    ["Road:", roadName && roadName !== "all" ? roadName : "All Roads"],
    ["Material:", material && material !== "all" ? material.charAt(0).toUpperCase() + material.slice(1) : "All Materials"],
    [],
    ["TEST TYPE SUMMARY"],
    ["Test Type", "Total Reports", "Approved", "Pending", "Failed"],
  ];

  let totalReports = 0;
  let totalApproved = 0;
  let totalPending = 0;
  let totalFailed = 0;

  Object.entries(reportsByTestType).forEach(([testType, reports]) => {
    const approved = reports.filter((r) => r.status === "approved").length;
    const pending = reports.filter((r) => r.status === "draft" || r.status === "submitted").length;
    const failed = reports.filter((r) => r.compliance_status === "fail").length;
    
    summaryData.push([testType, String(reports.length), String(approved), String(pending), String(failed)]);
    
    totalReports += reports.length;
    totalApproved += approved;
    totalPending += pending;
    totalFailed += failed;
  });

  summaryData.push([]);
  summaryData.push(["TOTAL", String(totalReports), String(totalApproved), String(totalPending), String(totalFailed)]);

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Set column widths
  summarySheet["!cols"] = [
    { wch: 30 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  // Create a sheet for each test type
  Object.entries(reportsByTestType).forEach(([testType, reports]) => {
    if (reports.length === 0) return;

    const columns = getColumnsForTestType(testType);
    
    // Header rows
    const sheetData: any[][] = [
      [`${testType} Summary - ${project.name}`],
      [`Period: ${format(dateRange.from, "dd MMM yyyy")} - ${format(dateRange.to, "dd MMM yyyy")}`],
      [],
      columns.map((col) => col.label),
    ];

    // Data rows
    reports.forEach((report) => {
      const row = columns.map((col) => getCellValue(report, col.key));
      sheetData.push(row);
    });

    // Signature section
    sheetData.push([]);
    sheetData.push([]);
    sheetData.push(["CONTRACTOR", "", "", "", "ENGINEER"]);
    sheetData.push(["Prepared By", "Checked By", "Approved By", "", "Checked By", "Reviewed By"]);
    sheetData.push([]);
    sheetData.push(["Signature:", "", "", "", "Signature:", ""]);
    sheetData.push(["Name:", "", "", "", "Name:", ""]);
    sheetData.push(["Designation:", "", "", "", "Designation:", ""]);
    sheetData.push(["Date:", "", "", "", "Date:", ""]);

    const sheet = XLSX.utils.aoa_to_sheet(sheetData);
    
    // Set column widths
    sheet["!cols"] = columns.map(() => ({ wch: 15 }));

    // Truncate sheet name to 31 characters (Excel limit)
    const sheetName = testType.substring(0, 31);
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  });

  // Generate filename
  const fileName = `Monthly_Summary_${project.name.replace(/[^a-z0-9]/gi, "_")}_${format(dateRange.from, "yyyy-MM")}.xlsx`;

  // Download file
  XLSX.writeFile(workbook, fileName);

  return fileName;
}
