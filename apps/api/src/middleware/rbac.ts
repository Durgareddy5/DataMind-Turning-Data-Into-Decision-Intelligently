import type { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../shared/errors/AppError.js";

// Route-level RBAC (which roles may call this endpoint at all). Distinct
// from the data-level RBAC enforced deeper in tools/sql — table/column
// access is a property of the data being queried, not the route, so it
// stays in sql-safety's policy engine, not here.
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      next(new ForbiddenError(`Requires one of: ${allowedRoles.join(", ")}`));
      return;
    }
    next();
  };
}
