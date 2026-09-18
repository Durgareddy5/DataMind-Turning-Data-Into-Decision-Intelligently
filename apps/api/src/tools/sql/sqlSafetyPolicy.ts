import type { AuthUser } from "@ai-data-analyst/shared-types";
import type { SqlSafetyPolicy } from "@ai-data-analyst/sql-safety";
import { ADMIN_ROLE, DENIED_COLUMNS, SENSITIVE_COLUMNS } from "../../config/columnAccess.js";

export function buildSqlSafetyPolicy(allowedTables: string[], user: AuthUser): SqlSafetyPolicy {
  return {
    allowedTables,
    deniedColumns: DENIED_COLUMNS,
    sensitiveColumns: SENSITIVE_COLUMNS,
    adminRoles: [ADMIN_ROLE],
    userRoles: user.roles,
  };
}
