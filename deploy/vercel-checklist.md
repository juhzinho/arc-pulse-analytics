# Vercel Deploy Checklist

This checklist covers the frontend only.

Backend expectation:

- API already deployed on Railway, Render, or Fly
- public API URL already known

## 1. Create the Vercel project

Create a new Vercel project from this repository.

Use:

- Root Directory: `apps/web`
- Framework Preset: `Next.js`

Project config already present:

- [`apps/web/vercel.json`](C:/Users/Joao/Desktop/dapp-arc/apps/web/vercel.json)

## 2. Set environment variables

Set this variable in Vercel for Production, Preview, and Development as needed:

```bash
NEXT_PUBLIC_API_URL=https://<your-api-domain>
```

Template:

- [`deploy/web.env.production.example`](C:/Users/Joao/Desktop/dapp-arc/deploy/web.env.production.example)

Notes:

- use the final public API domain, not an internal Railway hostname
- keep the value HTTPS in production

## 3. Build settings

Vercel should use:

- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm --filter @arc-pulse/web build`
- Dev Command: `pnpm --filter @arc-pulse/web dev`

These are also defined in:

- [`apps/web/vercel.json`](C:/Users/Joao/Desktop/dapp-arc/apps/web/vercel.json)

## 4. Domain alignment

After Vercel assigns the frontend domain:

1. copy the Vercel production URL
2. update `ALLOWED_ORIGIN` in the API service to that exact origin
3. redeploy the API if needed

Example:

```bash
ALLOWED_ORIGIN=https://arc-pulse-analytics.vercel.app
```

## 5. First production verification

Check in browser:

- `/`
- `/contracts`
- `/forecasts`
- `/leaderboard`
- `/methodology`

Expected:

- dashboard loads without `500`
- cards show values
- recent blocks and tx tables render
- e-mail sign-in link lands on `/auth/verify` and stores the session token
- leaderboard page loads

## 6. Runtime verification

Open the browser devtools network tab and verify:

- requests go to `https://<your-api-domain>/v1/...`
- no CORS failures
- SSE stream connects to `/v1/stream/metrics`

## 7. Common failure modes

`500` on dashboard pages:

- `NEXT_PUBLIC_API_URL` missing or wrong
- API not reachable publicly

CORS errors:

- `ALLOWED_ORIGIN` in API does not exactly match the Vercel origin

SSE not updating:

- API domain blocked by CSP or CORS
- proxy buffering interfering upstream

## 8. Recommended production settings

- keep Preview deployments pointed at a preview-safe API, or disable preview exposure if you only have one production API
- add a custom domain before public launch
- set Vercel project to use the same Git branch policy as the API deployment flow
