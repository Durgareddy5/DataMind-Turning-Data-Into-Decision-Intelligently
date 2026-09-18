import { MessageSquarePlus, MessagesSquare } from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { formatRelativeTime } from "../../utils/formatting.js";

export interface ConversationSummary {
  id: string;
  createdAt: string;
  preview: string;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onCreate,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="conversation-list">
      <div className="conversation-list-header">
        <span className="conversation-list-title">Conversations</span>
        <Button variant="ghost" onClick={onCreate} aria-label="New conversation">
          <MessageSquarePlus size={16} />
        </Button>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          icon={<MessagesSquare size={22} />}
          title="No conversations yet"
          description="Start one to ask a question about your data."
          action={
            <Button variant="secondary" onClick={onCreate}>
              New conversation
            </Button>
          }
        />
      ) : (
        <ul className="conversation-list-items">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <button
                type="button"
                className={`conversation-list-item ${conversation.id === activeId ? "conversation-list-item-active" : ""}`}
                onClick={() => onSelect(conversation.id)}
              >
                <span className="conversation-list-item-preview">{conversation.preview}</span>
                <span className="conversation-list-item-time">{formatRelativeTime(conversation.createdAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
