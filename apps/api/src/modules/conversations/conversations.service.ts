import type { AuthUser } from "@ai-data-analyst/shared-types";
import { createConversation, getConversation, listConversationsByUser, type Conversation } from "./conversations.store.js";
import { createAnalysisJob, type AnalysisJob } from "../analyst/analyst.service.js";
import { ForbiddenError, NotFoundError } from "../../shared/errors/AppError.js";

export function startConversation(user: AuthUser): Conversation {
  return createConversation(user.id);
}

export function listConversations(user: AuthUser): Conversation[] {
  return listConversationsByUser(user.id);
}

export function fetchConversation(id: string, user: AuthUser): Conversation {
  const conversation = getConversation(id);
  if (!conversation) throw new NotFoundError(`Conversation "${id}" not found`);
  if (conversation.userId !== user.id) throw new ForbiddenError("Not your conversation");
  return conversation;
}

// Kicks off an analysis job scoped to this conversation's id as the session,
// so agents/analyst.agent.ts's own turn-logging (via conversations.store)
// accumulates into this same thread — no double-appending here.
export function sendMessage(id: string, user: AuthUser, content: string): AnalysisJob {
  fetchConversation(id, user);
  return createAnalysisJob({ question: content, user, sessionId: id });
}
