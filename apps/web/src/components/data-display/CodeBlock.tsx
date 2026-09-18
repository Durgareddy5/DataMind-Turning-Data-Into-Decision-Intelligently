import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CodeBlock({ code, language = "sql" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — silently no-op, not worth surfacing an error for.
    }
  }

  return (
    <div className="code-block" data-language={language}>
      <button type="button" className="code-block-copy" onClick={handleCopy} aria-label="Copy code">
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
