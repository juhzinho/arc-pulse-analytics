# Production Launch Checklist

Use this before opening Arc Pulse Analytics to real users.

## 1. Infrastructure

- PostgreSQL is managed and automated backups are enabled
- Redis is Redis 6+ or Upstash Redis
- API, indexer, and frontend are deployed from the same release revision
- production domains are final
- TLS is enabled on every public endpoint

## 2. Environment and secrets

- `DATABASE_URL` points to production Postgres
- `REDIS_URL` points to production Redis
- `ARC_RPC_URL` points to the intended Arc environment
- `JWT_SECRET` is long and randomly generated
- `SMTP_*` variables are configured and tested
- `WEB_URL` matches the public frontend domain
- `ALLOWED_ORIGIN` exactly matches the frontend origin
- `ADMIN_EMAILS` contains only trusted operators
- no development secrets remain in any production environment

## 3. Database and data safety

- `pnpm migrate` completed successfully in production
- seed-only development data is not present unless explicitly intended
- indexes exist and query plans were checked for summary and leaderboard endpoints
- `IndexerState` is advancing after deploy
- `MetricMinute`, `MetricHour`, and `ContractStatWindow` are populating
- restore procedure from latest backup is documented

## 4. Authentication and access control

- magic link flow sends real e-mails in production
- `/auth/verify` works from a real inbox click
- admin-only routes reject non-admin users
- API audit log is capturing sensitive actions
- expired magic links are rejected
- CORS only allows the production frontend

## 5. API and worker behavior

- `GET /v1/health` returns healthy checks
- `/v1/observability/metrics` is scrapeable
- `GET /v1/metrics/summary` responds with real indexed data
- `GET /v1/stream/metrics` works through the production proxy
- creating a market enqueues resolution successfully
- indexer consumes new Arc blocks without crashing
- indexer metrics endpoint responds on `METRICS_PORT`
- one end-to-end market flow has been tested in production-like conditions

## 6. Frontend verification

- dashboard loads without server errors
- recent blocks and tx tables render real data
- forecasts page signs in correctly via e-mail link
- leaderboard page loads
- methodology page renders
- browser console is free of auth, CORS, and SSE errors

## 7. Security controls

- no `.env` or secrets are present in the repo or deployment artifacts
- CSP is active on the frontend
- Helmet headers are present on API responses
- rate limiting is active against Redis
- logs do not leak magic link tokens, JWTs, or passwords
- production SMTP credentials have least privilege

## 8. Observability

- API logs are centralized
- indexer logs are centralized
- Prometheus can scrape API and indexer metrics
- Alertmanager is receiving and displaying alerts if used
- Grafana dashboards are loading if used
- traces are arriving in the configured OTLP backend if tracing is enabled
- alerting exists for API crash loops
- alerting exists for indexer crash loops
- alerting exists for database connectivity failures
- alerting exists for Redis connectivity failures
- error rates and restart counts are visible in the hosting platform

## 9. Performance sanity checks

- summary endpoint latency is acceptable under light load
- Redis cache hit behavior was observed in production
- recent blocks and tx endpoints return quickly
- indexer keeps up with live chain head under current throughput
- no unexpected memory growth is visible in API or indexer

## 10. Rollback readiness

- previous stable deployment revision is known
- previous stable env snapshot is available
- rollback procedure has been written and reviewed
- production database migration rollback strategy is understood
- someone on the team can execute rollback without improvisation

## 11. Go / no-go decision

Go only if:

- health, auth, indexing, market resolution, and frontend checks all passed
- backups and alerting are confirmed
- rollback path is confirmed

Do not launch if:

- indexer is behind and not recovering
- SMTP is unverified
- CORS or CSP errors are still present
- Redis version is below 6
- production secrets were copied from development
