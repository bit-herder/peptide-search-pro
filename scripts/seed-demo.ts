import { seedAliases } from "../src/lib/db";
import { runAllScrapers } from "../src/lib/scraper/engine";

async function main() {
  console.log("Seeding database with demo provider data...\n");
  await seedAliases();
  const results = await runAllScrapers("demo");

  let total = 0;
  for (const r of results) {
    console.log(`${r.provider}: ${r.productsFound} products`);
    total += r.productsFound;
  }
  console.log(`\nDone. ${total} demo products indexed.`);
}

main().catch(console.error);
