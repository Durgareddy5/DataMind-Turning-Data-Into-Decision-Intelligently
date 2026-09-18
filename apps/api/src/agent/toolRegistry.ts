import { ToolRegistry } from "@ai-data-analyst/agent-core";
import { getDatabaseSchemaTool } from "./tools/getDatabaseSchema.js";
import { getTableSchemaTool } from "./tools/getTableSchema.js";
import { searchBusinessGlossaryTool } from "./tools/searchBusinessGlossary.js";
import { validateSqlTool } from "./tools/validateSql.js";
import { executeReadOnlySqlTool } from "./tools/executeReadOnlySql.js";
import { analyzeResultTool } from "./tools/analyzeResult.js";
import { createChartSpecTool } from "./tools/createChartSpec.js";
import { getConversationContextTool } from "./tools/getConversationContext.js";

export const toolRegistry = new ToolRegistry();

toolRegistry.register(getDatabaseSchemaTool);
toolRegistry.register(getTableSchemaTool);
toolRegistry.register(searchBusinessGlossaryTool);
toolRegistry.register(validateSqlTool);
toolRegistry.register(executeReadOnlySqlTool);
toolRegistry.register(analyzeResultTool);
toolRegistry.register(createChartSpecTool);
toolRegistry.register(getConversationContextTool);
