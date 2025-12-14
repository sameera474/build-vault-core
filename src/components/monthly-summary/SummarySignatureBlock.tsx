import React from "react";

interface SignatureRole {
  title: string;
  name?: string;
  designation?: string;
}

interface SummarySignatureBlockProps {
  contractorRoles?: SignatureRole[];
  engineerRoles?: SignatureRole[];
}

export default function SummarySignatureBlock({
  contractorRoles = [
    { title: "Prepared By" },
    { title: "Checked By" },
    { title: "Approved By" },
  ],
  engineerRoles = [
    { title: "Checked By" },
    { title: "Reviewed By" },
  ],
}: SummarySignatureBlockProps) {
  return (
    <div className="mt-8 border-t pt-6">
      <div className="grid grid-cols-2 gap-8">
        {/* Contractor Section */}
        <div>
          <h4 className="text-sm font-semibold text-center border-b pb-2 mb-4">
            Contractor
          </h4>
          <div className="grid grid-cols-3 gap-4">
            {contractorRoles.map((role, idx) => (
              <div key={idx} className="text-center space-y-8">
                <p className="text-xs text-muted-foreground">{role.title}</p>
                <div className="border-b border-dashed h-8" />
                <p className="text-xs font-medium mt-1">Signature</p>
                <div className="border-b border-dashed h-6" />
                <p className="text-xs mt-1">Name</p>
                <div className="border-b border-dashed h-6" />
                <p className="text-xs mt-1">Designation</p>
                <div className="border-b border-dashed h-6" />
                <p className="text-xs mt-1">Date</p>
              </div>
            ))}
          </div>
        </div>

        {/* Engineer Section */}
        <div>
          <h4 className="text-sm font-semibold text-center border-b pb-2 mb-4">
            Engineer
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {engineerRoles.map((role, idx) => (
              <div key={idx} className="text-center space-y-8">
                <p className="text-xs text-muted-foreground">{role.title}</p>
                <div className="border-b border-dashed h-8" />
                <p className="text-xs font-medium mt-1">Signature</p>
                <div className="border-b border-dashed h-6" />
                <p className="text-xs mt-1">Name</p>
                <div className="border-b border-dashed h-6" />
                <p className="text-xs mt-1">Designation</p>
                <div className="border-b border-dashed h-6" />
                <p className="text-xs mt-1">Date</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
