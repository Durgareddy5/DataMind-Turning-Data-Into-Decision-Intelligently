import { useState, type FormEvent } from "react";
import { SendHorizonal } from "lucide-react";
import { Button } from "../../components/ui/Button.js";

export function MessageInput({ onSend, disabled }: { onSend: (question: string) => void; disabled?: boolean }) {
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <textarea
        className="message-input-textarea"
        placeholder="Ask a question about your data…"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSubmit(event);
          }
        }}
        rows={2}
      />
      <Button type="submit" disabled={disabled || value.trim().length === 0} aria-label="Send">
        <SendHorizonal size={16} />
      </Button>
    </form>
  );
}
