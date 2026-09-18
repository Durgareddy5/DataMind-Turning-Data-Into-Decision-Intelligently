import { createGeminiClient, type GeminiClient } from "@ai-data-analyst/ai-core";
import { runAgentLoop, type OrchestrationResult } from "@ai-data-analyst/agent-core";
import type { AuthUser } from "@ai-data-analyst/shared-types";
import { toolRegistry } from "./toolRegistry.js";
import { buildSchemaContext } from "../services/schemaService.js";
import { appendTurn } from "../services/conversationStore.js";

const SYSTEM_INSTRUCTION_PREFIX = `You are a data analyst copilot answering business questions about a company's database.

You already have the full database schema below — do not call get_database_schema or get_table_schema unless you genuinely need detail not shown here.

Be economical with tool calls: each one costs real time and API quota. Use the fewest steps that still get a correct, grounded answer.

Rules:
- Only use the provided tools. Never invent SQL results or table structures.
- If a business term is genuinely ambiguous, call search_business_glossary at most once with your single best query — don't probe multiple synonyms one at a time.
- Call execute_read_only_sql directly with your SQL. It validates internally and will tell you exactly what's wrong if the query is rejected, so you do not need to call validate_sql first — only use validate_sql if you want to sanity-check a query without running it.
- Only call analyze_result when the result set is large, ambiguous, or needs statistics you can't determine by inspection. Skip it for small, self-explanatory results — just read the rows.
- Only call create_chart_spec when a chart would genuinely help answer the question.
- If this looks like a follow-up question, call get_conversation_context to see what was already discussed.
- Give a direct, concise final answer grounded only in tool results.`;

let geminiClient: GeminiClient | null = null;

function getGeminiClient(): GeminiClient {
  if (!geminiClient) {
    geminiClient = createGeminiClient({ apiKey: process.env.GEMINI_API_KEY ?? "" });
  }
  return geminiClient;
}

export async function runAnalysis(
  question: string,
  user: AuthUser,
  sessionId: string
): Promise<OrchestrationResult> {
  const schemaContext = await buildSchemaContext(question, user);
  const systemInstruction = `${SYSTEM_INSTRUCTION_PREFIX}\n\nDatabase schema available to this user:\n${schemaContext.promptText}`;

  appendTurn(sessionId, { role: "user", content: question, timestamp: new Date().toISOString() });

  const result = await runAgentLoop({
    question,
    systemInstruction,
    toolRegistry,
    geminiClient: getGeminiClient(),
    context: { user, sessionId },
  });

  appendTurn(sessionId, { role: "assistant", content: result.answer, timestamp: new Date().toISOString() });

  return result;
}
