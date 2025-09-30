import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface PassFailProps {
  status?: string;
  value?: number;
}

function PassFail({ status, value }: PassFailProps) {
  if (status === 'pass') {
    return (
      <Badge className="bg-green-500 hover:bg-green-600">
        <CheckCircle className="h-3 w-3 mr-1" />
        PASS
      </Badge>
    );
  }
  if (status === 'fail') {
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
}

export function TestReportsListItem({ r, onOpen }: TestReportsListItemProps) {
  const compaction = r.summary_json?.kpis?.degree_compaction;
  
  return (
    <div onClick={onOpen} className="cursor-pointer border rounded-lg p-4 hover:bg-muted/40 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-mono font-semibold">{r.report_number || r.id}</div>
          <div className="text-lg font-semibold leading-tight">{r.project?.name || r.project_name || '—'}</div>
          <div className="text-xs text-muted-foreground">
            {(r.project?.region_code || r.region_code || 'R?')} • {r.chainage_from || '—'} - {r.chainage_to || '—'}
          </div>
        </div>
        <div className="text-right space-y-1">
          <Badge variant="secondary">{(r.status || 'draft').toUpperCase()}</Badge>
          <div><PassFail status={r.compliance_status} /></div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3 text-sm">
        <div>
          <span className="text-muted-foreground">Material:</span> {r.material || '—'}
        </div>
        <div>
          <span className="text-muted-foreground">Test Type:</span> {r.test_type || '—'}
        </div>
        <div>
          <span className="text-muted-foreground">Side:</span> {r.side || '—'}
        </div>
        <div>
          <span className="text-muted-foreground">Date:</span> {r.test_date ? new Date(r.test_date).toLocaleDateString() : '—'}
        </div>
        <div>
          <span className="text-muted-foreground">Compaction:</span>{' '}
          {typeof compaction === 'number' ? `${compaction.toFixed(1)}%` : '—'}
        </div>
        <div>
          <span className="text-muted-foreground">Technician:</span> {r.technician_name || '—'}
        </div>
      </div>
    </div>
  );
}