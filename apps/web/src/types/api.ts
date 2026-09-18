export interface AuthUser {
  id: string;
  roles: string[];
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface QueryResult {
  sql: string;
  columns: string[];
  rows: unknown[][];
}

export type OrchestrationStep =
  | { type: "tool_call"; name: string; args: Record<string, unknown> }
  | { type: "tool_result"; name: string; result: unknown }
  | { type: "tool_error"; name: string; error: string };

export type TerminationReason = "final_response" | "max_tool_calls_exceeded" | "repeated_failures";

export interface TokenUsage {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
}

export interface OrchestrationResult {
  answer: string;
  toolCallCount: number;
  geminiCallCount: number;
  geminiLatencyMs: number;
  tokenUsage: TokenUsage;
  steps: OrchestrationStep[];
  terminationReason: TerminationReason;
}

export type AnalysisStatus = "pending" | "completed" | "failed";

export interface AnalysisJob {
  id: string;
  status: AnalysisStatus;
  question: string;
  userId: string;
  sessionId: string;
  createdAt: string;
  completedAt?: string;
  result?: OrchestrationResult;
  error?: string;
}

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  userId: string;
  createdAt: string;
  turns: ConversationTurn[];
}

export interface ColumnSchema {
  name: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  businessDescription?: string;
}

export interface IndexSchema {
  name: string;
  columns: string[];
  isUnique: boolean;
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  indexes: IndexSchema[];
  businessDescription?: string;
}

export interface RelationshipSchema {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  constraintName: string;
}

export interface AuthorizedSchema {
  tables: TableSchema[];
  relationships: RelationshipSchema[];
}

export interface GlossaryMatch {
  key: string;
  description: string;
}

export interface ChartSpec {
  chartType: "bar" | "line" | "pie";
  xKey: string;
  yKey: string;
  data: Record<string, unknown>[];
}

// A conversation thread's view model: every message paired with its
// analysis job, so the UI can render status/SQL/results/chart/evidence
// alongside each assistant turn without re-deriving it from raw turns.
export interface ThreadMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  job?: AnalysisJob;
}
