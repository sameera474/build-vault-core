import React from "react";
import { format } from "date-fns";

interface SummaryHeaderProps {
  projectName: string;
  contractNumber?: string;
  clientName?: string;
  consultantName?: string;
  contractorName?: string;
  roadName?: string;
  testType?: string;
  month?: string;
  year?: string;
  dateRange?: { from: Date; to: Date };
  clientLogo?: string;
  contractorLogo?: string;
}

export default function SummaryHeader({
  projectName,
  contractNumber,
  clientName,
  consultantName,
  contractorName,
  roadName,
  testType,
  month,
  year,
  dateRange,
  clientLogo,
  contractorLogo,
}: SummaryHeaderProps) {
  const getMonthName = (m: string) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[parseInt(m) - 1] || m;
  };

  const periodDisplay = dateRange
    ? `${format(dateRange.from, "MMMM yyyy")} - ${format(dateRange.to, "MMMM yyyy")}`
    : month && year
    ? `${getMonthName(month)} ${year}`
    : "";

  return (
    <div className="bg-muted/30 border rounded-lg p-6 mb-6 print:bg-white">
      {/* Header with logos */}
      <div className="flex justify-between items-start mb-4">
        {/* Client logo placeholder */}
        <div className="w-24 h-16 border border-dashed rounded flex items-center justify-center text-xs text-muted-foreground">
          {clientLogo ? (
            <img src={clientLogo} alt="Client Logo" className="max-h-full max-w-full object-contain" />
          ) : (
            "Client Logo"
          )}
        </div>

        {/* Project title */}
        <div className="text-center flex-1 px-4">
          <h2 className="text-lg font-bold uppercase">{clientName || "Client Name"}</h2>
          <h3 className="text-md font-semibold">{projectName}</h3>
          {contractNumber && (
            <p className="text-sm text-muted-foreground">
              Contract No: {contractNumber}
            </p>
          )}
        </div>

        {/* Contractor logo placeholder */}
        <div className="w-24 h-16 border border-dashed rounded flex items-center justify-center text-xs text-muted-foreground">
          {contractorLogo ? (
            <img src={contractorLogo} alt="Contractor Logo" className="max-h-full max-w-full object-contain" />
          ) : (
            "Contractor Logo"
          )}
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-3 gap-4 text-sm border-t pt-4">
        <div>
          <span className="text-muted-foreground">CLIENT:</span>
          <p className="font-medium">{clientName || "-"}</p>
        </div>
        <div className="text-center">
          <span className="text-muted-foreground">ENGINEER:</span>
          <p className="font-medium">{consultantName || "-"}</p>
        </div>
        <div className="text-right">
          <span className="text-muted-foreground">CONTRACTOR:</span>
          <p className="font-medium">{contractorName || "-"}</p>
        </div>
      </div>

      {/* Summary title */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-primary">
              {testType ? `${testType} Summary` : "Monthly Test Summary"}
              {roadName && roadName !== "all" && ` - ${roadName}`}
            </h3>
          </div>
          <div className="text-right">
            <span className="text-sm text-muted-foreground">Period: </span>
            <span className="font-semibold">{periodDisplay}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
