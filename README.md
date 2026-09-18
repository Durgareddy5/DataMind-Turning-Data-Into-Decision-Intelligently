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

### Option A: everything in Docker

```bash
cp .env.example .env                  # compose-level MySQL provisioning vars
cp apps/api/.env.example apps/api/.env  # fill in GEMINI_API_KEY, JWT_SECRET, etc.
docker compose up --build
```

This builds and starts `mysql` (seeded with the real schema + demo data from
`infra/mysql/init/`), `chroma` (local vector store), `api` (`localhost:5001`),
and `web` (`localhost:8080`, proxying `/api/*` to `api`).

### Option B: local dev, no Docker

```bash
cp apps/api/.env.example apps/api/.env  # point MYSQL_HOST at your own MySQL instance
npm install
npm run dev:api    # apps/api, via npm workspaces
npm run dev:web    # apps/web
```

# DataMind-Turning-Data-Into-Decision-Intelligently
