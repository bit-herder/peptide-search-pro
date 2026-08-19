import { getAdapter } from "./db/adapter";
import { PEPTIDE_CATALOG } from "./peptides";

export interface Deal {
  product_id: number;
  provider_name: string;
  provider_slug: string;
  peptide_key: string;
  peptide_label: string;
  name: string;
  dosage_mg: number;
  price: number;
  price_per_mg: number;
  product_url: string;
  deal_type: "price_drop" | "best_value" | "bulk_discount" | "free_shipping" | "trusted_lowest";
  savingsPct?: number;
  previous_price_per_mg?: number;
  description: string;
  scraped_at: string;
}

const CATEGORY_THRESHOLDS: Record<string, number> = {
  "GLP-1 / Weight Loss": 1200,
  "Healing & Recovery": 500,
  "Growth Hormone": 400,
  "Anti-Aging": 600,
  "Longevity": 800,
  "Immune": 600,
  "Nootropic": 700,
  "Mitochondrial": 600,
  "Weight Loss": 800,
  "Sleep": 500,
  "Other": 500,
};

function getThreshold(category?: string): number {
  if (category && CATEGORY_THRESHOLDS[category] !== undefined) {
    return CATEGORY_THRESHOLDS[category];
  }
  return 1000;
}

function peptideLabel(peptideKey: string): string {
  const entry = PEPTIDE_CATALOG[peptideKey];
  return entry ? entry.label : peptideKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatPriceCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}/mg`;
}

export async function getBestValueDeals(limit = 10): Promise<Deal[]> {
  const db = await getAdapter();
  const rows = await db.all<{
    product_id: number;
    provider_name: string;
    provider_slug: string;
    peptide_key: string;
    name: string;
    dosage_mg: number | null;
    price: number;
    price_per_mg: number | null;
    product_url: string;
    scraped_at: string;
  }>(
    `SELECT p.id AS product_id, pr.name AS provider_name, pr.slug AS provider_slug,
            p.peptide_key, p.name, p.dosage_mg, p.price, p.price_per_mg,
            p.product_url, p.scraped_at
     FROM products p
     JOIN providers pr ON p.provider_id = pr.id
     WHERE p.in_stock = 1 AND pr.is_active = 1 AND p.price_per_mg IS NOT NULL
     ORDER BY p.price_per_mg ASC
     LIMIT ?`,
    [limit]
  );
  return rows.map((r) => ({
    product_id: r.product_id,
    provider_name: r.provider_name,
    provider_slug: r.provider_slug,
    peptide_key: r.peptide_key,
    peptide_label: peptideLabel(r.peptide_key),
    name: r.name,
    dosage_mg: r.dosage_mg ?? 0,
    price: r.price,
    price_per_mg: r.price_per_mg ?? 0,
    product_url: r.product_url,
    deal_type: "best_value" as const,
    description: "Best price across all suppliers",
    scraped_at: r.scraped_at,
  }));
}

export async function getCategoryDeals(limit = 10): Promise<Deal[]> {
  const db = await getAdapter();
  const allDeals: Deal[] = [];

  for (const [peptideKey, meta] of Object.entries(PEPTIDE_CATALOG)) {
    const threshold = getThreshold(meta.category);
    const rows = await db.all<{
      product_id: number;
      provider_name: string;
      provider_slug: string;
      peptide_key: string;
      name: string;
      dosage_mg: number | null;
      price: number;
      price_per_mg: number | null;
      product_url: string;
      scraped_at: string;
    }>(
      `SELECT p.id AS product_id, pr.name AS provider_name, pr.slug AS provider_slug,
              p.peptide_key, p.name, p.dosage_mg, p.price, p.price_per_mg,
              p.product_url, p.scraped_at
       FROM products p
       JOIN providers pr ON p.provider_id = pr.id
       WHERE p.peptide_key = ? AND p.in_stock = 1 AND pr.is_active = 1
         AND p.price_per_mg IS NOT NULL
         AND CAST(ROUND(p.price_per_mg * 100) AS INTEGER) < ?
       ORDER BY p.price_per_mg ASC
       LIMIT ?`,
      [peptideKey, threshold, limit]
    );
    for (const r of rows) {
      const pricePerMgCents = Math.round((r.price_per_mg ?? 0) * 100);
      const savingsPct = threshold > 0
        ? Math.round(((threshold - pricePerMgCents) / threshold) * 100)
        : 0;
      allDeals.push({
        product_id: r.product_id,
        provider_name: r.provider_name,
        provider_slug: r.provider_slug,
        peptide_key: r.peptide_key,
        peptide_label: peptideLabel(r.peptide_key),
        name: r.name,
        dosage_mg: r.dosage_mg ?? 0,
        price: r.price,
        price_per_mg: r.price_per_mg ?? 0,
        product_url: r.product_url,
        deal_type: "trusted_lowest",
        savingsPct,
        description: `${formatPriceCents(pricePerMgCents)} — ${savingsPct}% below category average`,
        scraped_at: r.scraped_at,
      });
    }
  }

  allDeals.sort((a, b) => a.price_per_mg - b.price_per_mg);
  return allDeals.slice(0, limit);
}

export async function getPriceDrops(limit = 10): Promise<Deal[]> {
  const db = await getAdapter();
  const rows = await db.all<{
    product_id: number;
    provider_name: string;
    provider_slug: string;
    peptide_key: string;
    name: string;
    dosage_mg: number | null;
    price: number;
    price_per_mg: number | null;
    product_url: string;
    scraped_at: string;
    previous_price_per_mg: number | null;
  }>(
    `SELECT p.id AS product_id, pr.name AS provider_name, pr.slug AS provider_slug,
            p.peptide_key, p.name, p.dosage_mg, p.price, p.price_per_mg,
            p.product_url, p.scraped_at,
            prev.price_per_mg AS previous_price_per_mg
     FROM products p
     JOIN providers pr ON p.provider_id = pr.id
     LEFT JOIN products prev ON prev.provider_id = p.provider_id
        AND prev.peptide_key = p.peptide_key
        AND prev.dosage_mg = p.dosage_mg
        AND prev.scraped_at < p.scraped_at
     WHERE p.in_stock = 1 AND pr.is_active = 1
       AND p.price_per_mg IS NOT NULL
       AND prev.price_per_mg IS NOT NULL
       AND prev.price_per_mg > p.price_per_mg
       AND ((prev.price_per_mg - p.price_per_mg) / prev.price_per_mg) > 0.05
       AND prev.scraped_at = (
         SELECT MAX(prev2.scraped_at)
         FROM products prev2
         WHERE prev2.provider_id = p.provider_id
           AND prev2.peptide_key = p.peptide_key
           AND prev2.dosage_mg = p.dosage_mg
           AND prev2.scraped_at < p.scraped_at
       )
     ORDER BY (prev.price_per_mg - p.price_per_mg) / prev.price_per_mg DESC
     LIMIT ?`,
    [limit]
  );
  return rows.map((r) => {
    const savingsPct = r.previous_price_per_mg && r.previous_price_per_mg > 0
      ? Math.round(((r.previous_price_per_mg - (r.price_per_mg ?? 0)) / r.previous_price_per_mg) * 100)
      : undefined;
    return {
      product_id: r.product_id,
      provider_name: r.provider_name,
      provider_slug: r.provider_slug,
      peptide_key: r.peptide_key,
      peptide_label: peptideLabel(r.peptide_key),
      name: r.name,
      dosage_mg: r.dosage_mg ?? 0,
      price: r.price,
      price_per_mg: r.price_per_mg ?? 0,
      product_url: r.product_url,
      deal_type: "price_drop",
      savingsPct,
      previous_price_per_mg: r.previous_price_per_mg ?? undefined,
      description: savingsPct
        ? `${formatPriceCents(Math.round((r.price_per_mg ?? 0) * 100))} — ${savingsPct}% drop from ${formatPriceCents(Math.round((r.previous_price_per_mg ?? 0) * 100))}`
        : "Price dropped",
      scraped_at: r.scraped_at,
    };
  });
}

export async function getBulkDiscounts(limit = 10): Promise<Deal[]> {
  const db = await getAdapter();
  const rows = await db.all<{
    product_id: number;
    provider_name: string;
    provider_slug: string;
    peptide_key: string;
    name: string;
    dosage_mg: number | null;
    price: number;
    price_per_mg: number | null;
    product_url: string;
    scraped_at: string;
    provider_id: number;
  }>(
    `SELECT p.id AS product_id, pr.name AS provider_name, pr.slug AS provider_slug,
            p.peptide_key, p.name, p.dosage_mg, p.price, p.price_per_mg,
            p.product_url, p.scraped_at, p.provider_id
     FROM products p
     JOIN providers pr ON p.provider_id = pr.id
     WHERE p.in_stock = 1 AND pr.is_active = 1
       AND p.dosage_mg IS NOT NULL AND p.price_per_mg IS NOT NULL
     ORDER BY p.provider_id, p.peptide_key, p.dosage_mg ASC`,
    []
  );

  const grouped = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = `${r.provider_id}:${r.peptide_key}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }

  const deals: Deal[] = [];

  for (const group of grouped.values()) {
    if (group.length < 2) continue;

    const minDosage = group[0];
    const maxDosage = group[group.length - 1];

    if (
      maxDosage.dosage_mg !== null &&
      minDosage.dosage_mg !== null &&
      maxDosage.dosage_mg > minDosage.dosage_mg &&
      maxDosage.price_per_mg !== null &&
      minDosage.price_per_mg !== null &&
      maxDosage.price_per_mg < minDosage.price_per_mg * 0.95
    ) {
      const savingsPct = Math.round(
        ((minDosage.price_per_mg - maxDosage.price_per_mg) / minDosage.price_per_mg) * 100
      );
      deals.push({
        product_id: maxDosage.product_id,
        provider_name: maxDosage.provider_name,
        provider_slug: maxDosage.provider_slug,
        peptide_key: maxDosage.peptide_key,
        peptide_label: peptideLabel(maxDosage.peptide_key),
        name: maxDosage.name,
        dosage_mg: maxDosage.dosage_mg ?? 0,
        price: maxDosage.price,
        price_per_mg: maxDosage.price_per_mg ?? 0,
        product_url: maxDosage.product_url,
        deal_type: "bulk_discount",
        savingsPct,
        description: `Buy ${maxDosage.dosage_mg}mg at ${formatPriceCents(Math.round((maxDosage.price_per_mg ?? 0) * 100))} — save ${savingsPct}% vs ${minDosage.dosage_mg}mg`,
        scraped_at: maxDosage.scraped_at,
      });
    }
  }

  deals.sort((a, b) => (b.savingsPct ?? 0) - (a.savingsPct ?? 0));
  return deals.slice(0, limit);
}

export async function getAllDeals(limit = 10): Promise<{
  best_value: Deal[];
  category_deals: Deal[];
  price_drops: Deal[];
  bulk_discounts: Deal[];
  total: number;
}> {
  const [bestValue, categoryDeals, priceDrops, bulkDiscounts] = await Promise.all([
    getBestValueDeals(limit),
    getCategoryDeals(limit),
    getPriceDrops(limit),
    getBulkDiscounts(limit),
  ]);

  return {
    best_value: bestValue,
    category_deals: categoryDeals,
    price_drops: priceDrops,
    bulk_discounts: bulkDiscounts,
    total: bestValue.length + categoryDeals.length + priceDrops.length + bulkDiscounts.length,
  };
}
