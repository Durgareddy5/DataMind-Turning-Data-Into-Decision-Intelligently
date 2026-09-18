# Build context is the repo root.
# docker build -f apps/web/Dockerfile .

FROM node:24-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/observability/package.json packages/observability/package.json
COPY packages/sql-safety/package.json packages/sql-safety/package.json
COPY packages/rag/package.json packages/rag/package.json
COPY packages/ai-core/package.json packages/ai-core/package.json
COPY packages/agent-core/package.json packages/agent-core/package.json
RUN npm install
COPY apps/web ./apps/web
RUN npm run build --workspace=apps/web

FROM nginx:alpine AS runner
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
