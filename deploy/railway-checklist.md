# Railway Deploy Checklist

This checklist assumes:

- frontend on Vercel
- `api` on Railway
- `indexer` on Railway
- managed PostgreSQL and Redis on Railway

## 1. Create resources

Inside one Railway project, create:

- PostgreSQL
- Redis
- service `arc-pulse-api`
- service `arc-pulse-indexer`

Use the repo root for both services.

## 2. API service

Attach:

- PostgreSQL
- Redis

Use:

- manifest: [`deploy/railway-api.json`](C:/Users/Joao/Desktop/dapp-arc/deploy/railway-api.json)
- dockerfile: [`Dockerfile.api`](C:/Users/Joao/Desktop/dapp-arc/Dockerfile.api)

Set these variables on `arc-pulse-api`:

```bash
NODE_ENV=production
PORT=4000
ARC_RPC_URL=https://rpc.testnet.arc.network
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<strong-random-secret>
WEB_URL=https://<your-vercel-domain>
ALLOWED_ORIGIN=https://<your-vercel-domain>
ADMIN_EMAILS=admin@example.com
INDEXER_BOOTSTRAP_BLOCKS=5000
SMTP_HOST=<smtp-host>
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<smtp-user>
SMTP_PASS=<smtp-password>
SMTP_FROM=Arc Pulse <no-reply@your-domain>
METRICS_PORT=9100
OTEL_EXPORTER_OTLP_ENDPOINT=https://<your-otlp-endpoint>
OTEL_SERVICE_NAME=arc-pulse-api
```

Release command:

```bash
pnpm prisma:generate && pnpm migrate
```

Start command:

```bash
pnpm --filter @arc-pulse/api start
```

Healthcheck:

```bash
/v1/health
```

Prometheus metrics:

```bash
/v1/observability/metrics
```

## 3. Indexer service

Attach:

- PostgreSQL
- Redis

Use:

- manifest: [`deploy/railway-indexer.json`](C:/Users/Joao/Desktop/dapp-arc/deploy/railway-indexer.json)
- dockerfile: [`Dockerfile.indexer`](C:/Users/Joao/Desktop/dapp-arc/Dockerfile.indexer)

Set these variables on `arc-pulse-indexer`:

```bash
NODE_ENV=production
ARC_RPC_URL=https://rpc.testnet.arc.network
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
METRICS_PORT=9100
INDEXER_BOOTSTRAP_BLOCKS=5000
OTEL_EXPORTER_OTLP_ENDPOINT=https://<your-otlp-endpoint>
OTEL_SERVICE_NAME=arc-pulse-indexer
```

Start command:

```bash
pnpm --filter @arc-pulse/indexer start
```

Metrics endpoint:

```bash
http://<indexer-host>:9100/
```

Notes:

- keep a single `indexer` replica initially
- if you need full history later, set `INDEXER_START_BLOCK`

## 4. Frontend on Vercel

Create one Vercel project pointing at [`apps/web`](C:/Users/Joao/Desktop/dapp-arc/apps/web).

Set:

```bash
NEXT_PUBLIC_API_URL=https://<your-railway-api-domain>
```

Vercel should use:

- config: [`apps/web/vercel.json`](C:/Users/Joao/Desktop/dapp-arc/apps/web/vercel.json)

## 5. First deploy order

Deploy in this order:

1. PostgreSQL + Redis
2. `arc-pulse-api`
3. `arc-pulse-indexer`
4. Vercel frontend

Reason:

- API needs schema migrated first
- indexer needs API database already prepared
- frontend needs final API URL

## 6. Post-deploy verification

Check API:

```bash
GET https://<api-domain>/v1/health
GET https://<api-domain>/v1/metrics/summary?window=24h
GET https://<api-domain>/v1/blocks/recent?limit=5
```

Check indexer progress:

- `Block` count growing in Postgres
- `IndexerState.lastIndexedBlock` moving forward
- `MetricMinute` and `MetricHour` rows appearing

Check web:

- dashboard loads
- summary cards render
- recent blocks and tx tables render
- forecasts page reaches API

## 7. Production notes

- use Redis 6+ or Upstash Redis; Redis 3.x is not supported for runtime
- configure SMTP before public launch so magic links are delivered by email
- keep `ALLOWED_ORIGIN` pinned to the real frontend domain
- rotate `JWT_SECRET` before launch
- do not run multiple indexers until checkpoint coordination is explicitly designed
