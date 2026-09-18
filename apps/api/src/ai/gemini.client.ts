import { createGeminiClient, type GeminiClient } from "@ai-data-analyst/ai-core";
import { env } from "../config/env.js";

let client: GeminiClient | null = null;

export function getGeminiClient(): GeminiClient {
  if (!client) {
    client = createGeminiClient({ apiKey: env.gemini.apiKey });
  }
  return client;
}
