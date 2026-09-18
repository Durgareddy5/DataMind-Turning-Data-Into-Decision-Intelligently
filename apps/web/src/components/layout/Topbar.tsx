import { LogOut, Menu } from "lucide-react";
import { Button } from "../ui/Button.js";
import { Badge } from "../ui/Badge.js";
import { useAuth } from "../../hooks/useAuth.js";

export function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <button type="button" className="topbar-menu-button" onClick={onToggleSidebar} aria-label="Toggle sidebar">
        <Menu size={20} />
      </button>
      <span className="topbar-title">AI Data Analyst Copilot</span>
      <div className="topbar-user">
        {user && (
          <>
            <span className="topbar-user-id">{user.id}</span>
            {user.roles.map((role) => (
              <Badge key={role} tone="neutral">
                {role}
              </Badge>
            ))}
          </>
        )}
        <Button variant="ghost" onClick={logout} aria-label="Log out">
          <LogOut size={16} />
        </Button>
      </div>
    </header>
  );
}
