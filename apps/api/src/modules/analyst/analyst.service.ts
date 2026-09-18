import { v4 as uuidv4 } from "uuid";
import type { AuthUser } from "@ai-data-analyst/shared-types";
import type { OrchestrationResult } from "@ai-data-analyst/agent-core";
import { runAnalysis } from "../../agents/analyst.agent.js";
import { NotFoundError } from "../../shared/errors/AppError.js";

export type AnalysisStatus = "pending" | "completed" | "failed";

export interface AnalysisJob {
  id: string;
  status: AnalysisStatus;
  question: string;
  userId: string;
  sessionId: string;
  createdAt: string;
  completedAt?: string;
  result?: OrchestrationResult;
  error?: string;
}

// In-memory placeholder — same pattern as conversations.store.ts. The job's
// id doubles as the analysisRunId used throughout the orchestration loop's
// logging, so GET /api/v1/audit/:analysisId and this job share one id.
const jobs = new Map<string, AnalysisJob>();

export function createAnalysisJob(params: { question: string; user: AuthUser; sessionId?: string }): AnalysisJob {
  const id = uuidv4();
  const sessionId = params.sessionId ?? uuidv4();
  const job: AnalysisJob = {
    id,
    status: "pending",
    question: params.question,
    userId: params.user.id,
    sessionId,
    createdAt: new Date().toISOString(),
  };
  jobs.set(id, job);

  // Fire-and-forget: the HTTP layer returns immediately with the job id;
  // callers poll getAnalysisJob(id) for the result.
  runAnalysis(params.question, params.user, sessionId, id)
    .then((result) => {
      job.status = "completed";
      job.result = result;
      job.completedAt = new Date().toISOString();
    })
    .catch((err) => {
      job.status = "failed";
      job.error = err instanceof Error ? err.message : String(err);
      job.completedAt = new Date().toISOString();
    });

  return job;
}

export function getAnalysisJob(id: string): AnalysisJob {
  const job = jobs.get(id);
  if (!job) throw new NotFoundError(`Analysis "${id}" not found`);
  return job;
}
