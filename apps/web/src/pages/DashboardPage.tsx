import { useCallback, useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell.js";
import { ConversationList, type ConversationSummary } from "../features/chat/ConversationList.js";
import { ChatPanel } from "../features/chat/ChatPanel.js";
import { SchemaBrowser } from "../features/schema/SchemaBrowser.js";
import { EmptyState } from "../components/ui/EmptyState.js";
import { createConversation, listConversations } from "../services/analyst.api.js";
import { MessagesSquare } from "lucide-react";
import type { Conversation } from "../types/api.js";

function toSummary(conversation: Conversation): ConversationSummary {
  const firstUserTurn = conversation.turns.find((t) => t.role === "user");
  return {
    id: conversation.id,
    createdAt: conversation.createdAt,
    preview: firstUserTurn?.content ?? "New conversation",
  };
}

export function DashboardPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const list = await listConversations();
    setConversations(list.map(toSummary));
    return list;
  }, []);

  useEffect(() => {
    void refresh().then((list) => {
      if (list.length > 0) setActiveId(list[0].id);
    });
  }, [refresh]);

  const handleCreate = useCallback(async () => {
    const conversation = await createConversation();
    setConversations((prev) => [toSummary(conversation), ...prev]);
    setActiveId(conversation.id);
  }, []);

  return (
    <AppShell
      conversationsSlot={
        <ConversationList conversations={conversations} activeId={activeId} onSelect={setActiveId} onCreate={handleCreate} />
      }
      schemaSlot={<SchemaBrowser />}
    >
      {activeId ? (
        <ChatPanel key={activeId} conversationId={activeId} />
      ) : (
        <EmptyState
          icon={<MessagesSquare size={28} />}
          title="Start a conversation"
          description="Create a new conversation from the sidebar to ask your first question."
        />
      )}
    </AppShell>
  );
}
