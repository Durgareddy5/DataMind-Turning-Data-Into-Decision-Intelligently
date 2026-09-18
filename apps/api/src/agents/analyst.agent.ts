import { runAgentLoop, type OrchestrationResult } from "@ai-data-analyst/agent-core";
import type { AuthUser } from "@ai-data-analyst/shared-types";
import { toolRegistry } from "../ai/tool-registry.js";
import { getGeminiClient } from "../ai/gemini.client.js";
import { buildPlan } from "./planner.js";
import { buildToolContext } from "./state.js";
import { MAX_CONSECUTIVE_FAILURES, MAX_TOOL_CALLS } from "./policies.js";
import { appendTurn } from "../modules/conversations/conversations.store.js";
import { logAnalysisRun } from "../modules/audit/audit.service.js";

export async function runAnalysis(
  question: string,
  user: AuthUser,
  sessionId: string,
  analysisRunId: string
): Promise<OrchestrationResult> {
  const requestStart = Date.now();

  try {
    const { systemInstruction } = await buildPlan(question, user);

    appendTurn(sessionId, { role: "user", content: question, timestamp: new Date().toISOString() });

    const result = await runAgentLoop({
      question,
      systemInstruction,
      toolRegistry,
      geminiClient: getGeminiClient(),
      context: buildToolContext(user, sessionId, analysisRunId),
      maxToolCalls: MAX_TOOL_CALLS,
      maxConsecutiveFailures: MAX_CONSECUTIVE_FAILURES,
    });

    appendTurn(sessionId, { role: "assistant", content: result.answer, timestamp: new Date().toISOString() });

    logAnalysisRun({
      analysisRunId,
      user,
      sessionId,
      question,
      steps: result.steps,
      toolCallCount: result.toolCallCount,
      geminiCallCount: result.geminiCallCount,
      requestLatencyMs: Date.now() - requestStart,
      geminiLatencyMs: result.geminiLatencyMs,
      tokenUsage: result.tokenUsage,
      finalResponse: result.answer,
      terminationReason: result.terminationReason,
    });

    return result;
  } catch (err) {
    logAnalysisRun({
      analysisRunId,
      user,
      sessionId,
      question,
      steps: [],
      toolCallCount: 0,
      geminiCallCount: 0,
      requestLatencyMs: Date.now() - requestStart,
      geminiLatencyMs: 0,
      tokenUsage: { promptTokens: 0, candidatesTokens: 0, totalTokens: 0 },
      finalResponse: null,
      terminationReason: "error",
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
