import type { AuthUser, JsonSchema } from "@ai-data-analyst/shared-types";

export type { JsonSchema };

export interface ToolContext {
  user: AuthUser;
  sessionId: string;
}

export interface ToolDefinition<Args = any, Result = any> {
  name: string;
  description: string;
  parameters: JsonSchema;
  handler: (args: Args, context: ToolContext) => Promise<Result>;
}

// The only way a caller (including Gemini) can reach a tool is by its
// registered name plus arguments matching its schema — never a raw DB
// connection, credential, or arbitrary code path.
export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered`);
    }
    this.tools.set(tool.name, tool);
  }

  list(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  async call(name: string, args: unknown, context: ToolContext): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Unknown tool "${name}"`);
    }
    return tool.handler(args, context);
  }
}
