import { discoverPeptideListings } from "../src/lib/discovery/engine";

async function main() {
  console.log("Testing web discovery for BPC-157...\n");
  const { listings, meta } = await discoverPeptideListings("BPC-157");
  console.log("Meta:", meta);
  console.log(`\nFound ${listings.length} web listings:\n`);
  for (const l of listings.slice(0, 8)) {
    console.log(`  $${l.price} — ${l.provider_name} — ${l.name.slice(0, 55)}`);
  }
}

main().catch(console.error);
