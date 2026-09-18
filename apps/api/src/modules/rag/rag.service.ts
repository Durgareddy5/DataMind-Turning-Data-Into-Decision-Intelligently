import { BUSINESS_DESCRIPTIONS } from "../../config/businessDescriptions.js";

export interface GlossaryMatch {
  key: string;
  description: string;
}

// Placeholder keyword search until the RAG pipeline (Document -> Chunk ->
// Gemini embedding -> Chroma/Pinecone -> top-k retrieval, via
// packages/rag's VectorStore interface) is wired up. Shared by both the
// agent tool (tools/rag) and the GET /api/v1/rag/search endpoint, so there's
// one source of truth to swap when the real pipeline lands.
export function searchGlossary(query: string): { matches: GlossaryMatch[] } {
  const needle = query.toLowerCase();
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
}
