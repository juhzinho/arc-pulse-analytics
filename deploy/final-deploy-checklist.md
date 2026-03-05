# Final Deploy Checklist

This is the shortest path to put Arc Pulse Analytics online with:

- frontend on Vercel
- API on Railway
- indexer on Railway
- Postgres + Redis on Railway

Use this file as the release runbook.

Ready-to-paste templates:

- API: [`deploy/railway-api.env.final.example`](C:/Users/Joao/Desktop/dapp-arc/deploy/railway-api.env.final.example)
- Indexer: [`deploy/railway-indexer.env.final.example`](C:/Users/Joao/Desktop/dapp-arc/deploy/railway-indexer.env.final.example)
- Web: [`deploy/vercel.env.final.example`](C:/Users/Joao/Desktop/dapp-arc/deploy/vercel.env.final.example)
- Manual QA: [`deploy/manual-release-qa.md`](C:/Users/Joao/Desktop/dapp-arc/deploy/manual-release-qa.md)

## 1. Deploy order

Deploy in this exact order:

1. PostgreSQL
2. Redis
3. `arc-pulse-api`
4. `arc-pulse-indexer`
5. Vercel frontend

Reason:

- the API needs the database schema ready
- the indexer needs the API database ready
- the frontend needs the public API URL

## 2. Railway resources

Inside one Railway project, create:

- PostgreSQL
- Redis
- service `arc-pulse-api`
- service `arc-pulse-indexer`

## 3. API envs

Set these on `arc-pulse-api`:

```bash
NODE_ENV=production
PORT=4000
ARC_RPC_URL=https://rpc.testnet.arc.network
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<long-random-secret>
WEB_URL=https://<your-vercel-domain>
ALLOWED_ORIGIN=https://<your-vercel-domain>
ADMIN_EMAILS=<your-admin-email>
SMTP_HOST=<smtp-host>
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<smtp-user>
SMTP_PASS=<smtp-password>
SMTP_FROM=Arc Pulse <no-reply@your-domain>
METRICS_PORT=9100
INDEXER_BOOTSTRAP_BLOCKS=5000
OTEL_EXPORTER_OTLP_ENDPOINT=
OTEL_SERVICE_NAME=arc-pulse-api
```

Use:

- Dockerfile: [`Dockerfile.api`](C:/Users/Joao/Desktop/dapp-arc/Dockerfile.api)
- manifest: [`deploy/railway-api.json`](C:/Users/Joao/Desktop/dapp-arc/deploy/railway-api.json)

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

## 4. Indexer envs

Set these on `arc-pulse-indexer`:

```bash
NODE_ENV=production
ARC_RPC_URL=https://rpc.testnet.arc.network
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
METRICS_PORT=9100
INDEXER_BOOTSTRAP_BLOCKS=5000
OTEL_EXPORTER_OTLP_ENDPOINT=
OTEL_SERVICE_NAME=arc-pulse-indexer
```

Use:

- Dockerfile: [`Dockerfile.indexer`](C:/Users/Joao/Desktop/dapp-arc/Dockerfile.indexer)
- manifest: [`deploy/railway-indexer.json`](C:/Users/Joao/Desktop/dapp-arc/deploy/railway-indexer.json)

Start command:

```bash
pnpm --filter @arc-pulse/indexer start
```

Rule:

- run one replica only

## 5. Vercel envs

Create one Vercel project using:

- Root Directory: `apps/web`
- Framework Preset: `Next.js`

Set:

```bash
NEXT_PUBLIC_API_URL=https://<your-api-domain>
```

Use:

- config: [`apps/web/vercel.json`](C:/Users/Joao/Desktop/dapp-arc/apps/web/vercel.json)

Recommended build settings:

- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm --filter @arc-pulse/web build`

## 6. Required alignment

After Vercel gives you the production URL:

1. copy the exact URL
2. set `WEB_URL` in the API to that value
3. set `ALLOWED_ORIGIN` in the API to that value
4. redeploy the API

Example:

```bash
WEB_URL=https://arc-pulse-analytics.vercel.app
ALLOWED_ORIGIN=https://arc-pulse-analytics.vercel.app
```

## 7. Smoke test after deploy

Check API:

```bash
GET https://<api-domain>/v1/health
GET https://<api-domain>/v1/metrics/summary?window=24h
GET https://<api-domain>/v1/blocks/recent?limit=5
GET https://<api-domain>/v1/search?q=1
```

Check web:

- `/`
- `/address`
- `/search?q=1`
- `/contracts`
- `/forecasts`
- `/leaderboard`

Expected:

- dashboard renders
- address page renders
- search returns block or transaction results when indexed
- no CORS errors
- no `500` on home

## 8. Launch blockers

Do not launch publicly if any of these are still true:

- `ALLOWED_ORIGIN` is wildcard or wrong
- SMTP is not configured
- API health is failing
- indexer is not advancing blocks
- Redis is older than 6.x
- the frontend points to a private or wrong API URL

## 9. What is already ready

The deployed product already supports:

- real Arc testnet metrics
- cached reads with user-facing freshness target within 30 seconds
- SSE summary updates
- address lookup and wallet activity
- global search for address, tx hash and block number
- forecasting markets and leaderboard

## 10. Recommended launch path

1. deploy Railway API
2. verify `/v1/health`
3. deploy Railway indexer
4. wait for block ingestion
5. deploy Vercel web
6. set final `WEB_URL` and `ALLOWED_ORIGIN`
7. rerun smoke tests
8. launch
