import type { NextFunction, Request, Response } from "express";
import { getAuditTrail } from "./audit.service.js";

export function getAuditTrailHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    res.json(getAuditTrail(req.params.analysisId, req.user!));
  } catch (err) {
    next(err);
  }
}
