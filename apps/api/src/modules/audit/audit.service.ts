import type { AuthUser } from "@ai-data-analyst/shared-types";
import type { OrchestrationStep } from "@ai-data-analyst/agent-core";
import type { GeminiTokenUsage } from "@ai-data-analyst/ai-core";
import { log } from "../../config/logger.js";
import { getAuditEntry, recordAuditEntry, type AuditEntry } from "./audit.store.js";
import { ForbiddenError, NotFoundError } from "../../shared/errors/AppError.js";
import { ADMIN_ROLE } from "../../config/columnAccess.js";

// Deliberately excludes tool_result row data — only which tools ran, with
// what SQL/args, timing, token usage, and whether each succeeded. Per-query
// SQL/validation/DB-time/row-count detail lives in the sql_executed/
// sql_validated logs (tools/sql/*.ts), tied together by analysisRunId.
export function logAnalysisRun(params: {
  analysisRunId: string;
  user: AuthUser;
  sessionId: string;
  question: string;
  steps: OrchestrationStep[];
  toolCallCount: number;
  geminiCallCount: number;
  requestLatencyMs: number;
  geminiLatencyMs: number;
  tokenUsage: GeminiTokenUsage;
  finalResponse: string | null;
  terminationReason: string;
  error?: string;
}): void {
  const toolCalls = params.steps
    .filter((step): step is Extract<OrchestrationStep, { type: "tool_call" }> => step.type === "tool_call")
    .map((step) => ({ name: step.name, args: step.args }));

  const failedTools = params.steps
    .filter((step): step is Extract<OrchestrationStep, { type: "tool_error" }> => step.type === "tool_error")
    .map((step) => step.name);

  const totalRowsReturned = params.steps
    .filter(
      (step): step is Extract<OrchestrationStep, { type: "tool_result" }> =>
        step.type === "tool_result" && step.name === "execute_read_only_sql"
    )
    .reduce((sum, step) => sum + ((step.result as { rows?: unknown[] } | undefined)?.rows?.length ?? 0), 0);

  const entry: AuditEntry = {
    analysisRunId: params.analysisRunId,
    userId: params.user.id,
    roles: params.user.roles,
    sessionId: params.sessionId,
    question: params.question,
    requestLatencyMs: params.requestLatencyMs,
    geminiLatencyMs: params.geminiLatencyMs,
    toolCalls,
    failedTools,
    toolCallCount: params.toolCallCount,
    geminiCallCount: params.geminiCallCount,
    tokenUsage: params.tokenUsage,
    totalRowsReturned,
    finalResponse: params.finalResponse,
    outcome: params.terminationReason,
    createdAt: new Date().toISOString(),
    ...(params.error ? { error: params.error } : {}),
  };

  recordAuditEntry(entry);
  log(params.error ? "error" : "info", "analysis_run", { ...entry });
}

export function getAuditTrail(analysisRunId: string, requestingUser: AuthUser): AuditEntry {
  const entry = getAuditEntry(analysisRunId);
  if (!entry) throw new NotFoundError(`No audit trail for analysis "${analysisRunId}"`);
  const isOwner = entry.userId === requestingUser.id;
  const isAdmin = requestingUser.roles.includes(ADMIN_ROLE);
  if (!isOwner && !isAdmin) throw new ForbiddenError("Not your analysis");
  return entry;
}
