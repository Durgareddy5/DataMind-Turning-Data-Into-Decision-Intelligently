import "../config/env.js";
import fs from "node:fs";
import path from "node:path";
import { validateQuery } from "@ai-data-analyst/sql-safety";
import { listAllowedTables } from "../modules/schema/schema.service.js";
import { buildSqlSafetyPolicy } from "../tools/sql/sqlSafetyPolicy.js";
import { closePool } from "../database/mysql.js";

const EVAL_ROOT = path.resolve(import.meta.dirname, "../../../../evaluation");
const CASES_DIR = path.join(EVAL_ROOT, "cases");
const EXPECTED_RESULTS_DIR = path.join(EVAL_ROOT, "expected", "results");
const REPORT_DIR = path.join(EVAL_ROOT, "report");

const API_BASE_URL = process.env.EVAL_API_BASE_URL ?? "http://localhost:5001";

// The LLM-driven categories each spend real Gemini quota (a free-tier key can
// burn its whole per-minute budget on one category). Gated behind this flag
// so the harness can't accidentally rack up calls — flip it on once billing
// removes the quota ceiling. malicious_sql is exempt: it never calls Gemini.
const LIVE_CALLS_ENABLED = process.env.EVAL_LIVE_CALLS_ENABLED === "true";
const LIVE_CATEGORIES = new Set(["basic_queries", "joins", "aggregations", "ambiguous_questions", "multi_turn"]);

const args = process.argv.slice(2);
const onlyArg = args.find((a) => a.startsWith("--only="));
const onlyCategories = onlyArg ? new Set(onlyArg.slice("--only=".length).split(",")) : null;

function loadJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function loadExpectedResult(id: string): any {
  return loadJson(path.join(EXPECTED_RESULTS_DIR, `${id}.json`));
}

// ---- number/text matching helpers ----

function numbersInText(text: string): number[] {
  const matches = text.match(/-?\d[\d,]*\.?\d*/g) ?? [];
  return matches.map((m) => parseFloat(m.replace(/,/g, ""))).filter((n) => !Number.isNaN(n));
}

function approxEqual(a: number, b: number, tolerance: number): boolean {
  if (!tolerance) return a === b;
  return Math.abs(a - b) <= tolerance * Math.max(Math.abs(a), Math.abs(b), 1);
}

interface ExecutedRows {
  columns: string[];
  rows: any[][];
}

function extractExecutedRows(steps: any[]): ExecutedRows | null {
  const execResult = [...steps].reverse().find((s) => s.type === "tool_result" && s.name === "execute_read_only_sql");
  return execResult ? execResult.result : null;
}

interface Correctness {
  dataCorrect: boolean;
  answerCorrect: boolean;
}

function checkScalar(expected: any, actual: ExecutedRows | null, answerText: string): Correctness {
  const tolerance = expected.tolerance ?? 0;
  const dataCorrect = actual
    ? actual.rows.some((row) => row.some((v) => typeof v === "number" && approxEqual(v, expected.value, tolerance)))
    : false;
  const answerCorrect = numbersInText(answerText).some((n) => approxEqual(n, expected.value, tolerance));
  return { dataCorrect, answerCorrect };
}

function checkSet(expected: any, actual: ExecutedRows | null, answerText: string): Correctness {
  const actualValues = actual ? actual.rows.flat().map((v) => String(v).toLowerCase()) : [];
  const dataCorrect = expected.values.every((v: string) => actualValues.includes(v.toLowerCase()));
  const lowerAnswer = answerText.toLowerCase();
  const answerCorrect = expected.values.every((v: string) => lowerAnswer.includes(v.toLowerCase()));
  return { dataCorrect, answerCorrect };
}

function checkRows(expected: any, actual: ExecutedRows | null, answerText: string): Correctness {
  const tolerance = expected.tolerance ?? 0;
  const dataCorrect = actual
    ? expected.expectedRows.every((expRow: any[]) =>
        actual.rows.some((actRow) =>
          expRow.every((val, i) => {
            const actVal = actRow[i];
            if (typeof val === "number") return typeof actVal === "number" && approxEqual(actVal, val, tolerance);
            return String(actVal).toLowerCase() === String(val).toLowerCase();
          })
        )
      )
    : false;

  const answerNumbers = numbersInText(answerText);
  const answerCorrect = expected.expectedRows
    .flat()
    .filter((v: any) => typeof v === "number")
    .every((v: number) => answerNumbers.some((n) => approxEqual(n, v, tolerance)));

  return { dataCorrect, answerCorrect };
}

function checkGrounded(expected: any, _actual: ExecutedRows | null, answerText: string): Correctness {
  const lower = answerText.toLowerCase();
  const mentionsRegion = expected.acceptableRegions.some((r: string) => lower.includes(r.toLowerCase()));
  const answerNumbers = numbersInText(answerText);
  const tolerance = expected.tolerance ?? 0.01;
  const mentionsNumber = expected.acceptableNumbers.some((n: number) => answerNumbers.some((an) => approxEqual(an, n, tolerance)));
  const grounded = mentionsRegion && mentionsNumber;
  return { dataCorrect: grounded, answerCorrect: grounded };
}

function scoreCorrectness(expected: any, actual: ExecutedRows | null, answerText: string): Correctness {
  switch (expected.type) {
    case "scalar":
      return checkScalar(expected, actual, answerText);
    case "set":
      return checkSet(expected, actual, answerText);
    case "rows":
      return checkRows(expected, actual, answerText);
    case "grounded":
      return checkGrounded(expected, actual, answerText);
    default:
      throw new Error(`Unknown expected result type: ${expected.type}`);
  }
}

// ---- HTTP client for the live system (auth + analyze) ----

const tokenCache = new Map<string, string>();

async function loginAs(role: string): Promise<string> {
  const cached = tokenCache.get(role);
  if (cached) return cached;

  const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: role, password: `${role}123` }),
  });
  const body: any = await res.json();
  if (!res.ok) throw new Error(`Login failed for role "${role}": ${body.error}`);
  tokenCache.set(role, body.token);
  return body.token;
}

const POLL_INTERVAL_MS = 500;
const POLL_TIMEOUT_MS = 60_000;

// POST /api/v1/analysis starts an async job; this polls GET /:id until it
// settles, then returns the OrchestrationResult fields at the top level
// (plus analysisRunId/sessionId) — the same shape the old synchronous
// endpoint returned, so the scoring logic below didn't need to change.
async function callAnalyze(token: string, question: string, sessionId?: string): Promise<any> {
  const startRes = await fetch(`${API_BASE_URL}/api/v1/analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ question, sessionId }),
  });
  const started: any = await startRes.json();
  if (!startRes.ok) throw new Error(started.error ?? "failed to start analysis");

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const pollRes = await fetch(`${API_BASE_URL}/api/v1/analysis/${started.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const job: any = await pollRes.json();
    if (!pollRes.ok) throw new Error(job.error ?? "failed to poll analysis");

    if (job.status === "completed") {
      return { ...job.result, analysisRunId: job.id, sessionId: job.sessionId };
    }
    if (job.status === "failed") {
      throw new Error(job.error ?? "analysis failed");
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error(`Timed out waiting for analysis ${started.id}`);
}

// ---- Per-category runners ----

interface NlCaseResult {
  id: string;
  category: string;
  latencyMs: number;
  sqlValid: boolean | null;
  sqlExecuted: boolean | null;
  dataCorrect: boolean | null;
  answerCorrect: boolean | null;
  toolCallFailures: number;
  toolCallTotal: number;
  geminiCallCount: number;
  tokenUsage: { promptTokens: number; candidatesTokens: number; totalTokens: number };
  terminationReason: string;
  error?: string;
}

const ZERO_USAGE = { promptTokens: 0, candidatesTokens: 0, totalTokens: 0 };

async function runNlCase(caseDef: any): Promise<NlCaseResult> {
  const start = Date.now();
  try {
    const token = await loginAs(caseDef.role);
    const result = await callAnalyze(token, caseDef.question);
    const latencyMs = Date.now() - start;

    const toolCalls = result.steps.filter((s: any) => s.type === "tool_call");
    const toolErrors = result.steps.filter((s: any) => s.type === "tool_error");
    const attemptedSql = toolCalls.some((s: any) => s.name === "execute_read_only_sql");
    const sqlErrors = toolErrors.filter((s: any) => s.name === "execute_read_only_sql" || s.name === "validate_sql");

    const executed = extractExecutedRows(result.steps);
    const expected = loadExpectedResult(caseDef.id);
    const correctness = scoreCorrectness(expected, executed, result.answer);

    return {
      id: caseDef.id,
      category: caseDef.category,
      latencyMs,
      sqlValid: attemptedSql ? sqlErrors.length === 0 : null,
      sqlExecuted: attemptedSql ? executed !== null : null,
      dataCorrect: correctness.dataCorrect,
      answerCorrect: correctness.answerCorrect,
      toolCallFailures: toolErrors.length,
      toolCallTotal: toolCalls.length,
      geminiCallCount: result.geminiCallCount,
      tokenUsage: result.tokenUsage,
      terminationReason: result.terminationReason,
    };
  } catch (err) {
    return {
      id: caseDef.id,
      category: caseDef.category,
      latencyMs: Date.now() - start,
      sqlValid: null,
      sqlExecuted: null,
      dataCorrect: false,
      answerCorrect: false,
      toolCallFailures: 0,
      toolCallTotal: 0,
      geminiCallCount: 0,
      tokenUsage: ZERO_USAGE,
      terminationReason: "error",
      error: (err as Error).message,
    };
  }
}

interface MultiTurnResult {
  id: string;
  category: string;
  contextAccuracyOk: boolean;
  turns: NlCaseResult[];
}

async function runMultiTurnCase(caseDef: any): Promise<MultiTurnResult> {
  const expected = loadExpectedResult(caseDef.id);
  const sessionId = `eval-${caseDef.id}-${Date.now()}`;
  const token = await loginAs(caseDef.role);
  const turns: NlCaseResult[] = [];
  let contextAccuracyOk = true;

  for (let i = 0; i < caseDef.turns.length; i++) {
    const start = Date.now();
    try {
      const result = await callAnalyze(token, caseDef.turns[i].question, sessionId);
      const latencyMs = Date.now() - start;
      const executed = extractExecutedRows(result.steps);
      const expectedTurn = { ...expected.turns[i], tolerance: expected.tolerance };
      const correctness = scoreCorrectness(expectedTurn, executed, result.answer);

      if (expectedTurn.mustMentionFromPriorTurn) {
        const haystack = `${result.answer} ${JSON.stringify(executed ?? {})}`.toLowerCase();
        contextAccuracyOk = contextAccuracyOk && haystack.includes(expectedTurn.mustMentionFromPriorTurn.toLowerCase());
      }

      const toolCalls = result.steps.filter((s: any) => s.type === "tool_call");
      const toolErrors = result.steps.filter((s: any) => s.type === "tool_error");

      turns.push({
        id: `${caseDef.id}_turn${i + 1}`,
        category: caseDef.category,
        latencyMs,
        sqlValid: null,
        sqlExecuted: executed !== null,
        dataCorrect: correctness.dataCorrect,
        answerCorrect: correctness.answerCorrect,
        toolCallFailures: toolErrors.length,
        toolCallTotal: toolCalls.length,
        geminiCallCount: result.geminiCallCount,
        tokenUsage: result.tokenUsage,
        terminationReason: result.terminationReason,
      });
    } catch (err) {
      contextAccuracyOk = false;
      turns.push({
        id: `${caseDef.id}_turn${i + 1}`,
        category: caseDef.category,
        latencyMs: Date.now() - start,
        sqlValid: null,
        sqlExecuted: null,
        dataCorrect: false,
        answerCorrect: false,
        toolCallFailures: 0,
        toolCallTotal: 0,
        geminiCallCount: 0,
        tokenUsage: ZERO_USAGE,
        terminationReason: "error",
        error: (err as Error).message,
      });
    }
  }

  return { id: caseDef.id, category: caseDef.category, contextAccuracyOk, turns };
}

interface MaliciousCaseResult {
  id: string;
  category: string;
  passed: boolean;
  expectRejected: boolean;
  actuallyRejected: boolean;
  reason?: string;
}

async function runMaliciousCase(caseDef: any): Promise<MaliciousCaseResult> {
  const user = { id: `eval-${caseDef.role}`, roles: [caseDef.role] };
  const allowedTables = await listAllowedTables(user);
  const policy = buildSqlSafetyPolicy(allowedTables, user);
  const result = validateQuery(caseDef.sql, policy);

  const actuallyRejected = !result.valid;
  const rejectionMatches = caseDef.expectRejected === actuallyRejected;
  const reasonMatches = caseDef.expectReasonContains
    ? (result.reason ?? "").includes(caseDef.expectReasonContains)
    : true;

  return {
    id: caseDef.id,
    category: caseDef.category,
    passed: rejectionMatches && (caseDef.expectRejected ? reasonMatches : true),
    expectRejected: caseDef.expectRejected,
    actuallyRejected,
    reason: result.reason,
  };
}

// ---- Main ----

async function main(): Promise<void> {
  const categoryFiles: Record<string, string> = {
    basic_queries: "basic_queries.json",
    joins: "joins.json",
    aggregations: "aggregations.json",
    ambiguous_questions: "ambiguous_questions.json",
    malicious_sql: "malicious_sql.json",
    multi_turn: "multi_turn.json",
  };

  const categoriesToRun = onlyCategories
    ? Object.keys(categoryFiles).filter((c) => onlyCategories.has(c))
    : Object.keys(categoryFiles);

  console.log(`Running categories: ${categoriesToRun.join(", ")}`);

  const nlResults: NlCaseResult[] = [];
  const multiTurnResults: MultiTurnResult[] = [];
  const maliciousResults: MaliciousCaseResult[] = [];

  const skippedCategories: string[] = [];

  for (const category of categoriesToRun) {
    if (LIVE_CATEGORIES.has(category) && !LIVE_CALLS_ENABLED) {
      skippedCategories.push(category);
      console.log(
        `  [${category}] SKIPPED — live Gemini calls are disabled. Set EVAL_LIVE_CALLS_ENABLED=true in apps/api/.env to run this category (spends real API quota).`
      );
      continue;
    }

    const cases = loadJson(path.join(CASES_DIR, categoryFiles[category]));

    if (category === "malicious_sql") {
      for (const c of cases) {
        const r = await runMaliciousCase(c);
        maliciousResults.push(r);
        console.log(`  [malicious_sql] ${c.id}: ${r.passed ? "PASS" : "FAIL"} (expected rejected=${r.expectRejected}, actual=${r.actuallyRejected})`);
      }
      continue;
    }

    if (category === "multi_turn") {
      for (const c of cases) {
        console.log(`  [multi_turn] ${c.id}: running ${c.turns.length} turns...`);
        const r = await runMultiTurnCase(c);
        multiTurnResults.push(r);
        console.log(`  [multi_turn] ${c.id}: contextAccuracyOk=${r.contextAccuracyOk}`);
      }
      continue;
    }

    for (const c of cases) {
      console.log(`  [${category}] ${c.id}: running...`);
      const r = await runNlCase(c);
      nlResults.push(r);
      console.log(`  [${category}] ${c.id}: dataCorrect=${r.dataCorrect} answerCorrect=${r.answerCorrect} latency=${r.latencyMs}ms tokens=${r.tokenUsage.totalTokens}`);
    }
  }

  const report = buildReport(nlResults, multiTurnResults, maliciousResults, categoriesToRun, skippedCategories);

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportPath = path.join(REPORT_DIR, `run-${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log("\n=== Summary ===");
  console.log(JSON.stringify(report.metrics, null, 2));
  console.log(`\nFull report written to ${reportPath}`);

  await closePool();
}

function rate(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

function buildReport(
  nlResults: NlCaseResult[],
  multiTurnResults: MultiTurnResult[],
  maliciousResults: MaliciousCaseResult[],
  categoriesRun: string[],
  skippedCategories: string[]
) {
  const allNlAndTurns = [...nlResults, ...multiTurnResults.flatMap((m) => m.turns)];

  const sqlAttempted = allNlAndTurns.filter((r) => r.sqlValid !== null);
  const sqlValidityRate = rate(sqlAttempted.filter((r) => r.sqlValid).length, sqlAttempted.length);
  const sqlExecAttempted = allNlAndTurns.filter((r) => r.sqlExecuted !== null);
  const sqlExecutionSuccessRate = rate(sqlExecAttempted.filter((r) => r.sqlExecuted).length, sqlExecAttempted.length);

  const answerCorrectness = rate(allNlAndTurns.filter((r) => r.answerCorrect).length, allNlAndTurns.length);
  const businessMetricCorrectness = rate(allNlAndTurns.filter((r) => r.dataCorrect).length, allNlAndTurns.length);
  // Citation/evidence correctness: does the final answer's claim actually match
  // what the executed query returned (not just the ground truth) — grounding
  // check, distinct from whether the ground truth itself was hit.
  const evidenceGrounded = rate(
    allNlAndTurns.filter((r) => r.dataCorrect && r.answerCorrect).length,
    allNlAndTurns.length
  );

  const expectedRejections = maliciousResults.filter((r) => r.expectRejected);
  const expectedAllowed = maliciousResults.filter((r) => !r.expectRejected);
  const unsafeQueryRejectionRate = rate(expectedRejections.filter((r) => r.passed).length, expectedRejections.length);
  const falsePositiveRate = rate(expectedAllowed.filter((r) => !r.passed).length, expectedAllowed.length);

  const latencies = allNlAndTurns.filter((r) => !r.error).map((r) => r.latencyMs);
  const averageLatencyMs = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : null;

  const totalTokens = allNlAndTurns.reduce((sum, r) => sum + r.tokenUsage.totalTokens, 0);
  const totalGeminiCalls = allNlAndTurns.reduce((sum, r) => sum + r.geminiCallCount, 0);

  const toolCallFailures = allNlAndTurns.reduce((sum, r) => sum + r.toolCallFailures, 0);
  const toolCallTotal = allNlAndTurns.reduce((sum, r) => sum + r.toolCallTotal, 0);
  const toolCallFailureRate = rate(toolCallFailures, toolCallTotal);

  const multiTurnContextAccuracy = rate(
    multiTurnResults.filter((m) => m.contextAccuracyOk).length,
    multiTurnResults.length
  );

  return {
    generatedAt: new Date().toISOString(),
    categoriesRun,
    skippedCategories,
    liveCallsEnabled: LIVE_CALLS_ENABLED,
    metrics: {
      sqlValidityRate,
      sqlExecutionSuccessRate,
      answerCorrectness,
      businessMetricCorrectness,
      citationEvidenceCorrectness: evidenceGrounded,
      unsafeQueryRejectionRate,
      unsafeQueryFalsePositiveRate: falsePositiveRate,
      averageLatencyMs,
      geminiTokenUsage: {
        totalTokens,
        totalGeminiCalls,
        avgTokensPerCall: totalGeminiCalls ? totalTokens / totalGeminiCalls : null,
        note: "Raw token counts only — translating to $ cost requires the current Gemini pricing sheet, which this harness does not hardcode.",
      },
      toolCallFailureRate,
      multiTurnContextAccuracy,
    },
    nlResults,
    multiTurnResults,
    maliciousResults,
  };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
