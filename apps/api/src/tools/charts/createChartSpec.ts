import type { ToolDefinition } from "@ai-data-analyst/agent-core";
import type { QueryResult } from "@ai-data-analyst/shared-types";

type ChartType = "bar" | "line" | "pie";

interface Args {
  result: QueryResult;
  chartType?: ChartType;
  xKey?: string;
  yKey?: string;
}

interface ChartSpec {
  chartType: ChartType;
  xKey: string;
  yKey: string;
  data: Record<string, unknown>[];
}

export const createChartSpecTool: ToolDefinition<Args, ChartSpec> = {
  name: "create_chart_spec",
  description:
    "Turn a query result into a Recharts-ready chart spec (bar, line, or pie) with an xKey/yKey and row data. Only call this after analyze_result confirms the shape makes sense to chart.",
  parameters: {
    type: "object",
    properties: {
      result: { type: "object", description: "The QueryResult object returned by execute_read_only_sql" },
      chartType: { type: "string", enum: ["bar", "line", "pie"], description: "Defaults to bar" },
      xKey: { type: "string", description: "Column to use as the category/x-axis; inferred if omitted" },
      yKey: { type: "string", description: "Column to use as the value/y-axis; inferred if omitted" },
    },
    required: ["result"],
  },
  handler: async (args) => {
    const { columns, rows } = args.result;
    if (columns.length < 2) {
      throw new Error("Result set needs at least two columns to build a chart");
    }

    const numericColumnIndex = columns.findIndex((_, index) =>
      rows.every((row) => row[index] === null || typeof row[index] === "number")
    );

    const yKey = args.yKey ?? (numericColumnIndex >= 0 ? columns[numericColumnIndex] : columns[columns.length - 1]);
    const xKey = args.xKey ?? columns.find((column) => column !== yKey) ?? columns[0];

    const data = rows.map((row) => Object.fromEntries(columns.map((column, index) => [column, row[index]])));

    return { chartType: args.chartType ?? "bar", xKey, yKey, data };
  },
};
