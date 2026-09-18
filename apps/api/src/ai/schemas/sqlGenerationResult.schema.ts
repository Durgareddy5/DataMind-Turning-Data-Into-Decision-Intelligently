import { z } from "zod";

// Runtime validation for execute_read_only_sql's output — defense in depth
// on top of the QueryResult TS type, since this data ultimately originated
// from Gemini-driven tool calls and crosses a process boundary (Gemini API
// response -> our tool handler) before reaching the client.
export const SqlGenerationResultSchema = z.object({
  sql: z.string(),
  columns: z.array(z.string()),
  rows: z.array(z.array(z.unknown())),
});
export type SqlGenerationResult = z.infer<typeof SqlGenerationResultSchema>;
