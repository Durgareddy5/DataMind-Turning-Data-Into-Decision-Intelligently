import { parse } from "sql-parser-cst";

export const DEFAULT_MAX_ROWS = 1000;
export const DEFAULT_QUERY_TIMEOUT_MS = 10_000;

const AGGREGATE_FUNCTIONS = new Set(["COUNT", "SUM", "AVG", "MIN", "MAX"]);

export interface SqlSafetyPolicy {
  allowedTables: string[];
  deniedColumns?: string[];
  // "table.column" -> roles allowed to see it unmasked (besides adminRoles).
  sensitiveColumns?: Record<string, string[]>;
  // Roles that bypass masking entirely, regardless of sensitiveColumns.
  adminRoles?: string[];
  userRoles?: string[];
  maxRows?: number;
}

export interface SqlValidationResult {
  valid: boolean;
  reason?: string;
  sql?: string;
  referencedTables?: string[];
  referencedColumns?: string[];
  maskedOutputColumns?: string[];
  isAggregate?: boolean;
  limitApplied?: boolean;
  timeoutMs?: number;
}

export function extractReferencedTables(sql: string): string[] {
  const cst = parse(sql, { dialect: "mysql" });
  const aliasToTable = new Map<string, string>();
  collectFromAliases(cst, aliasToTable);
  return Array.from(new Set(aliasToTable.values()));
}

export function validateQuery(sql: string, policy: SqlSafetyPolicy): SqlValidationResult {
  const maxRows = policy.maxRows ?? DEFAULT_MAX_ROWS;

  let cst;
  try {
    cst = parse(sql, { dialect: "mysql" });
  } catch (err) {
    return { valid: false, reason: `SQL syntax error: ${(err as Error).message}` };
  }

  // A harmless trailing ";" parses as its own "empty" statement; only count
  // real statements toward the single-statement rule.
  const realStatements = cst.statements.filter((s: any) => s.type !== "empty");
  if (realStatements.length !== 1) {
    return { valid: false, reason: "Only a single SELECT statement is allowed per request" };
  }
  const [statement] = realStatements;
  if (statement.type !== "select_stmt") {
    return {
      valid: false,
      reason: `Only SELECT statements are allowed, got "${statement.type}"`,
    };
  }

  const aliasToTable = new Map<string, string>();
  collectFromAliases(statement, aliasToTable);
  const referencedTables = Array.from(new Set(aliasToTable.values()));

  const allowedSet = new Set(policy.allowedTables);
  const disallowedTables = referencedTables.filter((table) => !allowedSet.has(table));
  if (disallowedTables.length > 0) {
    return {
      valid: false,
      reason: `Query references tables outside the allowed set: ${disallowedTables.join(", ")}`,
      referencedTables,
    };
  }

  const cartesianRisk = findCartesianJoin(statement);
  if (cartesianRisk) {
    return { valid: false, reason: cartesianRisk, referencedTables };
  }

  const singleTable = referencedTables.length === 1 ? referencedTables[0] : null;
  const referencedColumns = collectReferencedColumns(statement, aliasToTable, singleTable);

  const deniedSet = new Set(policy.deniedColumns ?? []);
  const deniedHit = referencedColumns.find((column) => deniedSet.has(column));
  if (deniedHit) {
    return {
      valid: false,
      reason: `Query references a restricted column: ${deniedHit}`,
      referencedTables,
      referencedColumns,
    };
  }

  const userRoles = policy.userRoles ?? [];
  const isAdmin = userRoles.some((role) => (policy.adminRoles ?? []).includes(role));
  const maskedOutputColumns = isAdmin
    ? []
    : collectMaskedOutputColumns(
        statement,
        aliasToTable,
        policy.sensitiveColumns ?? {},
        userRoles,
        singleTable
      );

  const limitClause = statement.clauses.find((c: any) => c.type === "limit_clause");
  const normalizedSql = applyRowLimit(sql, maxRows, limitClause);

  return {
    valid: true,
    sql: normalizedSql,
    referencedTables,
    referencedColumns,
    maskedOutputColumns,
    isAggregate: hasAggregate(statement),
    limitApplied: !limitClause,
    timeoutMs: DEFAULT_QUERY_TIMEOUT_MS,
  };
}

// ---- FROM-clause alias resolution ----

function collectFromAliases(node: any, aliasToTable: Map<string, string>): void {
  if (!node || typeof node !== "object") return;
  if (node.type === "from_clause") {
    collectFromExprAliases(node.expr, aliasToTable);
  }
  for (const key of Object.keys(node)) {
    const value = node[key];
    if (Array.isArray(value)) {
      for (const item of value) collectFromAliases(item, aliasToTable);
    } else if (value && typeof value === "object") {
      collectFromAliases(value, aliasToTable);
    }
  }
}

function collectFromExprAliases(expr: any, aliasToTable: Map<string, string>): void {
  if (!expr) return;
  switch (expr.type) {
    case "identifier":
      aliasToTable.set(expr.name, expr.name);
      break;
    case "member_expr":
      if (expr.property?.type === "identifier") {
        aliasToTable.set(expr.property.name, expr.property.name);
      }
      break;
    case "alias": {
      const tableName = tableNameOf(expr.expr);
      if (tableName && expr.alias?.type === "identifier") {
        aliasToTable.set(expr.alias.name, tableName);
      } else {
        collectFromExprAliases(expr.expr, aliasToTable);
      }
      break;
    }
    case "join_expr":
      collectFromExprAliases(expr.left, aliasToTable);
      collectFromExprAliases(expr.right, aliasToTable);
      break;
    case "list_expr":
      for (const item of expr.items ?? []) collectFromExprAliases(item, aliasToTable);
      break;
    case "paren_expr":
      collectFromExprAliases(expr.expr, aliasToTable);
      break;
    default:
      // A derived-table subquery or similar: fall back to a full walk so any
      // nested from_clause is still found.
      collectFromAliases(expr, aliasToTable);
  }
}

function tableNameOf(expr: any): string | null {
  if (!expr) return null;
  if (expr.type === "identifier") return expr.name;
  if (expr.type === "member_expr" && expr.property?.type === "identifier") return expr.property.name;
  return null;
}

// ---- Cartesian join detection ----

function findCartesianJoin(statement: any): string | null {
  const fromClause = statement.clauses.find((c: any) => c.type === "from_clause");
  if (!fromClause) return null;
  return checkJoinExpr(fromClause.expr);
}

function checkJoinExpr(expr: any): string | null {
  if (!expr) return null;
  if (expr.type === "alias") return checkJoinExpr(expr.expr);
  if (expr.type === "paren_expr") return checkJoinExpr(expr.expr);
  if (expr.type === "list_expr") {
    for (const item of expr.items ?? []) {
      const issue = checkJoinExpr(item);
      if (issue) return issue;
    }
    return null;
  }
  if (expr.type !== "join_expr") return null;

  const operatorText = Array.isArray(expr.operator)
    ? expr.operator.map((keyword: any) => keyword.name).join(" ")
    : (expr.operator?.name ?? expr.operator);

  if (operatorText === ",") {
    return "Query uses a comma join with no explicit join condition, which risks an unintended Cartesian product. Use an explicit JOIN ... ON instead.";
  }
  if (typeof operatorText === "string" && operatorText.includes("CROSS")) {
    return "Query uses CROSS JOIN, which produces a Cartesian product.";
  }
  if (!expr.specification) {
    return `Query has a JOIN with no ON/USING condition (${operatorText}), which risks an unintended Cartesian product.`;
  }

  return checkJoinExpr(expr.left) ?? checkJoinExpr(expr.right);
}

// ---- Column reference extraction (for deny/mask policy) ----

function collectReferencedColumns(
  statement: any,
  aliasToTable: Map<string, string>,
  singleTable: string | null
): string[] {
  const refs = new Set<string>();
  walkColumnRefs(statement, aliasToTable, refs);

  if (singleTable) {
    const selectClause = statement.clauses.find((c: any) => c.type === "select_clause");
    for (const item of selectClause?.columns?.items ?? []) {
      if (item.type === "identifier") {
        refs.add(`${singleTable}.${item.name}`);
      }
    }
  }

  return Array.from(refs);
}

function walkColumnRefs(node: any, aliasToTable: Map<string, string>, refs: Set<string>): void {
  if (!node || typeof node !== "object") return;

  if (node.type === "member_expr" && node.object?.type === "identifier" && node.property?.type === "identifier") {
    const table = aliasToTable.get(node.object.name);
    if (table) refs.add(`${table}.${node.property.name}`);
    return;
  }

  for (const key of Object.keys(node)) {
    const value = node[key];
    if (Array.isArray(value)) {
      for (const item of value) walkColumnRefs(item, aliasToTable, refs);
    } else if (value && typeof value === "object") {
      walkColumnRefs(value, aliasToTable, refs);
    }
  }
}

// ---- PII masking: which *output* columns (as MySQL will name them) must be masked ----

function collectMaskedOutputColumns(
  statement: any,
  aliasToTable: Map<string, string>,
  sensitiveColumns: Record<string, string[]>,
  userRoles: string[],
  singleTable: string | null
): string[] {
  const selectClause = statement.clauses.find((c: any) => c.type === "select_clause");
  const masked: string[] = [];

  for (const item of selectClause?.columns?.items ?? []) {
    const node = item.type === "alias" ? item.expr : item;
    const outputName =
      item.type === "alias" && item.alias?.type === "identifier" ? item.alias.name : outputNameOf(node);
    if (!outputName) continue;

    let sourceColumn: string | null = null;
    if (node.type === "member_expr" && node.object?.type === "identifier" && node.property?.type === "identifier") {
      const table = aliasToTable.get(node.object.name);
      if (table) sourceColumn = `${table}.${node.property.name}`;
    } else if (node.type === "identifier" && singleTable) {
      sourceColumn = `${singleTable}.${node.name}`;
    }

    const allowedRoles = sourceColumn ? sensitiveColumns[sourceColumn] : undefined;
    if (allowedRoles && !userRoles.some((role) => allowedRoles.includes(role))) {
      masked.push(outputName);
    }
  }

  return masked;
}

function outputNameOf(node: any): string | null {
  if (node.type === "identifier") return node.name;
  if (node.type === "member_expr" && node.property?.type === "identifier") return node.property.name;
  return null;
}

// ---- Aggregate detection (drives whether a LIMIT is "required" for an exploratory query) ----

function hasAggregate(statement: any): boolean {
  const hasGroupBy = statement.clauses.some((c: any) => c.type === "group_by_clause");
  if (hasGroupBy) return true;

  const selectClause = statement.clauses.find((c: any) => c.type === "select_clause");
  if (!selectClause) return false;

  let found = false;
  const walk = (node: any): void => {
    if (found || !node || typeof node !== "object") return;
    if (node.type === "func_call" && AGGREGATE_FUNCTIONS.has(String(node.name?.name).toUpperCase())) {
      found = true;
      return;
    }
    for (const key of Object.keys(node)) {
      const value = node[key];
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === "object") walk(value);
    }
  };
  walk(selectClause);
  return found;
}

// ---- Row-limit enforcement ----

function applyRowLimit(sql: string, maxRows: number, limitClause: any): string {
  const trimmed = sql.trim().replace(/;+\s*$/, "");
  if (!limitClause) {
    return `${trimmed} LIMIT ${maxRows}`;
  }
  const existing = limitClause.count?.type === "number_literal" ? limitClause.count.value : undefined;
  if (typeof existing === "number" && existing > maxRows) {
    return trimmed.replace(/\blimit\s+\d+/i, `LIMIT ${maxRows}`);
  }
  return trimmed;
}
