import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NewTestReportWizard } from "./NewTestReportWizard";

interface CreateTestReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingReportId?: string;
}

export function CreateTestReportDialog({
  open,
  onOpenChange,
  existingReportId,
}: CreateTestReportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingReportId ? "Edit Test Report" : "Create Test Report"}
          </DialogTitle>
          <DialogDescription>
            {existingReportId
              ? "Continue editing your test report from where you left off"
              : "Follow the step-by-step wizard to create a comprehensive test report"}
          </DialogDescription>
        </DialogHeader>
        <div className="p-4">
          <NewTestReportWizard
            onClose={() => onOpenChange(false)}
            existingReportId={existingReportId}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
