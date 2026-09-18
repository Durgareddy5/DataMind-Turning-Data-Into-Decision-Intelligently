import { ApiError, GoogleGenAI } from "@google/genai";
import type { Content, FunctionDeclaration, Part } from "@google/genai";
import type { JsonSchema } from "@ai-data-analyst/shared-types";

// Re-exported under our own names so callers (agent-core) never need to
// import @google/genai directly — the SDK stays an implementation detail
// of this package. These are the real SDK types, not a lossy re-shape, so
// provider-specific fields (e.g. Gemini 3's thoughtSignature) survive
// untouched when a turn's content is echoed back on the next request.
export type { Content as GeminiContent, Part as GeminiPart } from "@google/genai";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";
// 429 is deliberately excluded: it means quota/rate-limit exhaustion, and
// retrying that with a short backoff just spends more of an already-tiny
// budget (free-tier quotas can be single digits per minute). 500/503 are
// genuine transient overload and are safe to retry quickly.
const RETRYABLE_STATUS_CODES = new Set([500, 503]);
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 500;

function isRetryable(err: unknown): boolean {
  return err instanceof ApiError && RETRYABLE_STATUS_CODES.has(err.status);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface GeminiClientConfig {
  apiKey: string;
  model?: string;
}

export interface GeminiToolSpec {
  name: string;
  description: string;
  parameters: JsonSchema;
}

export interface GeminiFunctionCallRequest {
  name: string;
  args: Record<string, unknown>;
}

export interface GeminiTokenUsage {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
}

export interface GeminiTurnResult {
  functionCalls: GeminiFunctionCallRequest[];
  text: string | null;
  modelContent: Content;
  usage: GeminiTokenUsage;
}

export interface GenerateTurnParams {
  systemInstruction?: string;
  history: Content[];
  tools: GeminiToolSpec[];
}

export interface GeminiClient {
  generateTurn(params: GenerateTurnParams): Promise<GeminiTurnResult>;
}

export function createGeminiClient(config: GeminiClientConfig): GeminiClient {
  if (!config.apiKey) {
    throw new Error("GEMINI_API_KEY is required to create a Gemini client");
  }

  const ai = new GoogleGenAI({ apiKey: config.apiKey });
  const model = config.model ?? DEFAULT_MODEL;

  return {
    async generateTurn({ systemInstruction, history, tools }) {
      const functionDeclarations: FunctionDeclaration[] = tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parametersJsonSchema: tool.parameters,
      }));

      let response;
      for (let attempt = 0; ; attempt++) {
        try {
          response = await ai.models.generateContent({
            model,
            contents: history,
            config: {
              systemInstruction,
              tools: functionDeclarations.length > 0 ? [{ functionDeclarations }] : undefined,
            },
          });
          break;
        } catch (err) {
          if (attempt >= MAX_RETRIES - 1 || !isRetryable(err)) throw err;
          await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
        }
      }

      const functionCalls: GeminiFunctionCallRequest[] = (response.functionCalls ?? []).map((call) => ({
        name: call.name ?? "",
        args: call.args ?? {},
      }));

      // response.text throws away non-text parts (and logs a warning) once a
      // function call is present, so only trust it when there wasn't one.
      const modelContent: Content = response.candidates?.[0]?.content ?? {
        role: "model",
        parts: [{ text: response.text ?? "" }],
      };

      return {
        functionCalls,
        text: functionCalls.length > 0 ? null : (response.text ?? null),
        modelContent,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
          candidatesTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
          totalTokens: response.usageMetadata?.totalTokenCount ?? 0,
        },
      };
    },
  };
}

export function buildFunctionResponsePart(name: string, response: Record<string, unknown>): Part {
  return { functionResponse: { name, response } };
}
