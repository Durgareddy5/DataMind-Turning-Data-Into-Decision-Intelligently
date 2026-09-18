import type { ToolDefinition } from "@ai-data-analyst/agent-core";
import { searchGlossary, type GlossaryMatch } from "../../modules/rag/rag.service.js";

interface Args {
  query: string;
}

export const searchBusinessGlossaryTool: ToolDefinition<Args, { matches: GlossaryMatch[] }> = {
  name: "search_business_glossary",
  description:
    "Look up the approved business definition of a metric or term (e.g. Revenue, GMV, Active Customer, Churn, Fiscal Quarter) before writing SQL that depends on it.",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "The business term or question to look up" },
    },
    required: ["query"],
  },
  handler: async (args) => searchGlossary(args.query),
};
