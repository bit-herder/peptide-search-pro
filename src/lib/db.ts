import { getAdapter } from "./db/adapter";
import type { ProviderProfile } from "./scraper/profile-types";
import { parseProviderProfile } from "./db/migrations";

export interface Provider {
  id: number;
  slug: string;
  name: string;
  website: string;
  logo_url: string | null;
  trust_score: number;
  is_active: number;
  last_scraped_at: string | null;
}

export interface Product {
  id: number;
  provider_id: number;
  external_id: string | null;
  name: string;
  slug: string;
  peptide_key: string;
  dosage_mg: number | null;
  dosage_label: string | null;
  price: number;
  price_per_mg: number | null;
  currency: string;
  in_stock: number;
  product_url: string;
  image_url: string | null;
  purity: string | null;
  has_coa: number;
  scraped_at: string;
}

export interface ProductWithProvider extends Product {
  provider_name: string;
  provider_slug: string;
  provider_website: string;
  provider_trust_score: number;
}

export interface SearchResult {
  query: string;
  peptide_key: string | null;
  total: number;
  providers_count: number;
  lowest_price: number | null;
  lowest_price_per_mg: number | null;
  results: ProductWithProvider[];
  popular_peptides: { key: string; label: string; count: number }[];
}

export async function upsertProvider(provider: {
  slug: string;
  name: string;
  website: string;
  logo_url?: string;
  trust_score?: number;
}) {
  const database = await getAdapter();
  const existing = await database.get<{ id: number }>(
    "SELECT id FROM providers WHERE slug = ?",
    [provider.slug]
  );

  if (existing) {
    await database.run(
      `UPDATE providers SET name = ?, website = ?, logo_url = COALESCE(?, logo_url),
       trust_score = COALESCE(?, trust_score), last_scraped_at = datetime('now')
       WHERE slug = ?`,
      [
        provider.name,
        provider.website,
        provider.logo_url ?? null,
        provider.trust_score ?? null,
        provider.slug,
      ]
    );
    return existing.id;
  }

  const result = await database.run(
    `INSERT INTO providers (slug, name, website, logo_url, trust_score, last_scraped_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [
      provider.slug,
      provider.name,
      provider.website,
      provider.logo_url ?? null,
      provider.trust_score ?? 0,
    ]
  );
  return result.lastInsertRowid;
}

export async function upsertProduct(
  providerId: number,
  product: {
    external_id: string;
    name: string;
    slug: string;
    peptide_key: string;
    dosage_mg?: number | null;
    dosage_label?: string | null;
    price: number;
    price_per_mg?: number | null;
    currency?: string;
    in_stock?: boolean;
    product_url: string;
    image_url?: string | null;
    purity?: string | null;
    has_coa?: boolean;
  }
) {
  const database = await getAdapter();
  await database.run(
    `INSERT INTO products (
      provider_id, external_id, name, slug, peptide_key, dosage_mg, dosage_label,
      price, price_per_mg, currency, in_stock, product_url, image_url, purity, has_coa, scraped_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(provider_id, external_id) DO UPDATE SET
      name = excluded.name,
      slug = excluded.slug,
      peptide_key = excluded.peptide_key,
      dosage_mg = excluded.dosage_mg,
      dosage_label = excluded.dosage_label,
      price = excluded.price,
      price_per_mg = excluded.price_per_mg,
      currency = excluded.currency,
      in_stock = excluded.in_stock,
      product_url = excluded.product_url,
      image_url = excluded.image_url,
      purity = excluded.purity,
      has_coa = excluded.has_coa,
      scraped_at = datetime('now')`,
    [
      providerId,
      product.external_id,
      product.name,
      product.slug,
      product.peptide_key,
      product.dosage_mg ?? null,
      product.dosage_label ?? null,
      product.price,
      product.price_per_mg ?? null,
      product.currency ?? "USD",
      product.in_stock !== false ? 1 : 0,
      product.product_url,
      product.image_url ?? null,
      product.purity ?? null,
      product.has_coa ? 1 : 0,
    ]
  );
}

export async function logScrape(
  providerSlug: string,
  status: "success" | "error" | "partial",
  productsFound: number,
  durationMs: number,
  errorMessage?: string
) {
  const database = await getAdapter();
  await database.run(
    `INSERT INTO scrape_logs (provider_slug, status, products_found, duration_ms, error_message)
     VALUES (?, ?, ?, ?, ?)`,
    [providerSlug, status, productsFound, durationMs, errorMessage ?? null]
  );
}

export async function getAllProductsWithProviders(): Promise<ProductWithProvider[]> {
  const database = await getAdapter();
  return database.all<ProductWithProvider>(
    `SELECT p.*, pr.name as provider_name, pr.slug as provider_slug,
            pr.website as provider_website, pr.trust_score as provider_trust_score
     FROM products p
     JOIN providers pr ON p.provider_id = pr.id
     WHERE pr.is_active = 1
     ORDER BY p.price ASC`
  );
}

export async function getPopularPeptides(limit = 12) {
  const database = await getAdapter();
  return database.all<{ key: string; label: string; count: number }>(
    `SELECT peptide_key as key,
            REPLACE(peptide_key, '-', ' ') as label,
            COUNT(*) as count
     FROM products
     GROUP BY peptide_key
     ORDER BY count DESC
     LIMIT ?`,
    [limit]
  );
}

export async function getProviderStats() {
  const database = await getAdapter();
  const providers = await database.get<{ count: number }>(
    "SELECT COUNT(*) as count FROM providers WHERE is_active = 1"
  );
  const products = await database.get<{ count: number }>(
    "SELECT COUNT(*) as count FROM products"
  );
  const lastScrape = await database.get<{ last: string | null }>(
    "SELECT MAX(scraped_at) as last FROM scrape_logs WHERE status = 'success'"
  );
  return {
    providers: providers?.count ?? 0,
    products: products?.count ?? 0,
    lastScraped: lastScrape?.last ?? null,
  };
}

export async function seedAliases() {
  const database = await getAdapter();
  const aliases: [string, string][] = [
    ["bpc-157", "bpc157"],
    ["bpc-157", "body protection compound"],
    ["tb-500", "tb500"],
    ["tb-500", "thymosin beta-4"],
    ["semaglutide", "ozempic"],
    ["semaglutide", "wegovy"],
    ["tirzepatide", "mounjaro"],
    ["tirzepatide", "zepbound"],
    ["retatrutide", "ly3437943"],
    ["ipamorelin", "ipa"],
    ["cjc-1295", "cjc1295"],
    ["ghk-cu", "copper peptide"],
    ["pt-141", "bremelanotide"],
    ["melanotan-ii", "mt2"],
    ["melanotan-ii", "melanotan 2"],
    ["aod-9604", "aod9604"],
    ["mots-c", "motsc"],
    ["nad-plus", "nad+"],
    ["nad-plus", "nicotinamide adenine dinucleotide"],
    ["sermorelin", "grf 1-29"],
    ["tesamorelin", "egrifta"],
    ["epitalon", "epithalon"],
    ["selank", "selank peptide"],
    ["semax", "semax peptide"],
    ["thymosin-alpha-1", "ta1"],
    ["thymosin-alpha-1", "thymosin alpha 1"],
  ];

  for (const [key, alias] of aliases) {
    await database.run("INSERT OR IGNORE INTO peptide_aliases (peptide_key, alias) VALUES (?, ?)", [
      key,
      alias.toLowerCase(),
    ]);
  }
}

export async function getProductsByPeptideKey(peptideKey: string, limit = 50) {
  const database = await getAdapter();
  return database.all<ProductWithProvider>(
    `SELECT p.*, pr.name as provider_name, pr.slug as provider_slug,
            pr.website as provider_website, pr.trust_score as provider_trust_score
     FROM products p
     JOIN providers pr ON p.provider_id = pr.id
     WHERE p.peptide_key = ? AND pr.is_active = 1 AND p.in_stock = 1
     ORDER BY COALESCE(p.price_per_mg, p.price) ASC
     LIMIT ?`,
    [peptideKey, limit]
  );
}

export async function getPeptideListingStats(peptideKey: string) {
  const database = await getAdapter();
  const row = await database.get<{
    listings: number;
    providers: number;
    min_price: number | null;
    min_price_per_mg: number | null;
  }>(
    `SELECT COUNT(*) as listings,
            COUNT(DISTINCT p.provider_id) as providers,
            MIN(p.price) as min_price,
            MIN(p.price_per_mg) as min_price_per_mg
     FROM products p
     JOIN providers pr ON p.provider_id = pr.id
     WHERE p.peptide_key = ? AND pr.is_active = 1 AND p.in_stock = 1`,
    [peptideKey]
  );
  return (
    row ?? {
      listings: 0,
      providers: 0,
      min_price: null,
      min_price_per_mg: null,
    }
  );
}

export async function getProductsByProviderSlug(slug: string) {
  const database = await getAdapter();
  return database.all<ProductWithProvider>(
    `SELECT p.*, pr.name as provider_name, pr.slug as provider_slug,
            pr.website as provider_website, pr.trust_score as provider_trust_score
     FROM products p
     JOIN providers pr ON p.provider_id = pr.id
     WHERE pr.slug = ? AND pr.is_active = 1
     ORDER BY p.peptide_key, p.price ASC`,
    [slug]
  );
}

export async function getProviderFromDb(slug: string): Promise<Provider | undefined> {
  const database = await getAdapter();
  return database.get<Provider>("SELECT * FROM providers WHERE slug = ? AND is_active = 1", [
    slug,
  ]);
}

export async function getAllProvidersFromDb(): Promise<Provider[]> {
  const database = await getAdapter();
  return database.all<Provider>("SELECT * FROM providers WHERE is_active = 1 ORDER BY name");
}

export async function createPriceAlert(input: {
  email: string;
  peptide_key: string;
  alert_type: "price" | "price_per_mg";
  target_value: number;
}) {
  const database = await getAdapter();
  await database.run(
    `INSERT INTO price_alerts (email, peptide_key, alert_type, target_value)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(email, peptide_key, alert_type) DO UPDATE SET target_value = excluded.target_value`,
    [input.email, input.peptide_key, input.alert_type, input.target_value]
  );
}

export async function getProviderProductStats(slug: string) {
  const database = await getAdapter();
  const row = await database.get<{
    total: number;
    coa_count: number;
    last_scraped: string | null;
  }>(
    `SELECT COUNT(*) as total,
            SUM(CASE WHEN p.has_coa = 1 THEN 1 ELSE 0 END) as coa_count,
            MAX(p.scraped_at) as last_scraped
     FROM products p
     JOIN providers pr ON p.provider_id = pr.id
     WHERE pr.slug = ?`,
    [slug]
  );
  return row ?? { total: 0, coa_count: 0, last_scraped: null };
}

export async function saveProviderProfile(slug: string, profile: ProviderProfile) {
  const database = await getAdapter();
  await database.run(
    `UPDATE providers SET profile_json = ?, enriched_at = ? WHERE slug = ?`,
    [JSON.stringify(profile), profile.enriched_at, slug]
  );
}

export async function getProviderProfile(slug: string): Promise<ProviderProfile | null> {
  const database = await getAdapter();
  const row = await database.get<{ profile_json: string | null }>(
    "SELECT profile_json FROM providers WHERE slug = ?",
    [slug]
  );
  return parseProviderProfile(row?.profile_json);
}

export async function getTopEnrichedProviders(limit = 6) {
  const database = await getAdapter();
  const rows = await database.all<{
    slug: string;
    name: string;
    profile_json: string | null;
    trust_score: number;
  }>(
    `SELECT slug, name, profile_json, trust_score FROM providers
     WHERE is_active = 1 AND profile_json IS NOT NULL
     ORDER BY enriched_at DESC
     LIMIT ?`,
    [limit]
  );
  return rows
    .map((r) => ({
      slug: r.slug,
      name: r.name,
      trust_score: r.trust_score,
      profile: parseProviderProfile(r.profile_json),
    }))
    .filter((r): r is typeof r & { profile: ProviderProfile } => r.profile != null);
}
