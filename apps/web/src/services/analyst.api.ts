import { api } from "./api.js";
import type {
  AnalysisJob,
  AuthorizedSchema,
  Conversation,
  GlossaryMatch,
  LoginResponse,
} from "../types/api.js";

export async function login(username: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", { username, password });
  return data;
}

export async function createConversation(): Promise<Conversation> {
  const { data } = await api.post<Conversation>("/conversations");
  return data;
}

export async function getConversation(id: string): Promise<Conversation> {
  const { data } = await api.get<Conversation>(`/conversations/${id}`);
  return data;
}

export async function listConversations(): Promise<Conversation[]> {
  const { data } = await api.get<{ conversations: Conversation[] }>("/conversations");
  return data.conversations;
}

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<{ id: string; status: string; sessionId: string }> {
  const { data } = await api.post(`/conversations/${conversationId}/messages`, { content });
  return data;
}

export async function startAnalysis(question: string, sessionId?: string): Promise<{ id: string; status: string; sessionId: string }> {
  const { data } = await api.post("/analysis", { question, sessionId });
  return data;
}

export async function getAnalysis(id: string): Promise<AnalysisJob> {
  const { data } = await api.get<AnalysisJob>(`/analysis/${id}`);
  return data;
}

export async function getAuthorizedSchema(): Promise<AuthorizedSchema> {
  const { data } = await api.get<AuthorizedSchema>("/schema");
  return data;
}

export async function searchGlossary(query: string): Promise<{ matches: GlossaryMatch[] }> {
  const { data } = await api.get<{ matches: GlossaryMatch[] }>("/rag/search", { params: { q: query } });
  return data;
}
