# AI Data Analyst Copilot

Monorepo for an AI-powered data analyst copilot.

## Structure

- `apps/web` — React + TypeScript frontend
- `apps/api` — Node + TypeScript + Express backend
- `packages/shared-types` — Shared DTOs/types
- `packages/ai-core` — Gemini abstractions and prompts
- `packages/agent-core` — Agent orchestration
- `packages/sql-safety` — SQL parser + policy engine
- `packages/rag` — Embeddings/retrieval
- `packages/observability` — Logging/tracing helpers
- `docs/` — Architecture, API, prompts, ADRs
- `infra/` — Docker and deployment configs

## Getting started

```bash
cp .env.example .env
npm install
docker compose up -d      # starts Postgres
npm run dev:api            # starts the API
npm run dev:web             # starts the web app
```
# DataMind-Turning-Data-Into-Decision-Intelligently
