import type { ToolDefinition } from "@ai-data-analyst/agent-core";
import type { QueryResult } from "@ai-data-analyst/shared-types";

interface Args {
  result: QueryResult;
}

interface ColumnSummary {
  name: string;
  inferredType: "number" | "string" | "boolean" | "mixed" | "null";
  nonNullCount: number;
  distinctCount: number;
  numericStats?: { min: number; max: number; avg: number; sum: number };
}

interface AnalysisSummary {
  rowCount: number;
  columns: ColumnSummary[];
}

function inferType(nonNullValues: unknown[]): ColumnSummary["inferredType"] {
  if (nonNullValues.length === 0) return "null";
  const types = new Set(
    nonNullValues.map((value) =>
      typeof value === "number" ? "number" : typeof value === "boolean" ? "boolean" : "string"
    )
  );
  return types.size === 1 ? ([...types][0] as ColumnSummary["inferredType"]) : "mixed";
}

export const analyzeResultTool: ToolDefinition<Args, AnalysisSummary> = {
  name: "analyze_result",
  description:
    "Summarize a query result set returned by execute_read_only_sql: row count, per-column inferred type, distinct value counts, and numeric min/max/avg/sum. Use before writing an answer or a chart spec.",
  parameters: {
    type: "object",
    properties: {
      result: {
        type: "object",
        description: "The QueryResult object returned by execute_read_only_sql",
      },
    },
    required: ["result"],
  },
  handler: async (args) => {
    const { columns, rows } = args.result;

    const columnSummaries: ColumnSummary[] = columns.map((name, index) => {
      const values = rows.map((row) => row[index]);
      const nonNullValues = values.filter((value) => value !== null && value !== undefined);
      const inferredType = inferType(nonNullValues);

      const summary: ColumnSummary = {
        name,
        inferredType,
        nonNullCount: nonNullValues.length,
        distinctCount: new Set(nonNullValues.map((value) => JSON.stringify(value))).size,
      };

      if (inferredType === "number") {
        const numbers = nonNullValues as number[];
        const sum = numbers.reduce((total, value) => total + value, 0);
        summary.numericStats = {
          min: Math.min(...numbers),
          max: Math.max(...numbers),
          avg: sum / numbers.length,
          sum,
        };
      }

      return summary;
    });

    return { rowCount: rows.length, columns: columnSummaries };
  },
};
