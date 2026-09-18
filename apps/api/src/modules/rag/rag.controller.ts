import type { NextFunction, Request, Response } from "express";
import { searchGlossary } from "./rag.service.js";
import { ValidationError } from "../../shared/errors/AppError.js";

export function searchHandler(req: Request, res: Response, next: NextFunction): void {
  const query = req.query.q;
  if (typeof query !== "string" || query.trim().length === 0) {
    next(new ValidationError("Query parameter 'q' is required"));
    return;
  }
  res.json(searchGlossary(query));
}
