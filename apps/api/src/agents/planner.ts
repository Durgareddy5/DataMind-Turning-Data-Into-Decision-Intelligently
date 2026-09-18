import type { AuthUser } from "@ai-data-analyst/shared-types";
import { buildSchemaContext } from "../modules/schema/schema.service.js";
import { SYSTEM_INSTRUCTION_PREFIX } from "../ai/prompts/systemInstruction.js";

// Assembles what the agent is allowed to do before the loop starts: the
// fixed behavioral rules plus this specific user's authorized schema. Not
// the loop itself (packages/agent-core owns that) — just its inputs.
export async function buildPlan(question: string, user: AuthUser): Promise<{ systemInstruction: string }> {
  const schemaContext = await buildSchemaContext(question, user);
  return {
    systemInstruction: `${SYSTEM_INSTRUCTION_PREFIX}\n\nDatabase schema available to this user:\n${schemaContext.promptText}`,
  };
}
