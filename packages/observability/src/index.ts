export type LogLevel = "debug" | "info" | "warn" | "error";

export function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const entry = { level, message, meta, timestamp: new Date().toISOString() };
  console.log(JSON.stringify(entry));
}
