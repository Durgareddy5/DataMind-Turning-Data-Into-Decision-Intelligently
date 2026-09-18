import type { ToolDefinition } from "@ai-data-analyst/agent-core";
import { getTableSchema, listAllowedTables } from "../../modules/schema/schema.service.js";

interface Args {
  table: string;
}

export const getTableSchemaTool: ToolDefinition<Args> = {
  name: "get_table_schema",
  description:
    "Get the full column list, types, keys, and indexes for one named table. The table must be one returned by get_database_schema.",
  parameters: {
    type: "object",
    properties: {
      table: { type: "string", description: "Exact table name to inspect" },
    },
    required: ["table"],
  },
  handler: async (args, context) => {
    const allowedTables = await listAllowedTables(context.user);
    if (!allowedTables.includes(args.table)) {
      throw new Error(`Table "${args.table}" is not accessible to this user`);
    }

    const schema = await getTableSchema(args.table);
    if (!schema) {
      throw new Error(`Table "${args.table}" does not exist`);
    }

    return schema;
  },
};
