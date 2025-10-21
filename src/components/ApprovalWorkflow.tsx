import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock, FileText, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface TestReport {
  id: string;
  report_number: string;
  test_type: string;
  test_date: string;
  compliance_status: string;
  technician_name: string;
  material_type: string;
  notes: string;
  created_at: string;
}

interface ApprovalWorkflowProps {
  reports: TestReport[];
  onApprovalUpdate: () => void;
}

export function ApprovalWorkflow({
  reports,
  onApprovalUpdate,
}: ApprovalWorkflowProps) {
  const [selectedReport, setSelectedReport] = useState<TestReport | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const pendingReports = reports.filter(
    (report) => report.compliance_status === "pending"
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        );
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const handleApproval = async (
    reportId: string,
    newStatus: "approved" | "rejected"
  ) => {
    if (!profile) {
      toast({
        title: "Error",
        description: "You must be logged in to approve reports",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // On approval, the main status is 'approved' or 'rejected'.
      // The compliance_status should reflect the test outcome ('pass' or 'fail').
      // If the report is being approved, we assume it passed. If rejected, it failed.
      const updateData: any = {
        status: newStatus,
        compliance_status: newStatus === "approved" ? "pass" : "fail",
        approved_by: profile?.name || profile?.email,
        updated_at: new Date().toISOString(),
      };

      if (approvalNotes.trim()) {
        updateData.notes = approvalNotes.trim();
      }

      const { error } = await supabase
        .from("test_reports")
        .update(updateData)
        .eq("id", reportId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Report ${newStatus} successfully`,
      });

      setSelectedReport(null);
      setApprovalNotes("");
      onApprovalUpdate();
    } catch (error) {
      console.error("Error updating approval status:", error);
      toast({
        title: "Error",
        description: "Failed to update approval status",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Approval Workflow
          </CardTitle>
          <CardDescription>
            Review and approve pending test reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingReports.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No reports pending approval
              </p>
            ) : (
              pendingReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(report.compliance_status)}
                    <div>
                      <p className="font-medium">{report.report_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {report.test_type} •{" "}
                        {new Date(report.test_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(report.compliance_status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {selectedReport && (
        <Card>
          <CardHeader>
            <CardTitle>Review Report: {selectedReport.report_number}</CardTitle>
            <CardDescription>
              Submitted on{" "}
              {new Date(selectedReport.created_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Test Type</label>
                <p className="text-sm text-muted-foreground">
                  {selectedReport.test_type}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Test Date</label>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedReport.test_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Technician</label>
                <p className="text-sm text-muted-foreground">
                  {selectedReport.technician_name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Material Type</label>
                <p className="text-sm text-muted-foreground">
                  {selectedReport.material_type}
                </p>
              </div>
            </div>

            {selectedReport.notes && (
              <div>
                <label className="text-sm font-medium">Current Notes</label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedReport.notes}
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Approval Notes</label>
              <Textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add notes for this approval decision..."
                className="mt-1"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() =>
                  navigate(`/test-reports/${selectedReport.id}/edit`)
                }
              >
                <Eye className="h-4 w-4 mr-2" />
                View Full Report
              </Button>
              <Button
                onClick={() => handleApproval(selectedReport.id, "approved")}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleApproval(selectedReport.id, "rejected")}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedReport(null);
                  setApprovalNotes("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
