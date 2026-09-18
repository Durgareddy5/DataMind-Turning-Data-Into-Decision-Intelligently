import type { AuthUser } from "@ai-data-analyst/shared-types";
import type { ToolContext } from "@ai-data-analyst/agent-core";

export function buildToolContext(user: AuthUser, sessionId: string, analysisRunId: string): ToolContext {
  return { user, sessionId, analysisRunId };
}
