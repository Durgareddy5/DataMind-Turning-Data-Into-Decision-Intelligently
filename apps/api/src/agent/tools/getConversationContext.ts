import type { ToolDefinition } from "@ai-data-analyst/agent-core";
import { getTurns, type ConversationTurn } from "../../services/conversationStore.js";

interface Args {
  limit?: number;
}

export const getConversationContextTool: ToolDefinition<Args, { turns: ConversationTurn[] }> = {
  name: "get_conversation_context",
  description:
    "Get the recent turns of this conversation, so a follow-up question like 'now break that down by month' can be resolved against what was already asked and answered.",
  parameters: {
    type: "object",
    properties: {
      limit: { type: "integer", description: "Max number of recent turns to return, defaults to 20" },
    },
    required: [],
  },
  handler: async (args, context) => {
    return { turns: getTurns(context.sessionId, args.limit ?? 20) };
  },
};
