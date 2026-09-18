import { useState, type ReactNode } from "react";
import { Database, MessagesSquare } from "lucide-react";

type SidebarTab = "conversations" | "schema";

export function Sidebar({
  open,
  conversationsSlot,
  schemaSlot,
}: {
  open: boolean;
  conversationsSlot: ReactNode;
  schemaSlot: ReactNode;
}) {
  const [tab, setTab] = useState<SidebarTab>("conversations");

  return (
    <aside className={`sidebar ${open ? "sidebar-open" : "sidebar-closed"}`}>
      <nav className="sidebar-tabs">
        <button
          type="button"
          className={`sidebar-tab ${tab === "conversations" ? "sidebar-tab-active" : ""}`}
          onClick={() => setTab("conversations")}
        >
          <MessagesSquare size={15} /> Conversations
        </button>
        <button
          type="button"
          className={`sidebar-tab ${tab === "schema" ? "sidebar-tab-active" : ""}`}
          onClick={() => setTab("schema")}
        >
          <Database size={15} /> Schema
        </button>
      </nav>
      <div className="sidebar-content">{tab === "conversations" ? conversationsSlot : schemaSlot}</div>
    </aside>
  );
}
