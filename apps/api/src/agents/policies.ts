// App-level overrides for packages/agent-core's orchestration bounds.
// Left as the package's own defaults (15 / 3) unless there's a reason to
// diverge per-app — kept here so they're visible/tunable without touching
// the generic, reusable loop in packages/agent-core.
export const MAX_TOOL_CALLS = 15;
export const MAX_CONSECUTIVE_FAILURES = 3;
