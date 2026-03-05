# Arc Pulse Analytics

Arc Pulse Analytics is a monorepo for serious Arc Network testnet telemetry and forecasting. It combines a low-latency Fastify API, a viem-based indexer, BullMQ workers, PostgreSQL rollups, Redis cache/rate limiting, and a Next.js dashboard.

## Monorepo layout

```text
apps/
  api/       Fastify REST API + SSE + auth + rate limiting
  indexer/   JSON-RPC indexer + aggregate refresh + market resolution worker
  web/       Next.js App Router dashboard and forecasting UI
packages/
  shared/    Zod schemas, shared constants and helpers
prisma/      Shared Prisma schema and initial migration
```

## Stack

- Frontend: Next.js App Router, TypeScript, Tailwind, TanStack Query, Recharts
- API: Fastify, Zod, Prisma, PostgreSQL, Redis
- Workers: BullMQ on Redis
- Indexing: viem JSON-RPC ingestion
- Deploy target: Vercel for `apps/web`, Railway/Render/Fly for `apps/api` and `apps/indexer`

## Environment variables

Copy `.env.example` to `.env` and set:

```bash
ARC_RPC_URL=
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/arc_pulse
REDIS_URL=redis://localhost:6379
JWT_SECRET=
NEXTAUTH_SECRET=
WEB_URL=http://localhost:3000
ALLOWED_ORIGIN=http://localhost:3000
ADMIN_EMAILS=admin@example.com
NEXT_PUBLIC_API_URL=http://localhost:4000
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Arc Pulse <no-reply@example.com>
METRICS_PORT=9100
OTEL_EXPORTER_OTLP_ENDPOINT=
OTEL_SERVICE_NAME=
```

## Local development

1. Start infrastructure:

```bash
docker compose up -d
```

2. Install dependencies:

```bash
pnpm install
```

3. Generate Prisma client and apply migration:

```bash
pnpm prisma:generate
pnpm migrate
pnpm seed
```

4. Start the full stack:

```bash
pnpm dev
```

Services:

- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- SSE: `GET /v1/stream/metrics`

## API surface

Core endpoints are under `/v1`:

- `GET /v1/health`
- `GET /v1/metrics/summary?window=1h|6h|24h|7d`
- `GET /v1/metrics/tps?from=&to=&bucket=60`
- `GET /v1/metrics/gas?from=&to=&bucket=3600`
- `GET /v1/top/contracts?window=24h&sort=gas|tx&page=&pageSize=`
- `GET /v1/blocks/recent?limit=`
- `GET /v1/tx/recent?limit=`
- `GET /v1/address/:addr/summary?window=`
- `GET /v1/markets?status=open|resolved`
- `POST /v1/markets` admin only
- `POST /v1/markets/:id/predict`
- `GET /v1/markets/:id`
- `POST /v1/markets/:id/resolve` admin only
- `GET /v1/leaderboard?period=7d|30d`
- `GET /v1/stream/metrics`
- `GET /v1/observability/metrics`

Responses are normalized as:

```json
{ "data": {}, "meta": {} }
```

Errors are normalized as:

```json
{ "error": { "message": "..." } }
```

## Indexer and aggregation model

- Indexer persists blocks, transactions and receipts with idempotent `upsert`.
- Checkpoint state is stored in `IndexerState`.
- Aggregate refresh writes `MetricMinute`, `MetricHour` and `ContractStatWindow`.
- Market resolution reads aggregate tables, computes Brier or MAE-style scores, and refreshes leaderboard snapshots.
- BullMQ queue `market-resolution` is used to defer market resolution until window end.

## Security

- Zod validation on all route inputs
- Prisma parameterized access, no raw string interpolation for user input
- JWT auth with `USER` and `ADMIN` roles
- Strict CORS from `ALLOWED_ORIGIN`
- Helmet, compression, request timeout, body limit
- Redis-backed global rate limit
- Audit logging for market creation/resolution and auth issuance
- Frontend CSP, referrer policy and content-type protections
- No secrets committed; all secrets come from env

## Performance notes

- `metrics/summary` cached in Redis for 5s
- Timeseries cached for 30-60s
- Top contracts cached for 30s
- Database schema includes indexes for timestamps, addresses, status and ranking windows
- API is stateless; indexer and workers run separately
- SSE reads the cached summary instead of hitting Postgres on every push

## Observability

- API Prometheus metrics: `GET /v1/observability/metrics`
- Indexer Prometheus metrics: `http://<indexer-host>:${METRICS_PORT:-9100}/`
- API metrics include request totals, request duration, SSE connections, dependency health, and error totals
- Indexer metrics include chain head, last indexed block, indexed block and transaction totals, batch duration, aggregate refresh failures, and market resolutions
- Local Prometheus + Grafana stack: `docker compose -f docker-compose.observability.yml up -d`
- Local Tempo tracing endpoint: `http://localhost:4318`
- Prometheus UI: `http://localhost:9090`
- Alertmanager UI: `http://localhost:9093`
- Grafana UI: `http://localhost:3001` with `admin` / `admin`
- Provisioned Grafana dashboards:
  - `Arc Pulse API`
  - `Arc Pulse Indexer`
  - `Arc Pulse Forecasting`
- Local alert rules live in [`deploy/observability/alerts.yml`](C:/Users/Joao/Desktop/dapp-arc/deploy/observability/alerts.yml)
- OpenTelemetry tracing is enabled when `OTEL_EXPORTER_OTLP_ENDPOINT` is set
- `OTEL_SERVICE_NAME` defaults to `arc-pulse-api` for the API and `arc-pulse-indexer` for the indexer
- For local tracing, set `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318`

## Authentication model

The MVP uses e-mail + magic-link login without requiring wallets.

- In development, `POST /v1/auth/request` returns the token in the response for convenience.
- In production, configure SMTP plus `WEB_URL`; the API sends a sign-in link to the user's email inbox.
- The frontend callback page lives at [`apps/web/app/auth/verify/page.tsx`](C:/Users/Joao/Desktop/dapp-arc/apps/web/app/auth/verify/page.tsx) and exchanges the magic link for a JWT session token.

## Deployment

### Vercel

- Project root: [`apps/web`](C:/Users/Joao/Desktop/dapp-arc/apps/web)
- Config file: [`apps/web/vercel.json`](C:/Users/Joao/Desktop/dapp-arc/apps/web/vercel.json)
- Checklist: [`deploy/vercel-checklist.md`](C:/Users/Joao/Desktop/dapp-arc/deploy/vercel-checklist.md)
- Required env:
  - `NEXT_PUBLIC_API_URL=https://your-api-domain`
- Recommended project settings:
  - Framework preset: `Next.js`
  - Root Directory: `apps/web`
  - Install Command: `pnpm install --frozen-lockfile`
  - Build Command: `pnpm --filter @arc-pulse/web build`
- The frontend CSP already uses `NEXT_PUBLIC_API_URL` in [`apps/web/next.config.ts`](C:/Users/Joao/Desktop/dapp-arc/apps/web/next.config.ts)

### Railway / Render / Fly.io

- API Dockerfile: [`Dockerfile.api`](C:/Users/Joao/Desktop/dapp-arc/Dockerfile.api)
- Indexer Dockerfile: [`Dockerfile.indexer`](C:/Users/Joao/Desktop/dapp-arc/Dockerfile.indexer)
- Railway checklist: [`deploy/railway-checklist.md`](C:/Users/Joao/Desktop/dapp-arc/deploy/railway-checklist.md)
- Final deploy checklist: [`deploy/final-deploy-checklist.md`](C:/Users/Joao/Desktop/dapp-arc/deploy/final-deploy-checklist.md)
- Ready-to-paste env templates:
  - [`deploy/railway-api.env.final.example`](C:/Users/Joao/Desktop/dapp-arc/deploy/railway-api.env.final.example)
  - [`deploy/railway-indexer.env.final.example`](C:/Users/Joao/Desktop/dapp-arc/deploy/railway-indexer.env.final.example)
  - [`deploy/vercel.env.final.example`](C:/Users/Joao/Desktop/dapp-arc/deploy/vercel.env.final.example)
- Manual release QA: [`deploy/manual-release-qa.md`](C:/Users/Joao/Desktop/dapp-arc/deploy/manual-release-qa.md)
- Launch checklist: [`deploy/launch-checklist.md`](C:/Users/Joao/Desktop/dapp-arc/deploy/launch-checklist.md)
- Rollback runbook: [`deploy/rollback-runbook.md`](C:/Users/Joao/Desktop/dapp-arc/deploy/rollback-runbook.md)
- Railway manifests:
  - [`deploy/railway-api.json`](C:/Users/Joao/Desktop/dapp-arc/deploy/railway-api.json)
  - [`deploy/railway-indexer.json`](C:/Users/Joao/Desktop/dapp-arc/deploy/railway-indexer.json)
- Fly manifests:
  - [`deploy/fly.api.toml`](C:/Users/Joao/Desktop/dapp-arc/deploy/fly.api.toml)
  - [`deploy/fly.indexer.toml`](C:/Users/Joao/Desktop/dapp-arc/deploy/fly.indexer.toml)

Recommended service split:

- `arc-pulse-api`
- `arc-pulse-indexer`
- managed PostgreSQL
- managed Redis 6+ or Upstash Redis

Required env for `api`:

```bash
NODE_ENV=production
PORT=4000
ARC_RPC_URL=https://rpc.testnet.arc.network
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=change-me
WEB_URL=https://your-vercel-domain.vercel.app
ALLOWED_ORIGIN=https://your-vercel-domain.vercel.app
ADMIN_EMAILS=admin@example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=user
SMTP_PASS=password
SMTP_FROM=Arc Pulse <no-reply@example.com>
METRICS_PORT=9100
```

Required env for `indexer`:

```bash
NODE_ENV=production
ARC_RPC_URL=https://rpc.testnet.arc.network
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
METRICS_PORT=9100
INDEXER_BOOTSTRAP_BLOCKS=5000
INDEXER_FORCE_START_BLOCK=
```

Release flow for API:

```bash
pnpm prisma:generate
pnpm migrate
pnpm --filter @arc-pulse/api start
```

Runtime command for indexer:

```bash
pnpm --filter @arc-pulse/indexer start
```

Notes:

- Redis 6+ is required for real runtime because BullMQ and Redis-backed rate limiting depend on commands not available in Redis 3.x.
- The API remains stateless. Run multiple replicas behind a proxy if traffic grows.
- The indexer should run as a single worker instance unless you add explicit shard coordination.
- For historical backfill, set `INDEXER_FORCE_START_BLOCK=0` once, wait until it catches up, then remove it.

### Fly.io quick start

API:

```bash
fly launch --config deploy/fly.api.toml --no-deploy
fly secrets set DATABASE_URL=... REDIS_URL=... ARC_RPC_URL=https://rpc.testnet.arc.network JWT_SECRET=... ALLOWED_ORIGIN=https://your-web-domain
fly deploy --config deploy/fly.api.toml
```

Indexer:

```bash
fly launch --config deploy/fly.indexer.toml --no-deploy
fly secrets set DATABASE_URL=... REDIS_URL=... ARC_RPC_URL=https://rpc.testnet.arc.network
fly deploy --config deploy/fly.indexer.toml
```

## Testing and quality

Available scripts:

```bash
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

API tests cover health, summary envelope and auth protection for prediction routes. They are included in the repo, but you still need PostgreSQL and Redis available locally for real execution.

## Production follow-ups

1. Add provider-specific mail templating, delivery analytics, and bounce handling.
2. Add OpenTelemetry exporters and Prometheus scraping on API/indexer.
3. Move aggregate refresh to dedicated BullMQ repeatable jobs if volume grows.
4. Add stronger test doubles for Prisma/Redis so CI can run route tests without infrastructure.
