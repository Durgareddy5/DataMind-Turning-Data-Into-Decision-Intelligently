import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { createAnalysisJob, getAnalysisJob } from "./analyst.service.js";
import { ValidationError } from "../../shared/errors/AppError.js";

const StartAnalysisSchema = z.object({
  question: z.string().min(1),
  sessionId: z.string().optional(),
});

export function startAnalysisHandler(req: Request, res: Response, next: NextFunction): void {
  const parsed = StartAnalysisSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new ValidationError(parsed.error.issues.map((i) => i.message).join(", ")));
    return;
  }

  const job = createAnalysisJob({ question: parsed.data.question, user: req.user!, sessionId: parsed.data.sessionId });
  res.status(202).json({ id: job.id, status: job.status, sessionId: job.sessionId });
}

export function getAnalysisHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    res.json(getAnalysisJob(req.params.id));
  } catch (err) {
    next(err);
  }
}
