import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { createConversationHandler, getConversationHandler, listConversationsHandler, sendMessageHandler } from "./conversations.controller.js";

export const conversationsRouter = Router();

conversationsRouter.post("/", requireAuth, createConversationHandler);
conversationsRouter.get("/", requireAuth, listConversationsHandler);
conversationsRouter.get("/:id", requireAuth, getConversationHandler);
conversationsRouter.post("/:id/messages", requireAuth, sendMessageHandler);
