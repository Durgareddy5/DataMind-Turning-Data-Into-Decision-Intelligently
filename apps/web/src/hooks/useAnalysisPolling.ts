import { useEffect, useRef, useState } from "react";
import { getAnalysis } from "../services/analyst.api.js";
import type { AnalysisJob } from "../types/api.js";

const POLL_INTERVAL_MS = 1200;

// Polls GET /api/v1/analysis/:id until the job settles (completed/failed).
// `initialJob` seeds state immediately from the 202 response so the UI shows
// "pending" the instant a question is sent, before the first poll returns.
export function useAnalysisPolling(initialJob: AnalysisJob | { id: string; status: "pending"; sessionId: string; question?: string }) {
  const [job, setJob] = useState<AnalysisJob>({
    id: initialJob.id,
    status: initialJob.status,
    question: "question" in initialJob ? (initialJob.question ?? "") : "",
    userId: "",
    sessionId: initialJob.sessionId,
    createdAt: new Date().toISOString(),
  });
  const settledRef = useRef(false);

  useEffect(() => {
    settledRef.current = job.status !== "pending";
    if (settledRef.current) return;

    let cancelled = false;

    async function poll() {
      while (!cancelled && !settledRef.current) {
        try {
          const latest = await getAnalysis(initialJob.id);
          if (cancelled) return;
          setJob(latest);
          if (latest.status !== "pending") {
            settledRef.current = true;
            return;
          }
        } catch {
          // Transient network/poll error — keep trying until the interval
          // above gives up; the UI stays in "pending" rather than flashing
          // an error for one dropped poll.
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }
    }

    void poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-poll if the job id itself changes
  }, [initialJob.id]);

  return job;
}
