import { v4 as uuidv4 } from "uuid";

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  userId: string;
  createdAt: string;
  turns: ConversationTurn[];
}

// In-memory placeholder: lost on restart and not shared across instances.
// Swap for a real store (Redis/DB table) before running more than one API
// process, without changing the functions below.
const conversations = new Map<string, Conversation>();

export function createConversation(userId: string): Conversation {
  const conversation: Conversation = {
    id: uuidv4(),
    userId,
    createdAt: new Date().toISOString(),
    turns: [],
  };
  conversations.set(conversation.id, conversation);
  return conversation;
}

export function getConversation(id: string): Conversation | undefined {
  return conversations.get(id);
}

export function listConversationsByUser(userId: string): Conversation[] {
  return Array.from(conversations.values())
    .filter((c) => c.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function appendTurn(id: string, turn: ConversationTurn): void {
  const conversation = conversations.get(id);
  if (conversation) conversation.turns.push(turn);
}

export function getTurns(id: string, limit = 20): ConversationTurn[] {
  return (conversations.get(id)?.turns ?? []).slice(-limit);
}
