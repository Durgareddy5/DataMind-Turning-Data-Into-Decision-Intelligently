import type { AuthUser, NormalizedSchema, RelationshipSchema, SchemaContext, TableSchema } from "@ai-data-analyst/shared-types";
import { loadSchemaFromDatabase } from "../../database/repositories/schema.repository.js";
import { TABLE_ACCESS_POLICY } from "../../config/schemaAccess.js";
import { BUSINESS_DESCRIPTIONS } from "../../config/businessDescriptions.js";

const CACHE_TTL_MS = 5 * 60 * 1000;

let cache: NormalizedSchema | null = null;
let cacheLoadedAt = 0;

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

// Used by GET /api/v1/schema: the full authorized-schema payload for a user,
// without needing a specific question.
export async function getAuthorizedSchema(user: AuthUser): Promise<{ tables: TableSchema[]; relationships: RelationshipSchema[] }> {
  const schema = await ensureCache();
  const allowedTables = resolveAllowedTableNames(
    user,
    schema.tables.map((t) => t.name)
  );
  const allowedTableSet = new Set(allowedTables);

  return {
    tables: schema.tables.filter((t) => allowedTableSet.has(t.name)),
    relationships: schema.relationships.filter(
      (r) => allowedTableSet.has(r.fromTable) && allowedTableSet.has(r.toTable)
    ),
  };
}

export function invalidateSchemaCache(): void {
  cache = null;
  cacheLoadedAt = 0;
}
