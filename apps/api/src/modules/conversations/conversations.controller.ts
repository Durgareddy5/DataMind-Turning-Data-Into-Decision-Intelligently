import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { fetchConversation, listConversations, sendMessage, startConversation } from "./conversations.service.js";
import { ValidationError } from "../../shared/errors/AppError.js";

export function createConversationHandler(req: Request, res: Response): void {
  res.status(201).json(startConversation(req.user!));
}

export function listConversationsHandler(req: Request, res: Response): void {
  res.json({ conversations: listConversations(req.user!) });
}

export function getConversationHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    res.json(fetchConversation(req.params.id, req.user!));
  } catch (err) {
    next(err);
  }
}

const SendMessageSchema = z.object({ content: z.string().min(1) });

export function sendMessageHandler(req: Request, res: Response, next: NextFunction): void {
  const parsed = SendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new ValidationError(parsed.error.issues.map((i) => i.message).join(", ")));
    return;
  }

  try {
    const job = sendMessage(req.params.id, req.user!, parsed.data.content);
    res.status(202).json({ id: job.id, status: job.status, sessionId: job.sessionId });
  } catch (err) {
    next(err);
  }
}
