import { useState, type ReactNode } from "react";
import { Topbar } from "./Topbar.js";
import { Sidebar } from "./Sidebar.js";

export function AppShell({
  conversationsSlot,
  schemaSlot,
  children,
}: {
  conversationsSlot: ReactNode;
  schemaSlot: ReactNode;
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="app-shell">
      <Topbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <div className="app-shell-body">
        <Sidebar open={sidebarOpen} conversationsSlot={conversationsSlot} schemaSlot={schemaSlot} />
        <main className="app-shell-main">{children}</main>
      </div>
    </div>
  );
}
