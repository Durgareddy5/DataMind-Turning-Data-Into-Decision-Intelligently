# Build context is the repo root (needed for npm workspaces resolution).
# docker build -f apps/api/Dockerfile .

FROM node:24-alpine AS base
WORKDIR /repo

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/observability/package.json packages/observability/package.json
COPY packages/sql-safety/package.json packages/sql-safety/package.json
COPY packages/rag/package.json packages/rag/package.json
COPY packages/ai-core/package.json packages/ai-core/package.json
COPY packages/agent-core/package.json packages/agent-core/package.json
RUN npm install

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
# Explicit order: each package only builds once its own workspace
# dependencies have their dist/ output in place (npm's own
# --workspaces build isn't topologically sorted).
RUN npm run build --workspace=packages/shared-types \
 && npm run build --workspace=packages/observability \
 && npm run build --workspace=packages/sql-safety \
 && npm run build --workspace=packages/rag \
 && npm run build --workspace=packages/ai-core \
 && npm run build --workspace=packages/agent-core \
 && npm run build --workspace=apps/api

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /repo/node_modules ./node_modules
COPY --from=build --chown=app:app /repo/package.json ./package.json
COPY --from=build --chown=app:app /repo/packages ./packages
COPY --from=build --chown=app:app /repo/apps/api ./apps/api
WORKDIR /repo/apps/api
USER app
EXPOSE 5001
CMD ["node", "dist/server.js"]
