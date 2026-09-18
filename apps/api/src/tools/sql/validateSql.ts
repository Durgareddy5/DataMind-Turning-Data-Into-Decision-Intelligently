import type { ToolDefinition } from "@ai-data-analyst/agent-core";
import { validateQuery, type SqlValidationResult } from "@ai-data-analyst/sql-safety";
import { log } from "../../config/logger.js";
import { listAllowedTables } from "../../modules/schema/schema.service.js";
import { buildSqlSafetyPolicy } from "./sqlSafetyPolicy.js";

interface Args {
  sql: string;
}

export const validateSqlTool: ToolDefinition<Args, SqlValidationResult> = {
  name: "validate_sql",
  description:
    "Check a candidate SQL query before executing it: rejects anything but a single SELECT statement, rejects tables outside this user's allowed set, restricted columns, and unsafe joins. Always call this before execute_read_only_sql.",
  parameters: {
    type: "object",
    properties: {
      sql: { type: "string", description: "The candidate SQL statement" },
    },
    required: ["sql"],
  },
  handler: async (args, context) => {
    const allowedTables = await listAllowedTables(context.user);
    const policy = buildSqlSafetyPolicy(allowedTables, context.user);
    const result = validateQuery(args.sql, policy);

    log(result.valid ? "info" : "warn", "sql_validated", {
      analysisRunId: context.analysisRunId,
      sessionId: context.sessionId,
      userId: context.user.id,
      sql: args.sql,
      result,
    });

    return result;
  },
};
