import type { NextFunction, Request, Response } from "express";
import { LoginRequestSchema } from "./auth.schemas.js";
import { login } from "./auth.service.js";
import { ValidationError } from "../../shared/errors/AppError.js";

export async function loginHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  const parsed = LoginRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new ValidationError(parsed.error.issues.map((i) => i.message).join(", ")));
    return;
  }

  try {
    const result = await login(parsed.data);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
