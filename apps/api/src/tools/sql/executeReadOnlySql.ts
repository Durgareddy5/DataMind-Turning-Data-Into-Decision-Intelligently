import type { ToolDefinition } from "@ai-data-analyst/agent-core";
import type { QueryResult } from "@ai-data-analyst/shared-types";
import { validateQuery } from "@ai-data-analyst/sql-safety";
import { log } from "../../config/logger.js";
import { listAllowedTables } from "../../modules/schema/schema.service.js";
import { executeQuery } from "../../database/repositories/query.repository.js";
import { buildSqlSafetyPolicy } from "./sqlSafetyPolicy.js";
import { SqlGenerationResultSchema } from "../../ai/schemas/sqlGenerationResult.schema.js";

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
        analysisRunId: context.analysisRunId,
        sessionId: context.sessionId,
        userId: context.user.id,
        sql: args.sql,
        reason: validation.reason,
      });
      throw new Error(validation.reason ?? "SQL failed validation");
    }

    const { columns, rows, dbExecutionTimeMs } = await executeQuery(validation.sql, validation.timeoutMs ?? 10_000);
    const maskedSet = new Set(validation.maskedOutputColumns ?? []);

    log("info", "sql_executed", {
      analysisRunId: context.analysisRunId,
      sessionId: context.sessionId,
      userId: context.user.id,
      sql: validation.sql,
      referencedTables: validation.referencedTables,
      referencedColumns: validation.referencedColumns,
      maskedOutputColumns: validation.maskedOutputColumns,
      isAggregate: validation.isAggregate,
      limitApplied: validation.limitApplied,
      timeoutMs: validation.timeoutMs,
      dbExecutionTimeMs,
      rowCount: rows.length,
    });

    return SqlGenerationResultSchema.parse({
      sql: validation.sql,
      columns,
      rows: rows.map((row) => columns.map((column) => (maskedSet.has(column) ? MASK_PLACEHOLDER : row[column]))),
    });
  },
};
