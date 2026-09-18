import type {
  GeminiClient,
  GeminiContent,
  GeminiPart,
  GeminiTokenUsage,
  GeminiToolSpec,
} from "@ai-data-analyst/ai-core";
import { buildFunctionResponsePart } from "@ai-data-analyst/ai-core";
import type { ToolContext, ToolRegistry } from "./tool.js";

export type OrchestrationStep =
  | { type: "tool_call"; name: string; args: Record<string, unknown> }
  | { type: "tool_result"; name: string; result: unknown }
  | { type: "tool_error"; name: string; error: string };

export type TerminationReason = "final_response" | "max_tool_calls_exceeded" | "repeated_failures";

export interface OrchestrationResult {
  answer: string;
  toolCallCount: number;
  geminiCallCount: number;
  geminiLatencyMs: number;
  tokenUsage: GeminiTokenUsage;
  steps: OrchestrationStep[];
  terminationReason: TerminationReason;
}

export interface RunAgentLoopParams {
  question: string;
  systemInstruction: string;
  toolRegistry: ToolRegistry;
  geminiClient: GeminiClient;
  context: ToolContext;
  maxToolCalls?: number;
  maxConsecutiveFailures?: number;
}

const DEFAULT_MAX_TOOL_CALLS = 15;
const DEFAULT_MAX_CONSECUTIVE_FAILURES = 3;

const MAX_TOOL_CALLS_MESSAGE =
  "I wasn't able to finish this analysis within the allowed number of steps. Please narrow your question and try again.";
const REPEATED_FAILURES_MESSAGE =
  "I hit repeated errors while trying to answer this and stopped to avoid looping. Please rephrase your question or check the underlying data access.";

// Bounded by construction: every iteration either returns (no function calls)
// or executes at least one tool call against the maxToolCalls budget, so the
// loop can run at most maxToolCalls + 1 times no matter what Gemini requests.
export async function runAgentLoop(params: RunAgentLoopParams): Promise<OrchestrationResult> {
  const maxToolCalls = params.maxToolCalls ?? DEFAULT_MAX_TOOL_CALLS;
  const maxConsecutiveFailures = params.maxConsecutiveFailures ?? DEFAULT_MAX_CONSECUTIVE_FAILURES;
  const toolSpecs: GeminiToolSpec[] = params.toolRegistry
    .list()
    .map((tool) => ({ name: tool.name, description: tool.description, parameters: tool.parameters }));

  const history: GeminiContent[] = [{ role: "user", parts: [{ text: params.question }] }];
  const steps: OrchestrationStep[] = [];
  let toolCallCount = 0;
  let geminiCallCount = 0;
  let geminiLatencyMs = 0;
  let consecutiveFailures = 0;
  const tokenUsage: GeminiTokenUsage = { promptTokens: 0, candidatesTokens: 0, totalTokens: 0 };

  const addUsage = (usage: GeminiTokenUsage): void => {
    geminiCallCount += 1;
    tokenUsage.promptTokens += usage.promptTokens;
    tokenUsage.candidatesTokens += usage.candidatesTokens;
    tokenUsage.totalTokens += usage.totalTokens;
  };

  while (true) {
    const turnStart = Date.now();
    const turn = await params.geminiClient.generateTurn({
      systemInstruction: params.systemInstruction,
      history,
      tools: toolSpecs,
    });
    geminiLatencyMs += Date.now() - turnStart;
    addUsage(turn.usage);
    history.push(turn.modelContent);

    if (turn.functionCalls.length === 0) {
      return {
        answer: turn.text ?? "",
        toolCallCount,
        geminiCallCount,
        geminiLatencyMs,
        tokenUsage,
        steps,
        terminationReason: "final_response",
      };
    }

    const responseParts: GeminiPart[] = [];

    for (const call of turn.functionCalls) {
      if (toolCallCount >= maxToolCalls) {
        return {
          answer: MAX_TOOL_CALLS_MESSAGE,
          toolCallCount,
          geminiCallCount,
          geminiLatencyMs,
          tokenUsage,
          steps,
          terminationReason: "max_tool_calls_exceeded",
        };
      }
      toolCallCount += 1;
      steps.push({ type: "tool_call", name: call.name, args: call.args });

      try {
        const result = await params.toolRegistry.call(call.name, call.args, params.context);
        consecutiveFailures = 0;
        steps.push({ type: "tool_result", name: call.name, result });
        responseParts.push(buildFunctionResponsePart(call.name, { output: result }));
      } catch (err) {
        consecutiveFailures += 1;
        const message = err instanceof Error ? err.message : String(err);
        steps.push({ type: "tool_error", name: call.name, error: message });
        responseParts.push(buildFunctionResponsePart(call.name, { error: message }));

        if (consecutiveFailures >= maxConsecutiveFailures) {
          return {
            answer: REPEATED_FAILURES_MESSAGE,
            toolCallCount,
            geminiCallCount,
            geminiLatencyMs,
            tokenUsage,
            steps,
            terminationReason: "repeated_failures",
          };
        }
      }
    }

    history.push({ role: "user", parts: responseParts });
  }
}
