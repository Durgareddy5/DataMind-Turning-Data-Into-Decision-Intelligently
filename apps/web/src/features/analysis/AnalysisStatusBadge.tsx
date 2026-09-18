import { CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import { Badge } from "../../components/ui/Badge.js";
import type { AnalysisStatus, TerminationReason } from "../../types/api.js";

export function AnalysisStatusBadge({ status, terminationReason }: { status: AnalysisStatus; terminationReason?: TerminationReason }) {
  if (status === "pending") {
    return (
      <Badge tone="neutral">
        <Loader2 size={12} className="spin" /> Running
      </Badge>
    );
  }

  if (status === "failed") {
    return (
      <Badge tone="critical">
        <CircleAlert size={12} /> Failed
      </Badge>
    );
  }

  if (terminationReason === "max_tool_calls_exceeded") {
    return (
      <Badge tone="warning">
        <CircleAlert size={12} /> Incomplete
      </Badge>
    );
  }
  if (terminationReason === "repeated_failures") {
    return (
      <Badge tone="serious">
        <CircleAlert size={12} /> Stopped after errors
      </Badge>
    );
  }

  return (
    <Badge tone="good">
      <CheckCircle2 size={12} /> Complete
    </Badge>
  );
}
