import { ToolRegistry } from "@ai-data-analyst/agent-core";
import { getDatabaseSchemaTool } from "../tools/schema/getDatabaseSchema.js";
import { getTableSchemaTool } from "../tools/schema/getTableSchema.js";
import { searchBusinessGlossaryTool } from "../tools/rag/searchBusinessGlossary.js";
import { validateSqlTool } from "../tools/sql/validateSql.js";
import { executeReadOnlySqlTool } from "../tools/sql/executeReadOnlySql.js";
import { analyzeResultTool } from "../tools/analytics/analyzeResult.js";
import { createChartSpecTool } from "../tools/charts/createChartSpec.js";
import { getConversationContextTool } from "../tools/getConversationContext.js";

export const toolRegistry = new ToolRegistry();

toolRegistry.register(getDatabaseSchemaTool);
toolRegistry.register(getTableSchemaTool);
toolRegistry.register(searchBusinessGlossaryTool);
toolRegistry.register(validateSqlTool);
toolRegistry.register(executeReadOnlySqlTool);
toolRegistry.register(analyzeResultTool);
toolRegistry.register(createChartSpecTool);
toolRegistry.register(getConversationContextTool);
