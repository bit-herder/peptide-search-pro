import { logScrape, saveProviderProfile, upsertProduct, upsertProvider } from "../db";
import { buildProviderProfile } from "./enrichment";
import { slugify } from "../peptides";
import { getScraperAdapters, ScraperMode } from "./providers";
import { ScraperAdapter } from "./types";

export interface ScrapeRunResult {
  provider: string;
  status: "success" | "error" | "partial";
  productsFound: number;
  durationMs: number;
  error?: string;
}

export async function runScraper(adapter: ScraperAdapter): Promise<ScrapeRunResult> {
  const start = Date.now();
  const { config } = adapter;

  try {
    const providerId = await upsertProvider({
      slug: config.slug,
      name: config.name,
      website: config.website,
      trust_score: config.trust_score,
    });

    const products = await adapter.scrape();

    for (const product of products) {
      await upsertProduct(providerId, {
        ...product,
        slug: slugify(product.name),
      });
    }

    if (products.length > 0) {
      const profile = await buildProviderProfile(config.website, products, {
        fetchSite: process.env.SCRAPER_ENRICH_SITE !== "false",
      });
      await saveProviderProfile(config.slug, profile);
    }

    const durationMs = Date.now() - start;
    const status = products.length > 0 ? "success" : "partial";
    await logScrape(config.slug, status, products.length, durationMs);

    return {
      provider: config.slug,
      status,
      productsFound: products.length,
      durationMs,
    };
  } catch (err) {
    const durationMs = Date.now() - start;
    const message = err instanceof Error ? err.message : "Unknown error";
    await logScrape(config.slug, "error", 0, durationMs, message);

    return {
      provider: config.slug,
      status: "error",
      productsFound: 0,
      durationMs,
      error: message,
    };
  }
}

export async function runAllScrapers(mode?: ScraperMode): Promise<ScrapeRunResult[]> {
  const adapters = getScraperAdapters(mode);
  const results: ScrapeRunResult[] = [];

  for (const adapter of adapters) {
    const result = await runScraper(adapter);
    results.push(result);
  }

  return results;
}

export async function runScraperBySlug(
  slug: string,
  mode?: ScraperMode
): Promise<ScrapeRunResult | null> {
  const adapter = getScraperAdapters(mode).find((a) => a.config.slug === slug);
  if (!adapter) return null;
  return runScraper(adapter);
}
