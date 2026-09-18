import type { FieldPacket, RowDataPacket } from "mysql2/promise";
import type { ToolDefinition } from "@ai-data-analyst/agent-core";
import type { QueryResult } from "@ai-data-analyst/shared-types";
import { validateQuery } from "@ai-data-analyst/sql-safety";
import { log } from "@ai-data-analyst/observability";
import { listAllowedTables } from "../../services/schemaService.js";
import { pool } from "../../db/pool.js";
import { buildSqlSafetyPolicy } from "../sqlSafetyPolicy.js";

const MASK_PLACEHOLDER = "***";

interface Args {
  sql: string;
}

// Re-validates independently of validate_sql: this handler must never trust
// that the caller ran validation first, since Gemini could request it directly.
export const executeReadOnlySqlTool: ToolDefinition<Args, QueryResult> = {
  name: "execute_read_only_sql",
  description:
    "Run a validated read-only SQL query against the database and return its rows. Always call validate_sql first; this tool re-validates independently and rejects anything that fails.",
  parameters: {
    type: "object",
    properties: {
      sql: { type: "string", description: "The SELECT statement to execute" },
    },
    required: ["sql"],
  },
  handler: async (args, context) => {
    const allowedTables = await listAllowedTables(context.user);
    const policy = buildSqlSafetyPolicy(allowedTables, context.user);
    const validation = validateQuery(args.sql, policy);

    if (!validation.valid || !validation.sql) {
      log("warn", "sql_rejected", {
        sessionId: context.sessionId,
        userId: context.user.id,
        sql: args.sql,
        reason: validation.reason,
      });
      throw new Error(validation.reason ?? "SQL failed validation");
    }

    log("info", "sql_executed", {
      sessionId: context.sessionId,
      userId: context.user.id,
      sql: validation.sql,
      referencedTables: validation.referencedTables,
      referencedColumns: validation.referencedColumns,
      maskedOutputColumns: validation.maskedOutputColumns,
      isAggregate: validation.isAggregate,
      limitApplied: validation.limitApplied,
      timeoutMs: validation.timeoutMs,
    });

    const [rows, fields] = await pool.query<RowDataPacket[]>({
      sql: validation.sql,
      timeout: validation.timeoutMs,
    });
    const columns = (fields as FieldPacket[]).map((field) => field.name);
    const maskedSet = new Set(validation.maskedOutputColumns ?? []);

    return {
      sql: validation.sql,
      columns,
      rows: rows.map((row) => columns.map((column) => (maskedSet.has(column) ? MASK_PLACEHOLDER : row[column]))),
    };
  },
};
