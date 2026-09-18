export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// In-memory placeholder: lost on restart and not shared across instances.
// Swap for a real store (Redis/DB table) before running more than one API
// process, without changing the two functions below.
const conversationsBySession = new Map<string, ConversationTurn[]>();

export function appendTurn(sessionId: string, turn: ConversationTurn): void {
  const turns = conversationsBySession.get(sessionId) ?? [];
  turns.push(turn);
  conversationsBySession.set(sessionId, turns);
}

export function getTurns(sessionId: string, limit = 20): ConversationTurn[] {
  const turns = conversationsBySession.get(sessionId) ?? [];
  return turns.slice(-limit);
}
