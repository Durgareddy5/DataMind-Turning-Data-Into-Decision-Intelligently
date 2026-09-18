import type { RowDataPacket } from "mysql2/promise";
import type {
  AuthUser,
  ColumnSchema,
  IndexSchema,
  NormalizedSchema,
  RelationshipSchema,
  SchemaContext,
  TableSchema,
} from "@ai-data-analyst/shared-types";
import { pool } from "../db/pool.js";
import { TABLE_ACCESS_POLICY } from "../config/schemaAccess.js";
import { BUSINESS_DESCRIPTIONS } from "../config/businessDescriptions.js";

const CACHE_TTL_MS = 5 * 60 * 1000;

let cache: NormalizedSchema | null = null;
let cacheLoadedAt = 0;

async function loadSchemaFromDatabase(): Promise<NormalizedSchema> {
  const database = process.env.MYSQL_DATABASE;

  const [columnRows] = await pool.query<RowDataPacket[]>(
    `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ?
     ORDER BY TABLE_NAME, ORDINAL_POSITION`,
    [database]
  );

  const [indexRows] = await pool.query<RowDataPacket[]>(
    `SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME, NON_UNIQUE
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = ?
     ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`,
    [database]
  );

  const [relationshipRows] = await pool.query<RowDataPacket[]>(
    `SELECT
       TABLE_NAME AS fromTable,
       COLUMN_NAME AS fromColumn,
       REFERENCED_TABLE_NAME AS toTable,
       REFERENCED_COLUMN_NAME AS toColumn,
       CONSTRAINT_NAME AS constraintName
     FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL`,
    [database]
  );

  const tables = new Map<string, TableSchema>();

  for (const row of columnRows) {
    const tableName = row.TABLE_NAME as string;
    if (!tables.has(tableName)) {
      tables.set(tableName, {
        name: tableName,
        columns: [],
        indexes: [],
        businessDescription: BUSINESS_DESCRIPTIONS.tables[tableName],
      });
    }
    tables.get(tableName)!.columns.push({
      name: row.COLUMN_NAME,
      dataType: row.DATA_TYPE,
      isNullable: row.IS_NULLABLE === "YES",
      isPrimaryKey: row.COLUMN_KEY === "PRI",
      businessDescription: BUSINESS_DESCRIPTIONS.columns[`${tableName}.${row.COLUMN_NAME}`],
    } satisfies ColumnSchema);
  }

  const indexesByTable = new Map<string, Map<string, IndexSchema>>();
  for (const row of indexRows) {
    const tableName = row.TABLE_NAME as string;
    if (!indexesByTable.has(tableName)) {
      indexesByTable.set(tableName, new Map());
    }
    const indexesForTable = indexesByTable.get(tableName)!;
    if (!indexesForTable.has(row.INDEX_NAME)) {
      indexesForTable.set(row.INDEX_NAME, {
        name: row.INDEX_NAME,
        columns: [],
        isUnique: row.NON_UNIQUE === 0,
      });
    }
    indexesForTable.get(row.INDEX_NAME)!.columns.push(row.COLUMN_NAME);
  }
  for (const [tableName, indexMap] of indexesByTable) {
    const table = tables.get(tableName);
    if (table) {
      table.indexes = Array.from(indexMap.values());
    }
  }

  const relationships: RelationshipSchema[] = relationshipRows.map((row) => ({
    fromTable: row.fromTable,
    fromColumn: row.fromColumn,
    toTable: row.toTable,
    toColumn: row.toColumn,
    constraintName: row.constraintName,
  }));

  return {
    tables: Array.from(tables.values()),
    relationships,
    generatedAt: new Date().toISOString(),
  };
}

async function ensureCache(): Promise<NormalizedSchema> {
  const isStale = !cache || Date.now() - cacheLoadedAt > CACHE_TTL_MS;
  if (isStale) {
    const loaded = await loadSchemaFromDatabase();
    cache = loaded;
    cacheLoadedAt = Date.now();
    return loaded;
  }
  return cache!;
}

function resolveAllowedTableNames(user: AuthUser, allTableNames: string[]): string[] {
  const grants = user.roles
    .map((role) => TABLE_ACCESS_POLICY[role])
    .filter((grant): grant is string[] | "*" => grant !== undefined);

  if (grants.length === 0) {
    return [];
  }
  if (grants.includes("*")) {
    return allTableNames;
  }

  const allowed = new Set(grants.flat() as string[]);
  return allTableNames.filter((name) => allowed.has(name));
}

function renderSchemaPrompt(tables: TableSchema[], relationships: RelationshipSchema[]): string {
  const tableBlocks = tables.map((table) => {
    const columnLines = table.columns
      .map((column) => {
        const flags = [column.isPrimaryKey ? "PK" : null, column.isNullable ? null : "NOT NULL"]
          .filter(Boolean)
          .join(", ");
        const description = column.businessDescription ? ` -- ${column.businessDescription}` : "";
        return `  - ${column.name} (${column.dataType}${flags ? `, ${flags}` : ""})${description}`;
      })
      .join("\n");
    const tableDescription = table.businessDescription ? ` -- ${table.businessDescription}` : "";
    return `Table: ${table.name}${tableDescription}\n${columnLines}`;
  });

  const relationshipLines = relationships.map(
    (r) => `  - ${r.fromTable}.${r.fromColumn} -> ${r.toTable}.${r.toColumn}`
  );

  return [
    tableBlocks.join("\n\n"),
    relationshipLines.length ? `Relationships:\n${relationshipLines.join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function listAllowedTables(user: AuthUser): Promise<string[]> {
  const schema = await ensureCache();
  return resolveAllowedTableNames(
    user,
    schema.tables.map((t) => t.name)
  );
}

export async function getTableSchema(table: string): Promise<TableSchema | null> {
  const schema = await ensureCache();
  return schema.tables.find((t) => t.name === table) ?? null;
}

export async function getRelationships(): Promise<RelationshipSchema[]> {
  const schema = await ensureCache();
  return schema.relationships;
}

export function getBusinessDescription(tableOrColumn: string): string | undefined {
  return tableOrColumn.includes(".")
    ? BUSINESS_DESCRIPTIONS.columns[tableOrColumn]
    : BUSINESS_DESCRIPTIONS.tables[tableOrColumn];
}

export async function buildSchemaContext(question: string, user: AuthUser): Promise<SchemaContext> {
  const schema = await ensureCache();
  const allowedTables = resolveAllowedTableNames(
    user,
    schema.tables.map((t) => t.name)
  );
  const allowedTableSet = new Set(allowedTables);

  const tables = schema.tables.filter((t) => allowedTableSet.has(t.name));
  const relationships = schema.relationships.filter(
    (r) => allowedTableSet.has(r.fromTable) && allowedTableSet.has(r.toTable)
  );

  return {
    question,
    allowedTables,
    tables,
    relationships,
    promptText: renderSchemaPrompt(tables, relationships),
  };
}

export function invalidateSchemaCache(): void {
  cache = null;
  cacheLoadedAt = 0;
}
