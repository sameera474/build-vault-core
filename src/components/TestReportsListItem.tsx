import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  MoreVertical,
  Send,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

interface PassFailProps {
  status?: string;
  value?: number;
}

function PassFail({ status, value }: PassFailProps) {
  if (status === "pass") {
    return (
      <Badge className="bg-green-500 hover:bg-green-600">
        <CheckCircle className="h-3 w-3 mr-1" />
        PASS
      </Badge>
    );
  }
  if (status === "fail") {
    return (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        FAIL
      </Badge>
    );
  }
  return (
    <Badge variant="outline">
      <Clock className="h-3 w-3 mr-1" />
      PENDING
    </Badge>
  );
}

interface TestReportsListItemProps {
  r: any;
  onOpen: () => void;
  onDelete?: () => void;
  onSubmitForApproval?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  canApprove?: boolean;
}

export function TestReportsListItem({
  r,
  onOpen,
  onDelete,
  onSubmitForApproval,
  onApprove,
  onReject,
  canApprove = false,
}: TestReportsListItemProps) {
  const getPrimaryKpi = () => {
    // First check summary_json for KPIs
    const kpis = r.summary_json?.kpis;
    if (kpis && typeof kpis === "object" && Object.keys(kpis).length > 0) {
      const primaryKey =
        Object.keys(kpis).find(
          (k) =>
            k.toLowerCase().includes("strength") ||
            k.toLowerCase().includes("density") ||
            k.toLowerCase().includes("compaction") ||
            k.toLowerCase().includes("cbr") ||
            k.toLowerCase().includes("stability")
        ) || Object.keys(kpis)[0];

      const value = kpis[primaryKey];
      const name = primaryKey
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      return {
        name,
        value: typeof value === "number" ? value.toFixed(2) : (value || "—"),
      };
    }

    // Fallback to data_json if summary_json is not available
    if (r.data_json && typeof r.data_json === "object") {
      // Look for common result fields in data_json
      const commonFields = [
        "result", "value", "strength", "density", "compaction", 
        "cbr_value", "stability", "average", "final_value"
      ];
      
      for (const field of commonFields) {
        if (r.data_json[field] !== undefined && r.data_json[field] !== null) {
          return {
            name: field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            value: typeof r.data_json[field] === "number" 
              ? r.data_json[field].toFixed(2) 
              : r.data_json[field]
          };
        }
      }
    }

    return { name: "Result", value: "Pending" };
  };

  const primaryKpi = getPrimaryKpi();

  const isDraft = (r.status || "draft") === "draft";

  return (
    <div className="border rounded-lg p-4 hover:bg-muted/40 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 cursor-pointer" onClick={onOpen}>
          <div className="text-sm font-mono font-semibold">
            {r.report_number || r.id}
          </div>
          <div className="text-lg font-semibold leading-tight">
            {r.project?.name || r.project_name || "—"}
          </div>
          <div className="text-xs text-muted-foreground">
            {r.project?.region_code || r.region_code || "R?"} •{" "}
            {r.chainage_from || "—"} - {r.chainage_to || "—"}
          </div>
        </div>
        <div className="text-right space-y-1">
          <Badge variant="secondary">
            {(r.status || "draft").toUpperCase()}
          </Badge>
          <div>
            <PassFail status={r.compliance_status} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="mt-2 h-7 w-7 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onOpen}>
                <Edit className="h-4 w-4 mr-2" />
                {isDraft ? "Edit Draft" : "View/Edit"}
              </DropdownMenuItem>
              {isDraft && onSubmitForApproval && (
                <DropdownMenuItem onClick={onSubmitForApproval} className="text-primary">
                  <Send className="h-4 w-4 mr-2" />
                  Submit for Approval
                </DropdownMenuItem>
              )}
              {r.status === "submitted" && canApprove && onApprove && (
                <DropdownMenuItem onClick={onApprove} className="text-green-600">
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Approve
                </DropdownMenuItem>
              )}
              {r.status === "submitted" && canApprove && onReject && (
                <DropdownMenuItem onClick={onReject} className="text-destructive">
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Reject
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3 text-sm">
        <div>
          <span className="text-muted-foreground">Material:</span>{" "}
          {r.material || "—"}
        </div>
        <div>
          <span className="text-muted-foreground">Test Type:</span>{" "}
          {r.test_type || "—"}
        </div>
        <div>
          <span className="text-muted-foreground">Side:</span> {r.side || "—"}
        </div>
        <div>
          <span className="text-muted-foreground">Date:</span>{" "}
          {r.test_date ? new Date(r.test_date).toLocaleDateString() : "—"}
        </div>
        <div>
          <span className="text-muted-foreground">{primaryKpi.name}:</span>{" "}
          {primaryKpi.value}
        </div>
        <div>
          <span className="text-muted-foreground">Technician:</span>{" "}
          {r.technician_name || "—"}
        </div>
        {(r.status === "approved" || r.status === "rejected") && (
          <>
            <div>
              <span className="text-muted-foreground">
                {r.status === "approved" ? "Approved By" : "Rejected By"}:
              </span>{" "}
              {r.approver?.name || "System"}
            </div>
            {r.approved_at && (
              <div>
                <span className="text-muted-foreground">
                  {r.status === "approved" ? "Approved" : "Rejected"} Date:
                </span>{" "}
                {new Date(r.approved_at).toLocaleDateString()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
