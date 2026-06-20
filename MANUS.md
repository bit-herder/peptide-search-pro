# Manus deployment guide

This repo is ready for GitHub → Manus sync. **Manus holds the live database and hosting; GitHub holds the code.**

## What this app does

1. **Price search** — Compares peptides across **60+ tracked suppliers** plus **live web discovery** (DuckDuckGo by default; SerpAPI/Google CSE optional).
2. **Scrape + enrich** — Cron hits `/api/scrape`; each run indexes prices and builds **provider profiles** (catalog stats, payment/shipping/COA signals) from supplier websites. No local seed required in production.
3. **Free tools** — Reconstitution, dosage, price-per-mg, units, blend calculators at `/tools`.
4. **Guest → sign-in** — 5 free actions (searches, outbound clicks, tool use), then email sign-in to continue and build your list.

## First-time Manus setup

### 1. Push this repo to GitHub

```bash
git init   # if not already
git add .
git commit -m "Peptide Search Pro — web-ready for Manus"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Connect Manus to GitHub

In your Manus project: link the GitHub repo ([Manus GitHub integration](https://manus.im/docs/website-builder/github-integration)).

### 3. Environment variables (Manus dashboard)

| Variable | Required | Purpose |
|----------|----------|---------|
| `SESSION_SECRET` | Yes | Signs auth cookies (random 32+ chars) |
| `CRON_SECRET` | Yes | Protects `POST /api/scrape` |
| `TURSO_DATABASE_URL` | Recommended | Production DB (libSQL) |
| `TURSO_AUTH_TOKEN` | With Turso | DB auth token |
| `NEXT_PUBLIC_PARENT_SITE_URL` | Yes | Your main site URL (traffic funnel) |
| `NEXT_PUBLIC_PARENT_SITE_NAME` | Yes | Brand name in header/footer |
| `NEXT_PUBLIC_APP_URL` | Yes | Where this tool is hosted |
| `SERPAPI_KEY` | Optional | Better web discovery (Google results) |
| `GOOGLE_CSE_API_KEY` + `GOOGLE_CSE_ID` | Optional | Alternative web search |

Omit Turso only if using Manus **Reserved** hosting with persistent disk and local SQLite (not typical).

### 4. Seed production prices (once)

After first deploy:

```bash
curl -X POST https://<your-app-url>/api/scrape \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Scrape indexes **60+ suppliers** (~15–45 min first run). Schedule repeat runs every 6h (Manus cron or external ping to `/api/scrape`).

### 5. Link from your main site

Add nav links to:

- `/` — search home
- `/tools` — calculator suite
- `/peptides` — SEO peptide guides
- `/providers` — supplier directory

Set `NEXT_PUBLIC_PARENT_SITE_URL` so the header links back to your main Manus site.

## Architecture notes for Manus agents

| Path | Role |
|------|------|
| `src/lib/providers-config.ts` | Tracked supplier registry (~60 shops) |
| `src/lib/discovery/` | Live web search + product page extraction |
| `src/lib/scraper/` | WooCommerce, VPR API, catalog scrapers + profile enrichment |
| `src/lib/db/` | SQLite (dev) / Turso (prod) adapter |
| `src/app/api/scrape/route.ts` | Cron entry — populates DB from the web |
| `src/app/api/search/route.ts` | Tracked + discovered results (`discover=true` default) |
| `vercel.json` | Cron schedule reference (use on Manus if supported) |

**Enrichment is web-sourced:** `profile_json` on providers is written during scrape from live catalog + site pages — not shipped in the repo.

## Database

- **Do not commit** `data/peptides.db` (gitignored). Production data lives in Turso or Manus-managed storage.
- Schema + migrations: `src/lib/db/schema.ts`, `src/lib/db/migrations.ts`

## Verify after deploy

- [ ] `GET /api/stats` returns provider/product counts
- [ ] `GET /api/search?q=bpc-157` returns tracked + discovered results
- [ ] `/tools/reconstitution` loads and calculates
- [ ] Guest limit triggers sign-in modal after 5 actions
- [ ] `POST /api/scrape` completes (check logs)

## Optional: subdomain vs subpath

**Subdomain (recommended):** `search.yoursite.com` — set `NEXT_PUBLIC_APP_URL` accordingly.

**Subpath:** `yoursite.com/peptide-search` — set `NEXT_PUBLIC_BASE_PATH=/peptide-search` and configure Manus routing.
