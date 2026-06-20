# Peptide Search Pro — What We Built

A **web-first peptide price comparison engine** designed to drive traffic to a parent site (Manus-hosted), capture emails, and help researchers find the lowest $/mg across tracked suppliers plus live web discovery.

---

## Product summary

| Layer | What it does |
|-------|----------------|
| **Search** | Compare peptide prices across **61 tracked suppliers** + **web-discovered listings** per query |
| **Scrapers** | Pull live prices from WooCommerce shops, VPR Members Club API, and catalog adapters |
| **Enrichment** | Each scrape builds a **provider profile** (catalog stats, COA rate, payment/shipping/lab signals) from supplier websites |
| **Tools** | Free calculator suite for research workflows (reconstitution, dosage, $/mg, units, blends) |
| **Auth** | Email sign-in after **5 free guest actions** (searches, outbound clicks, tool use) — list building |
| **SEO** | Peptide guide pages, provider directory, trust methodology page |

**Production data comes from the web** — not from a bundled local database. First deploy runs `POST /api/scrape` to populate Turso/Manus DB.

---

## Architecture

```
Next.js 15 (App Router) + React 19 + Tailwind 4
├── SQLite (local dev) / Turso libSQL (production)
├── Electron desktop app (optional macOS arm64)
└── Cron → /api/scrape every 6h (vercel.json reference)
```

### Key directories

| Path | Purpose |
|------|---------|
| `src/app/` | Pages + API routes |
| `src/lib/providers-config.ts` | **61 tracked supplier registry** |
| `src/lib/discovery/` | DuckDuckGo / SerpAPI / Google CSE → scrape product pages |
| `src/lib/scraper/` | WooCommerce, VPR tRPC, catalog adapters, profile enrichment |
| `src/lib/db/` | Schema, migrations, SQLite/Turso adapter |
| `src/lib/auth/` | Email session auth |
| `src/lib/guest-limits.ts` | 5-action free tier |
| `src/lib/trust.ts` | Trust score methodology (COA, catalog depth, freshness, editorial) |
| `scripts/with-native-node.js` | Fixes arm64 `better-sqlite3` on Apple Silicon |
| `MANUS.md` | Deploy guide for Manus + GitHub |

---

## Pages & routes

### Public pages

| Route | Description |
|-------|-------------|
| `/` | Search home with hero, suggestions, popular peptides |
| `/search?q=` | Results — tracked + discovered, sortable by price/$/mg/trust |
| `/providers` | All tracked suppliers with trust badges + enrichment snippets |
| `/vendors/[slug]` | Per-supplier profile panel, products, trust breakdown |
| `/peptides` | Peptide catalog index (SEO) |
| `/peptides/[slug]` | Per-peptide guide pages |
| `/tools` | Calculator hub + supplier intelligence cards |
| `/tools/reconstitution` | Peptide mg + bac water → concentration |
| `/tools/dosage` | Dose → syringe units |
| `/tools/price-per-mg` | Normalize vial value to $/mg |
| `/tools/units` | mg ↔ mcg ↔ g |
| `/tools/blend` | Two-peptide blend concentrations |
| `/how-we-score` | Trust score methodology |
| `/alerts` | Price alert signup |

### API routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/search` | GET | Search with `discover=true` default; merges tracked + web |
| `/api/suggest` | GET | Autocomplete from peptide catalog |
| `/api/stats` | GET | Provider/product counts |
| `/api/scrape` | POST | Run all scrapers (+ enrichment); requires `CRON_SECRET` |
| `/api/auth/signin` | POST | Email sign-in |
| `/api/auth/session` | GET | Current session |
| `/api/auth/signout` | POST | Sign out |
| `/api/alerts` | POST | Price alert subscription |

---

## How search works

1. **Tracked index** — Query matches peptide catalog + fuzzy search over scraped products from 61 suppliers.
2. **Web discovery** (default on) — For known peptides, runs up to **3 search queries**, scrapes up to **28 product URLs**, extracts price/name/dosage from pages.
3. **Merge & dedupe** — Tracked results first; discovered listings fill gaps; sorted by $/mg, price, trust, or name.

Discovery providers (in order): SerpAPI → Google Custom Search → DuckDuckGo HTML fallback.

---

## How scraping works

1. **Registry** — `src/lib/providers-config.ts` lists 61 enabled suppliers (Peptigrity-curated + probes).
2. **Adapters**:
   - `woocommerce` — Standard shop search (`?s=peptide&post_type=product`)
   - `vpr` — VPR Members Club public tRPC API
   - `catalog` — PureRawz fixed product paths
3. **Rate limit** — 2s between requests; identifies as `PeptideSearchPro/1.0`.
4. **Enrichment** — After each provider scrape, `buildProviderProfile()` aggregates catalog stats and fetches homepage/about/faq for payment, shipping, COA, compliance signals → stored as `profile_json`.
5. **Schedule** — `vercel.json` cron every 6 hours; or Manus cron pinging `/api/scrape`.

First full scrape of 61 suppliers takes ~15–45 minutes.

---

## Trust scores

Documented on `/how-we-score`. Factors:

- **COA coverage** (up to 35 pts) — share of listings with COA language
- **Catalog depth** (up to 25 pts) — SKU count indexed
- **Data freshness** (up to 20 pts) — last successful scrape
- **Editorial baseline** (up to 20 pts) — community reputation from registry

---

## Guest limits & auth

- **5 free actions** before UI greys out (`GUEST_ACTION_LIMIT` in `guest-limits.ts`)
- Actions: searches, outbound product link clicks, tool interactions
- **Email sign-in** unlocks unlimited use; emails stored for list building
- `SESSION_SECRET` required in production

---

## Environment variables

See `.env.example`. Required for production:

```env
SESSION_SECRET=...
CRON_SECRET=...
TURSO_DATABASE_URL=...      # recommended
TURSO_AUTH_TOKEN=...
NEXT_PUBLIC_PARENT_SITE_URL=...
NEXT_PUBLIC_PARENT_SITE_NAME=...
NEXT_PUBLIC_APP_URL=...
```

Optional: `SERPAPI_KEY`, `GOOGLE_CSE_*`, `SCRAPER_ENRICH_SITE=false`, `DISCOVERY_ENABLED=false`

---

## Deployment (Manus)

See **[MANUS.md](./MANUS.md)** for step-by-step:

1. Push this repo to GitHub
2. Connect Manus ↔ GitHub
3. Set env vars
4. `POST /api/scrape` once to seed prices from the web
5. Link from main site nav

---

## Desktop app (optional)

Electron wrapper for macOS arm64. Local SQLite in `data/`. Build with `npm run desktop:build` → `dist/mac-arm64/Peptide Search Pro.app`.

---

## Scripts

```bash
npm run dev          # Web dev server (port 3000)
npm run build        # Production build
npm run scrape       # Scrape all 61 suppliers + enrich profiles
npm run desktop:dev  # Electron window
npm run desktop:build
npm run rebuild:native  # Fix better-sqlite3 arch on Apple Silicon
```

---

## Legal

Independent price comparison tool — not a vendor. All products listed are for **laboratory research use only**.

## Scraping ethics

- Public product pages only
- Rate-limited, identified User-Agent
- No auth bypass or paywalls
