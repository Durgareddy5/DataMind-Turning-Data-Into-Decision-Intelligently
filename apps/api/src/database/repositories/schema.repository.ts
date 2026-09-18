import type { RowDataPacket } from "mysql2/promise";
import type { ColumnSchema, IndexSchema, NormalizedSchema, RelationshipSchema, TableSchema } from "@ai-data-analyst/shared-types";
import { pool } from "../mysql.js";
import { env } from "../../config/env.js";
import { BUSINESS_DESCRIPTIONS } from "../../config/businessDescriptions.js";

// Pure data access: introspects INFORMATION_SCHEMA and returns the raw
// normalized shape. No caching, no RBAC filtering, no prompt rendering —
// those are modules/schema/schema.service.ts's job.
export async function loadSchemaFromDatabase(): Promise<NormalizedSchema> {
  const database = env.mysql.database;

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
