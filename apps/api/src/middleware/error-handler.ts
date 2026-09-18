import type { NextFunction, Request, Response } from "express";
import { AppError } from "../shared/errors/AppError.js";
import { log } from "../config/logger.js";

// Express recognizes error middleware by arity (4 params) — the unused
// `_next` is required for that, not dead code.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code, requestId: req.requestId });
    return;
  }

  const message = err instanceof Error ? err.message : String(err);
  log("error", "unhandled_error", { requestId: req.requestId, path: req.path, error: message });
  res.status(500).json({ error: message, requestId: req.requestId });
}
