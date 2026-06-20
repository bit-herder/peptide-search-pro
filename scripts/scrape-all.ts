import { runAllScrapers } from "../src/lib/scraper/engine";
import type { ScraperMode } from "../src/lib/scraper/providers";

const mode: ScraperMode =
  process.env.SCRAPER_MODE === "demo" ? "demo" : "live";

async function main() {
  console.log(`Starting scrape run (mode: ${mode})...\n`);
  const results = await runAllScrapers(mode);

  for (const r of results) {
    console.log(`${r.provider}: ${r.status} — ${r.productsFound} products`);
  }
}

main().catch(console.error);
