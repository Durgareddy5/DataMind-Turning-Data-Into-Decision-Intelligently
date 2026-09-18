import { Spinner } from "../../components/ui/Spinner.js";
import { ErrorState } from "../../components/ui/ErrorState.js";
import { AnalysisStatusBadge } from "./AnalysisStatusBadge.js";
import { SqlViewer } from "./SqlViewer.js";
import { ResultTable } from "./ResultTable.js";
import { EvidencePanel } from "./EvidencePanel.js";
import { ChartPanel } from "../charts/ChartPanel.js";
import { getChartSpec, getQueryResult } from "../../utils/steps.js";
import { formatDuration } from "../../utils/formatting.js";
import type { AnalysisJob } from "../../types/api.js";

export function AnalysisResultPanel({ job, onRetry }: { job: AnalysisJob; onRetry?: () => void }) {
  if (job.status === "pending") {
    return (
      <div className="analysis-panel analysis-panel-pending">
        <Spinner label="Analyzing…" />
      </div>
    );
  }

  if (job.status === "failed") {
    return (
      <div className="analysis-panel">
        <ErrorState message={job.error ?? "Analysis failed for an unknown reason."} onRetry={onRetry} />
      </div>
    );
  }

  const result = job.result;
  if (!result) return null;

  const queryResult = getQueryResult(result.steps);
  const chartSpec = getChartSpec(result.steps);

  return (
    <div className="analysis-panel">
      <div className="analysis-panel-meta">
        <AnalysisStatusBadge status={job.status} terminationReason={result.terminationReason} />
        <span className="analysis-panel-meta-item">{result.toolCallCount} tool call{result.toolCallCount === 1 ? "" : "s"}</span>
        <span className="analysis-panel-meta-item">{formatDuration(result.geminiLatencyMs)}</span>
        <span className="analysis-panel-meta-item">{result.tokenUsage.totalTokens.toLocaleString()} tokens</span>
      </div>

      {result.terminationReason !== "final_response" && (
        <ErrorState
          message={
            result.terminationReason === "max_tool_calls_exceeded"
              ? "Stopped early — this question needed more steps than allowed. Try narrowing it."
              : "Stopped after repeated tool errors. Try rephrasing the question."
          }
          onRetry={onRetry}
        />
      )}

      {queryResult && <SqlViewer sql={queryResult.sql} />}
      {queryResult && <ResultTable result={queryResult} />}
      {chartSpec && <ChartPanel spec={chartSpec} />}
      <EvidencePanel steps={result.steps} />
    </div>
  );
}
