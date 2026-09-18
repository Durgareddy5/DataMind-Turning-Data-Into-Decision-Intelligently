import type { FieldPacket, RowDataPacket } from "mysql2/promise";
import { pool } from "../mysql.js";

export interface ExecutedQuery {
  columns: string[];
  rows: RowDataPacket[];
  dbExecutionTimeMs: number;
}

// Pure data access: runs an already-validated SQL string. Callers (tools/sql)
// own validation — this repository trusts the SQL it's given.
export async function executeQuery(sql: string, timeoutMs: number): Promise<ExecutedQuery> {
  const dbStart = Date.now();
  const [rows, fields] = await pool.query<RowDataPacket[]>({ sql, timeout: timeoutMs });
  const dbExecutionTimeMs = Date.now() - dbStart;

  return {
    columns: (fields as FieldPacket[]).map((field) => field.name),
    rows,
    dbExecutionTimeMs,
  };
}
