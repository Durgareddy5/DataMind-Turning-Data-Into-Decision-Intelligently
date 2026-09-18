import { useState } from "react";
import { ChevronDown, ChevronRight, CircleCheck, CircleX, Wrench } from "lucide-react";
import { Card } from "../../components/ui/Card.js";
import type { OrchestrationStep } from "../../types/api.js";

function StepRow({ step }: { step: OrchestrationStep }) {
  const [expanded, setExpanded] = useState(false);

  if (step.type === "tool_result") return null; // paired with its tool_call row below

  const isCall = step.type === "tool_call";
  return (
    <li className="evidence-row">
      <button type="button" className="evidence-row-header" onClick={() => setExpanded((v) => !v)}>
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Wrench size={14} className="evidence-row-icon" />
        <span className="evidence-row-name">{step.name}</span>
        {isCall ? null : <CircleX size={14} className="evidence-row-status-critical" />}
      </button>
      {expanded && (
        <pre className="evidence-row-detail">
          {JSON.stringify(isCall ? step.args : { error: step.error }, null, 2)}
        </pre>
      )}
    </li>
  );
}

export function EvidencePanel({ steps }: { steps: OrchestrationStep[] }) {
  const callSteps = steps.filter((s) => s.type === "tool_call" || s.type === "tool_error");

  if (callSteps.length === 0) {
    return (
      <Card title="Evidence">
        <p className="evidence-empty">Answered directly from context, without calling any tools.</p>
      </Card>
    );
  }

  return (
    <Card title="Evidence" actions={<span className="card-meta"><CircleCheck size={12} /> {callSteps.length} step{callSteps.length === 1 ? "" : "s"}</span>}>
      <ul className="evidence-list">
        {callSteps.map((step, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <StepRow key={`${step.name}-${index}`} step={step} />
        ))}
      </ul>
    </Card>
  );
}
