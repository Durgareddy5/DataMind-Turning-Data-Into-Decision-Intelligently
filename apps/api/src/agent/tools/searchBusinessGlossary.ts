import type { ToolDefinition } from "@ai-data-analyst/agent-core";
import { BUSINESS_DESCRIPTIONS } from "../../config/businessDescriptions.js";

interface Args {
  query: string;
}

interface GlossaryMatch {
  key: string;
  description: string;
}

// Placeholder keyword search until the RAG pipeline (Document -> Chunk ->
// Gemini embedding -> Chroma/Pinecone -> top-k retrieval) is wired up. The
// tool's name/args/result contract stays the same when that lands.
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
  handler: async (args) => {
    const needle = args.query.toLowerCase();
    const matches: GlossaryMatch[] = [];

    for (const [table, description] of Object.entries(BUSINESS_DESCRIPTIONS.tables)) {
      if (table.toLowerCase().includes(needle) || description.toLowerCase().includes(needle)) {
        matches.push({ key: table, description });
      }
    }
    for (const [column, description] of Object.entries(BUSINESS_DESCRIPTIONS.columns)) {
      if (column.toLowerCase().includes(needle) || description.toLowerCase().includes(needle)) {
        matches.push({ key: column, description });
      }
    }

    return { matches };
  },
};
