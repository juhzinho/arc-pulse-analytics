# Manual Release QA

Use this immediately after deploying Railway and Vercel.

Goal:

- confirm the public app is healthy
- confirm real data is rendering
- confirm navigation and search work
- confirm auth and forecasting are not broken

## 1. Public URLs

Have these ready:

- web: `https://<your-vercel-domain>`
- api: `https://<your-api-domain>`

## 2. API smoke checks

Open these in the browser or with curl:

```bash
GET https://<your-api-domain>/v1/health
GET https://<your-api-domain>/v1/metrics/summary?window=24h
GET https://<your-api-domain>/v1/blocks/recent?limit=5
GET https://<your-api-domain>/v1/tx/recent?limit=5
GET https://<your-api-domain>/v1/search?q=1
```

Expected:

- `health` returns database and Redis `ok`
- summary returns non-empty values
- recent blocks and tx return real rows
- search resolves at least one indexed entity

## 3. Dashboard checks

Open:

- `/`

Verify:

- the page loads without `500`
- summary cards render
- charts render
- recent blocks table renders
- recent transactions table renders
- clicking a recent block opens `/blocks/:number`
- clicking a recent transaction opens `/tx/:hash`

## 4. Address checks

Open:

- `/address`

Paste a real address from the recent transaction list.

Verify:

- summary cards render
- activity table renders
- direction filters work
- counterparties table renders
- pagination works

## 5. Search checks

Use the sidebar search with:

- a block number
- a tx hash
- an address

Verify:

- address search opens a valid address result
- tx search opens a valid transaction result
- block search opens a valid block result
- each result links to the proper detail page

## 6. Block detail checks

Open any block detail page.

Verify:

- block number, hash, parent hash and timestamp render
- tx list renders
- tx links open transaction detail pages
- address links open address pages

## 7. Transaction detail checks

Open any transaction detail page.

Verify:

- hash, block, sender, recipient and gas values render
- block link opens block detail
- sender and recipient link to address pages

## 8. Forecasting checks

Open:

- `/forecasts`
- `/leaderboard`

Verify:

- forecasts load from API
- sign-in panel renders
- leaderboard renders

If SMTP is live:

- request a magic link with a real email
- click the email link
- confirm `/auth/verify` completes the session

## 9. Browser checks

Open browser devtools and verify:

- no CORS errors
- no repeated `500` responses
- SSE connects to `/v1/stream/metrics`
- no console errors related to hydration or auth

## 10. Go / no-go

Go if:

- dashboard works
- search works
- address page works
- block and tx pages work
- API health is good
- no CORS or auth regressions appear

No-go if:

- home page returns `500`
- API health fails
- search is broken
- address activity is empty for known active addresses
- indexer is not advancing
