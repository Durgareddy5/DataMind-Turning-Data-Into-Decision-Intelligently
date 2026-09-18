# Evaluation harness

A benchmark for the AI Data Analyst Copilot, run before claiming the AI "works."

## Layout

```
evaluation/
├── cases/            test inputs, grouped by category
├── expected/
│   ├── sql/          human-authored reference SQL (for review, not string-matched)
│   └── results/      ground truth, computed by running the reference SQL directly
│                      against the real database — never guessed
└── report/           JSON reports from each run (gitignored)
```

## Running it

From `apps/api`, with the dev server running (`npm run dev`) and a valid `GEMINI_API_KEY`
in `.env`:

```bash
npm run eval                        # everything
npm run eval -- --only=malicious_sql            # one category
npm run eval -- --only=basic_queries,joins       # a few categories
```

**`malicious_sql` needs no running server and no Gemini calls at all** — it calls
`validateQuery()` from `sql-safety` directly, so it's free to run as often as you like.

**Every other category (`basic_queries`, `joins`, `aggregations`, `ambiguous_questions`,
`multi_turn`) is gated behind `EVAL_LIVE_CALLS_ENABLED`** in `apps/api/.env`. It defaults
to `false` — on a free-tier Gemini key, they cost real, easily-exhausted quota, so they're
disconnected until a paid subscription is in place. Requesting one of these categories
while the flag is off just logs `SKIPPED` for it and moves on; nothing breaks, nothing
gets called. Set `EVAL_LIVE_CALLS_ENABLED=true` once billing removes that ceiling.

## How each category is tested

- **basic_queries / joins / aggregations / ambiguous_questions**: sends the question to
  the live `/api/analyze` endpoint, logged in as the case's role, and scores the response
  against `expected/results/<id>.json`.
- **malicious_sql**: calls `validateQuery()` in-process with the case's raw SQL and the
  role's real access policy, and checks whether it was rejected (or, for one case,
  correctly *not* rejected — a false-positive guard).
- **multi_turn**: runs each turn in the same session, then checks the follow-up turn's
  answer/data actually references the entity established in the prior turn (e.g. "that"
  correctly resolves to "South India").

## Metrics

| Metric | What it measures |
|---|---|
| `sqlValidityRate` | Of the SQL Gemini wrote, how much passed our `validateQuery` (parsed, single SELECT, in-policy)? |
| `sqlExecutionSuccessRate` | Of the SQL that validated, how much actually ran against MySQL and returned rows? |
| `answerCorrectness` | Does the final natural-language answer state the correct value(s)? |
| `businessMetricCorrectness` | Does the *executed query's data* match the ground truth? (a data-layer check, separate from whether the answer text reported it correctly) |
| `citationEvidenceCorrectness` | Is the answer actually grounded in its own tool results — both correct *and* consistent with what was retrieved? |
| `unsafeQueryRejectionRate` | Of the SQL that should be rejected (`malicious_sql`, `expectRejected: true`), how much was? |
| `unsafeQueryFalsePositiveRate` | Of the benign SQL that should be *allowed* (`expectRejected: false`), how much was wrongly rejected? Should be 0. |
| `averageLatencyMs` | Wall-clock time per question, end to end. |
| `geminiTokenUsage` | Real `promptTokenCount`/`candidatesTokenCount`/`totalTokenCount` from Gemini's own response metadata, summed and averaged. **Token counts only** — turning this into a $ figure needs the current Gemini pricing sheet, which isn't hardcoded here since prices change. |
| `toolCallFailureRate` | Of all tool calls made, how many errored? |
| `multiTurnContextAccuracy` | Of the multi-turn cases, how many correctly carried context from one turn to the next? |

## Adding a new case

1. Add the case to the right `cases/*.json` file (question, role, id).
2. Write the reference SQL by hand in `expected/sql/<id>.sql`.
3. Run that reference SQL directly against the database to get the real ground truth
   (don't guess numbers), and save it as `expected/results/<id>.json` in one of the
   shapes above (`scalar`, `set`, `rows`, `grounded`, or `multi_turn`).

## Current known limits

- Case counts per LLM-requiring category are intentionally small (1-2 each) because the
  Gemini API key in use is free-tier and rate-limited — see the project memory
  `orchestration_loop_scaling_plan` for the full story. Expand the case files once
  billing removes that constraint.
- `businessMetricCorrectness` and `citationEvidenceCorrectness` are currently computed
  from the same underlying checks (ground-truth match in the executed data vs. in the
  final answer text) rather than from independent signals — there's no separate citation
  mechanism (e.g. inline source references) in the product yet for evidence correctness
  to check beyond that.
- Column-level RBAC coverage in `malicious_sql.json` is deliberately anchored to the
  *real* current policy (`sales`/`hr` table grants) rather than synthetic denied-column
  cases, since `DENIED_COLUMNS` is empty in production right now.
