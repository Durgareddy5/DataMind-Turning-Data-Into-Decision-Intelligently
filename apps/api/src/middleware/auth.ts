import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../modules/auth/jwt.js";
import { UnauthorizedError } from "../shared/errors/AppError.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new UnauthorizedError("Missing or malformed Authorization header"));
    return;
  }

  try {
    req.user = verifyToken(header.slice("Bearer ".length));
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}
