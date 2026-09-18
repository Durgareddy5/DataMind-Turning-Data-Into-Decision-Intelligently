import { log, type LogLevel } from "@ai-data-analyst/observability";

export { log, type LogLevel };

// Scoped logger: prefixes every entry's message with a module name so log
// lines are easy to filter by origin (e.g. "auth.login_failed") without
// repeating the prefix at every call site.
export function createLogger(scope: string) {
  return {
    debug: (message: string, meta?: Record<string, unknown>) => log("debug", `${scope}.${message}`, meta),
    info: (message: string, meta?: Record<string, unknown>) => log("info", `${scope}.${message}`, meta),
    warn: (message: string, meta?: Record<string, unknown>) => log("warn", `${scope}.${message}`, meta),
    error: (message: string, meta?: Record<string, unknown>) => log("error", `${scope}.${message}`, meta),
  };
}
