import type { ToolDefinition } from "@ai-data-analyst/agent-core";
import { getRelationships, getTableSchema, listAllowedTables } from "../../modules/schema/schema.service.js";

export const getDatabaseSchemaTool: ToolDefinition = {
  name: "get_database_schema",
  description:
    "Get an overview of every table this user is allowed to query: table names, their business descriptions, and how they relate to each other. Call get_table_schema afterwards for a specific table's columns.",
  parameters: {
    type: "object",
    properties: {},
    required: [],
  },
  handler: async (_args, context) => {
    const allowedTables = await listAllowedTables(context.user);
    const allowedSet = new Set(allowedTables);

    const tables = await Promise.all(
      allowedTables.map(async (name) => {
        const table = await getTableSchema(name);
        return {
          name,
          businessDescription: table?.businessDescription,
          columnCount: table?.columns.length ?? 0,
        };
      })
    );

    const relationships = (await getRelationships()).filter(
      (r) => allowedSet.has(r.fromTable) && allowedSet.has(r.toTable)
    );

    return { tables, relationships };
  },
};
