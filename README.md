# PeptideSearch Pro

**The Google of peptides** — a price comparison search engine that scans research peptide suppliers across the web and shows you the best deals.

## Features

- **Instant search** — Find any research peptide by name, alias, or brand name (BPC-157, Semaglutide, Ozempic, etc.)
- **Price normalization** — Results sorted by $/mg so you compare dosages fairly
- **Multi-provider scraping** — 60+ tracked WooCommerce shops + VPR API + live web discovery
- **Trust scores** — COA availability and community reputation baked into provider rankings
- **Live refresh** — Cron job re-scrapes every 6 hours (configurable)

## Quick Start (local dev)

```bash
npm install
npm run dev         # Start at http://localhost:3000
```

Prices and provider profiles are **fetched from the web** on scrape — no local DB seed required for production. For local testing:

```bash
npm run scrape      # optional: populate data/peptides.db from live suppliers
```

**Deploy to Manus:** see [MANUS.md](./MANUS.md).  
**Full build documentation:** see [PROJECT.md](./PROJECT.md).

## Desktop App (macOS)

Peptide Search Pro ships as a native macOS desktop app via Electron. The app starts a local Next.js server and opens it in a desktop window. SQLite data lives in the project `data/` folder during development and in the app’s user data directory when packaged.

### Run the desktop app in development

```bash
npm install
npm run db:setup       # once, if you have not already
npm run desktop:dev    # opens the Electron window
```

### Build a double-clickable `.app`

```bash
npm run db:setup       # ensure data/peptides.db exists
npm run desktop:build  # builds Next.js + packages macOS app
```

The packaged app is written to:

```text
dist/mac-arm64/Peptide Search Pro.app
```

Copy that `.app` to your Desktop or `/Applications` and double-click to launch.

> **Note:** The first packaged build downloads Electron and can take a few minutes. On first launch, the app copies the bundled seed database into `~/Library/Application Support/Peptide Search Pro/data/`. Later scrapes and DB updates persist there.

### Desktop limitations

- Builds target **macOS Apple Silicon (arm64)** only.
- The app is **code-signed locally** but **not notarized**; macOS may show a Gatekeeper prompt the first time you open it (right-click → Open, or allow in System Settings → Privacy & Security).
- Native modules (`better-sqlite3`) must match your CPU architecture. If dev mode fails to load SQLite, run `npm run rebuild:native`.
- The project folder name contains a space; native rebuilds use a `~/PeptideSearchPro` symlink when present. Avoid deleting that symlink if you rely on desktop builds.
- Packaged builds take ~2–3 minutes (Next.js standalone + Electron packaging).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run desktop:dev` | Launch the Electron desktop app (dev mode) |
| `npm run desktop:build` | Build a macOS `.app` in `dist/` |
| `npm run db:setup` | Initialize SQLite DB and run all scrapers |
| `npm run scrape` | Re-run all scrapers |
| `npm run build` | Production build |

## Architecture

```
src/
├── app/                  # Next.js App Router pages + API routes
│   ├── api/search/       # Search endpoint
│   ├── api/scrape/       # Scraper trigger (cron + manual)
│   └── search/           # Search results page
├── components/           # React UI components
└── lib/
    ├── db.ts             # SQLite database layer
    ├── peptides.ts       # Peptide catalog + parsing utilities
    ├── search.ts         # Fuzzy search engine
    └── scraper/
        ├── adapters.ts   # WooCommerce, catalog, and demo scrapers
        ├── engine.ts     # Scraper orchestration
        └── providers.ts  # Provider registry
```

## Adding a New Provider

1. Add the provider to `src/lib/scraper/providers.ts`
2. Choose a scraper adapter:
   - `createWooCommerceScraper` — for standard WooCommerce shops
   - `createCatalogScraper` — for known product URL paths
   - `createDemoScraper` — for development/demo data
3. Run `npm run scrape` to index their products

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CRON_SECRET` | Bearer token to protect the `/api/scrape` endpoint |

## Deployment (Web — recommended)

PeptideSearch Pro is built to live on the **web** as a traffic driver for your main site: free tools, price search, and SEO peptide pages that funnel users back to your brand.

### Manus + GitHub (your setup)

If your main site is already on **[Manus](https://manus.im)** with a backend and database, this is the intended production path:

| Piece | Where it lives |
|-------|----------------|
| **Code** | GitHub (Manus ↔ GitHub two-way sync, or push this repo manually) |
| **Live database** | Manus managed DB (MySQL by default) — **not** in GitHub |
| **Hosting** | Manus (Autoscale or Reserved) or same domain via custom path |

**Important:** GitHub holds **source code**, not your production database. You can commit a seed file like `data/peptides.db` for first deploy only, but ongoing price data comes from scrapers writing to the live DB.

#### Integration options

**A. Subdomain (simplest)**  
Deploy PeptideSearch Pro as its own Manus project or connected repo → `search.yoursite.com`. Link from your main Manus site nav. Set:

```env
NEXT_PUBLIC_PARENT_SITE_URL=https://yoursite.com
NEXT_PUBLIC_PARENT_SITE_NAME=Your Brand
NEXT_PUBLIC_APP_URL=https://search.yoursite.com
```

**B. Same domain, subpath**  
Mount under your existing site, e.g. `yoursite.com/peptide-search`. Set `NEXT_PUBLIC_BASE_PATH=/peptide-search` and add a rewrite in your Manus project routing.

**C. Merge into your Manus GitHub repo**  
Copy or submodule this repo into your Manus-synced GitHub repo. Share auth/emails later via your existing Manus backend API.

#### Database on Manus

Manus projects typically use **managed MySQL**. This app currently uses **SQLite locally** and **Turso (libSQL)** when `TURSO_DATABASE_URL` is set.

| Option | Best when |
|--------|-----------|
| **Turso** (`TURSO_DATABASE_URL`) | Fastest path — no changes to your Manus MySQL; run scrapers via `/api/scrape` |
| **Manus MySQL** | One database for everything — requires adding peptide tables to your existing schema (we can wire this next) |
| **SQLite file** | Manus **Reserved** hosting with persistent disk — omit Turso vars, use `data/peptides.db` |

After deploy, seed prices once:

```bash
curl -X POST https://search.yoursite.com/api/scrape \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Use **Reserved** hosting on Manus if scrapes run long or you need cron without cold starts.

#### GitHub workflow

1. Use your Manus-linked GitHub repo ([GitHub integration docs](https://manus.im/docs/website-builder/github-integration))
2. Push this project (or merge into the repo)
3. Set env vars in Manus (`SESSION_SECRET`, `CRON_SECRET`, `TURSO_*` or future MySQL URL)
4. Publish from Manus
5. Add nav links on your main site → Search, Tools, Peptide guides

---

### Alternative: Vercel + Turso

| Layer | Service |
|-------|---------|
| Hosting | [Vercel](https://vercel.com) |
| Database | [Turso](https://turso.tech) |
| Cron | Vercel cron → `/api/scrape` every 6 hours |

```bash
vercel link && vercel deploy --prod
```

Set `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `SESSION_SECRET`, `CRON_SECRET` in Vercel env.

### Environment variables

See `.env.example` for discovery API keys, session secret, Turso, and parent site URLs.

## Deployment (Desktop — optional)

See [Desktop App (macOS)](#desktop-app-macos) above. Desktop builds set `DESKTOP_BUILD=1` for standalone output and use local SQLite.

## Legal Disclaimer

PeptideSearch Pro is an independent price comparison tool. We are not a peptide vendor. All products listed are for **laboratory research use only**. Users are responsible for verifying supplier credentials, COAs, and compliance with applicable laws.

## Scraping Ethics

- Respects rate limits (2s between requests)
- Identifies itself via User-Agent
- Only indexes publicly available product pages
- Does not bypass authentication or paywalls
