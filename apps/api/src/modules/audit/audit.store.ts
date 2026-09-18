import type { GeminiTokenUsage } from "@ai-data-analyst/ai-core";

export interface AuditToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface AuditEntry {
  analysisRunId: string;
  userId: string;
  roles: string[];
  sessionId: string;
  question: string;
  requestLatencyMs: number;
  geminiLatencyMs: number;
  toolCalls: AuditToolCall[];
  failedTools: string[];
  toolCallCount: number;
  geminiCallCount: number;
  tokenUsage: GeminiTokenUsage;
  totalRowsReturned: number;
  finalResponse: string | null;
  outcome: string;
  error?: string;
  createdAt: string;
}

// In-memory placeholder — same pattern as conversations.store.ts/
// analyst.service.ts's job store. Swap for real persistence (a table this
// backend can write to, distinct from the read-only business DB user)
// before this needs to survive a restart or be queried across instances.
const entriesByAnalysisRunId = new Map<string, AuditEntry>();

export function recordAuditEntry(entry: AuditEntry): void {
  entriesByAnalysisRunId.set(entry.analysisRunId, entry);
}

export function getAuditEntry(analysisRunId: string): AuditEntry | undefined {
  return entriesByAnalysisRunId.get(analysisRunId);
}
