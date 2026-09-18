import { useCallback, useEffect, useRef, useState } from "react";
import { MessagesSquare, User } from "lucide-react";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { ErrorState } from "../../components/ui/ErrorState.js";
import { MessageInput } from "./MessageInput.js";
import { AnalysisResultPanel } from "../analysis/AnalysisResultPanel.js";
import { useAnalysisPolling } from "../../hooks/useAnalysisPolling.js";
import { getConversation, sendMessage } from "../../services/analyst.api.js";
import type { AnalysisJob, Conversation } from "../../types/api.js";

interface LocalTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  question?: string; // the question this turn answers, for retry
  job?: AnalysisJob | { id: string; status: "pending"; sessionId: string };
}

function AssistantTurn({ turn, onRetry }: { turn: LocalTurn; onRetry: (question: string) => void }) {
  if (!turn.job) {
    // Historical turn loaded from GET /conversations/:id: the backend only
    // stores role/content/timestamp, not which analysis job produced it, so
    // past turns render as plain text — full detail is only available for
    // turns sent in this session (where we still hold the job id).
    return <div className="chat-bubble chat-bubble-assistant">{turn.content}</div>;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks -- turn.job is stable per mounted instance (keyed by turn.id)
  const job = useAnalysisPolling(turn.job);

  return (
    <div className="chat-bubble chat-bubble-assistant chat-bubble-analysis">
      <AnalysisResultPanel job={job} onRetry={turn.question ? () => onRetry(turn.question!) : undefined} />
      {job.status === "completed" && <p className="chat-bubble-answer">{job.result?.answer}</p>}
    </div>
  );
}

export function ChatPanel({ conversationId }: { conversationId: string }) {
  const [turns, setTurns] = useState<LocalTurn[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const loadedConversationRef = useRef<string | null>(null);

  const loadConversation = useCallback(async (id: string) => {
    setLoadError(null);
    try {
      const conversation: Conversation = await getConversation(id);
      setTurns(
        conversation.turns.map((turn, index) => ({
          id: `${id}-${index}`,
          role: turn.role,
          content: turn.content,
          timestamp: turn.timestamp,
        }))
      );
    } catch {
      setLoadError("Couldn't load this conversation.");
    }
  }, []);

  useEffect(() => {
    if (loadedConversationRef.current === conversationId) return;
    loadedConversationRef.current = conversationId;
    setTurns([]);
    void loadConversation(conversationId);
  }, [conversationId, loadConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  const handleSend = useCallback(
    async (question: string) => {
      const timestamp = new Date().toISOString();
      setTurns((prev) => [
        ...prev,
        { id: `${timestamp}-user`, role: "user", content: question, timestamp },
      ]);
      setSending(true);
      try {
        const job = await sendMessage(conversationId, question);
        setTurns((prev) => [
          ...prev,
          {
            id: job.id,
            role: "assistant",
            content: "",
            timestamp: new Date().toISOString(),
            question,
            job: { id: job.id, status: "pending", sessionId: job.sessionId },
          },
        ]);
      } catch {
        setTurns((prev) => [
          ...prev,
          {
            id: `${timestamp}-error`,
            role: "assistant",
            content: "",
            timestamp: new Date().toISOString(),
            question,
            job: undefined,
          },
        ]);
        setLoadError("Couldn't send that question. Please try again.");
      } finally {
        setSending(false);
      }
    },
    [conversationId]
  );

  return (
    <div className="chat-panel">
      <div className="chat-panel-messages">
        {turns.length === 0 && !loadError ? (
          <EmptyState
            icon={<MessagesSquare size={28} />}
            title="Ask your first question"
            description="e.g. “What is the total revenue by region?”"
          />
        ) : (
          turns.map((turn) =>
            turn.role === "user" ? (
              <div key={turn.id} className="chat-bubble chat-bubble-user">
                <User size={14} className="chat-bubble-user-icon" />
                <span>{turn.content}</span>
              </div>
            ) : (
              <AssistantTurn key={turn.id} turn={turn} onRetry={handleSend} />
            )
          )
        )}
        {loadError && <ErrorState message={loadError} onRetry={() => loadConversation(conversationId)} />}
        <div ref={bottomRef} />
      </div>
      <MessageInput onSend={handleSend} disabled={sending} />
    </div>
  );
}
