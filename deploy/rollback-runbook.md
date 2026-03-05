# Rollback Runbook

Use this if the production release is unhealthy.

## Trigger conditions

- API healthcheck fails repeatedly
- indexer crashes repeatedly
- market creation or resolution is failing
- frontend is returning widespread `500`
- auth flow is broken for users

## 1. Stop the blast radius

- disable public announcement or traffic ramp-up
- pause deploys
- if needed, scale down the indexer first before touching the API

## 2. Identify the failing layer

- frontend only
- API only
- indexer only
- shared dependency issue such as Postgres, Redis, or SMTP

## 3. Roll back by layer

Frontend:

- redeploy the previous Vercel production deployment

API:

- redeploy the last known good Railway/Fly revision
- verify `GET /v1/health`

Indexer:

- redeploy the last known good worker revision
- verify `IndexerState.lastIndexedBlock` resumes moving

## 4. Database caution

- do not improvise destructive schema changes during incident response
- if the latest migration is incompatible, restore service revision first
- only execute database rollback steps that were prepared in advance

## 5. Post-rollback verification

- API healthcheck returns healthy
- dashboard loads
- auth flow works
- indexer is advancing
- no new crash loop is visible

## 6. Incident follow-up

- capture the failing revision
- capture the env delta
- capture the first bad timestamp
- write a short incident summary
- do not redeploy until root cause is understood
