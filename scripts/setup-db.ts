import { seedAliases } from "../src/lib/db";
import { runAllScrapers } from "../src/lib/scraper/engine";
import type { ScraperMode } from "../src/lib/scraper/providers";

function getMode(): ScraperMode {
  const arg = process.argv.find((a) => a === "--live" || a === "--demo");
  if (arg === "--live") return "live";
  if (arg === "--demo") return "demo";
  return process.env.SCRAPER_MODE === "demo" ? "demo" : "live";
}

async function main() {
  const mode = getMode();
  console.log(`Setting up database (scraper mode: ${mode})...\n`);
  await seedAliases();

  if (mode === "demo") {
    console.log(
      "Using demo scrapers (synthetic prices). Run `npm run scrape` for live data.\n"
    );
  } else {
    console.log(
      "Running live scrapers across all tracked providers (this may take 10–20 minutes)...\n"
    );
  }

  const results = await runAllScrapers(mode);

  let total = 0;
  for (const r of results) {
    const icon = r.status === "success" ? "✓" : r.status === "partial" ? "~" : "✗";
    console.log(
      `${icon} ${r.provider}: ${r.productsFound} products (${r.durationMs}ms)${r.error ? ` — ${r.error}` : ""}`
    );
    total += r.productsFound;
  }

  console.log(`\nDone. ${total} total products indexed.`);
}

main().catch(console.error);
