import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NewTestReportWizard } from './NewTestReportWizard';

interface CreateTestReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTestReportDialog({ open, onOpenChange }: CreateTestReportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Test Report</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <NewTestReportWizard onClose={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}