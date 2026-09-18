export interface QueryRequest {
  question: string;
  datasetId: string;
}

export interface QueryResult {
  sql: string;
  columns: string[];
  rows: unknown[][];
}

export * from "./schema.js";
export * from "./tool.js";
