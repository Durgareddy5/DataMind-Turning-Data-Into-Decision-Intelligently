import type { ChartSpec, OrchestrationStep, QueryResult } from "../types/api.js";

export function findToolResult<T>(steps: OrchestrationStep[], toolName: string): T | undefined {
  const step = [...steps].reverse().find((s): s is Extract<OrchestrationStep, { type: "tool_result" }> => s.type === "tool_result" && s.name === toolName);
  return step?.result as T | undefined;
}

export function getQueryResult(steps: OrchestrationStep[]): QueryResult | undefined {
  return findToolResult<QueryResult>(steps, "execute_read_only_sql");
}

export function getChartSpec(steps: OrchestrationStep[]): ChartSpec | undefined {
  return findToolResult<ChartSpec>(steps, "create_chart_spec");
}

export function getToolCalls(steps: OrchestrationStep[]) {
  return steps.filter((s): s is Extract<OrchestrationStep, { type: "tool_call" }> => s.type === "tool_call");
}

export function getToolErrors(steps: OrchestrationStep[]) {
  return steps.filter((s): s is Extract<OrchestrationStep, { type: "tool_error" }> => s.type === "tool_error");
}
