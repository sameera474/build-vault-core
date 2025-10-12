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
}

export function TestReportsListItem({
  r,
  onOpen,
  onDelete,
}: TestReportsListItemProps) {
  const getPrimaryKpi = () => {
    const kpis = r.summary_json?.kpis;
    if (!kpis || typeof kpis !== "object" || Object.keys(kpis).length === 0) {
      return { name: "Result", value: "—" };
    }

    const primaryKey =
      Object.keys(kpis).find(
        (k) =>
          k.toLowerCase().includes("strength") ||
          k.toLowerCase().includes("density") ||
          k.toLowerCase().includes("compaction")
      ) || Object.keys(kpis)[0];

    const value = kpis[primaryKey];
    const name = primaryKey
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
    return {
      name,
      value: typeof value === "number" ? value.toFixed(2) : value || "—",
    };
  };

  const primaryKpi = getPrimaryKpi();

  const isDraft = (r.status || "draft") === "draft";

  return (
  return (  
    <div className="border rounded-lg p-4 hover:bg-muted/40 transition-colors">
      <div className="flex items-start justify-between">
        <div
          className="flex-1"
          onClick={onOpen}
          style={{ cursor: isDraft ? "default" : "pointer" }}
        >
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
          {isDraft && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="mt-2">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onOpen}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
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
              {onDelete && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
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
          )}
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
      </div>
    </div>
  );
}
