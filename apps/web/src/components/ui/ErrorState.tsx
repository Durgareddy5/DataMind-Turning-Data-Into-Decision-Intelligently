import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "./Button.js";

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-state">
      <AlertTriangle size={18} className="error-state-icon" aria-hidden />
      <div className="error-state-body">
        <p className="error-state-message">{message}</p>
        {onRetry ? (
          <Button variant="secondary" onClick={onRetry}>
            <RotateCw size={14} /> Retry
          </Button>
        ) : null}
      </div>
    </div>
  );
}
