import Fuse from "fuse.js";
import { discoverPeptideListings, isDiscoveryAvailable } from "./discovery/engine";
import type { DiscoveredListing, DiscoveryMeta } from "./discovery/types";
import {
  getAllProductsWithProviders,
  getPopularPeptides,
  ProductWithProvider,
  SearchResult,
} from "./db";
import { PEPTIDE_CATALOG, resolvePeptideKey, slugify } from "./peptides";

export type SortOption = "price" | "price_per_mg" | "trust" | "name";

export type SearchProduct = ProductWithProvider & {
  source?: "tracked" | "discovered";
};

export interface SearchOptions {
  query: string;
  sort?: SortOption;
  inStockOnly?: boolean;
  limit?: number;
  discover?: boolean;
}

export interface ExtendedSearchResult extends SearchResult {
  results: SearchProduct[];
  discovery?: DiscoveryMeta;
  tracked_count?: number;
  discovered_count?: number;
}

export async function searchPeptides(options: SearchOptions): Promise<ExtendedSearchResult> {
  const { query, sort = "price_per_mg", inStockOnly = true, limit = 100 } = options;
  const trimmed = query.trim();

  if (!trimmed) {
    return {
      query: trimmed,
      peptide_key: null,
      total: 0,
      providers_count: 0,
      lowest_price: null,
      lowest_price_per_mg: null,
      results: [],
      popular_peptides: await getPopularPeptides(),
      tracked_count: 0,
      discovered_count: 0,
    };
  }

  const peptideKey = resolvePeptideKey(trimmed);
  let results: SearchProduct[] = (await getAllProductsWithProviders()).map((p) => ({
    ...p,
    source: "tracked" as const,
  }));

  if (peptideKey) {
    results = results.filter((p) => p.peptide_key === peptideKey);
  } else {
    const fuse = new Fuse(results, {
      keys: [
        { name: "name", weight: 0.4 },
        { name: "peptide_key", weight: 0.3 },
        { name: "provider_name", weight: 0.1 },
        { name: "dosage_label", weight: 0.2 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
    });
    results = fuse.search(trimmed).map((r) => r.item);
  }

  if (inStockOnly) {
    results = results.filter((p) => p.in_stock === 1);
  }

  results = sortResults(results, sort);

  const providers = new Set(results.map((r) => r.provider_slug));
  const prices = results.map((r) => r.price);
  const pricesPerMg = results
    .map((r) => r.price_per_mg)
    .filter((p): p is number => p !== null);

  const resolvedKey =
    peptideKey ?? (results.length > 0 ? results[0].peptide_key : null);

  return {
    query: trimmed,
    peptide_key: resolvedKey,
    total: results.length,
    providers_count: providers.size,
    lowest_price: prices.length ? Math.min(...prices) : null,
    lowest_price_per_mg: pricesPerMg.length ? Math.min(...pricesPerMg) : null,
    results: results.slice(0, limit),
    popular_peptides: await getPopularPeptides(),
    tracked_count: results.length,
    discovered_count: 0,
  };
}

export async function searchPeptidesWithDiscovery(
  options: SearchOptions
): Promise<ExtendedSearchResult> {
  const { discover = true, limit = 100, sort = "price_per_mg", inStockOnly = true } =
    options;
  const tracked = await searchPeptides({ ...options, discover: false });

  if (!discover || !isDiscoveryAvailable() || !options.query.trim()) {
    return tracked;
  }

  const { listings, meta } = await discoverPeptideListings(options.query);
  const trackedUrls = new Set(
    tracked.results.map((r) => normalizeUrl(r.product_url))
  );

  const discovered = listings
    .filter((l) => !trackedUrls.has(normalizeUrl(l.product_url)))
    .map((l, i) => discoveredToProduct(l, i))
    .filter((p) => !inStockOnly || p.in_stock === 1);

  const combined = sortResults([...tracked.results, ...discovered], sort);
  const providers = new Set(combined.map((r) => r.provider_slug));
  const prices = combined.map((r) => r.price);
  const pricesPerMg = combined
    .map((r) => r.price_per_mg)
    .filter((p): p is number => p !== null);

  return {
    ...tracked,
    results: combined.slice(0, limit),
    total: combined.length,
    providers_count: providers.size,
    lowest_price: prices.length ? Math.min(...prices) : tracked.lowest_price,
    lowest_price_per_mg: pricesPerMg.length
      ? Math.min(...pricesPerMg)
      : tracked.lowest_price_per_mg,
    tracked_count: tracked.results.length,
    discovered_count: discovered.length,
    discovery: meta,
  };
}

function discoveredToProduct(
  listing: DiscoveredListing,
  index: number
): SearchProduct {
  return {
    id: -2000 - index,
    provider_id: 0,
    external_id: null,
    name: listing.name,
    slug: slugify(listing.name),
    peptide_key: listing.peptide_key,
    dosage_mg: listing.dosage_mg,
    dosage_label: listing.dosage_label,
    price: listing.price,
    price_per_mg: listing.price_per_mg,
    currency: "USD",
    in_stock: listing.in_stock ? 1 : 0,
    product_url: listing.product_url,
    image_url: null,
    purity: null,
    has_coa: listing.has_coa ? 1 : 0,
    scraped_at: new Date().toISOString(),
    provider_name: listing.provider_name,
    provider_slug: listing.provider_slug,
    provider_website: listing.provider_website,
    provider_trust_score: 5.5,
    source: "discovered",
  };
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/$/, "");
  } catch {
    return url;
  }
}

function sortResults(
  results: SearchProduct[],
  sort: SortOption
): SearchProduct[] {
  return [...results].sort((a, b) => {
    switch (sort) {
      case "price":
        return a.price - b.price;
      case "price_per_mg": {
        const aVal = a.price_per_mg ?? Infinity;
        const bVal = b.price_per_mg ?? Infinity;
        return aVal - bVal;
      }
      case "trust":
        return b.provider_trust_score - a.provider_trust_score;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });
}

export function getCatalogSuggestions(query: string) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return Object.entries(PEPTIDE_CATALOG).map(([key, meta]) => ({
      key,
      label: meta.label,
      category: meta.category,
    }));
  }

  const fuse = new Fuse(
    Object.entries(PEPTIDE_CATALOG).map(([key, meta]) => ({
      key,
      label: meta.label,
      category: meta.category,
      aliases: meta.aliases.join(" "),
    })),
    {
      keys: ["label", "key", "aliases", "category"],
      threshold: 0.35,
    }
  );

  return fuse.search(trimmed).map((r) => ({
    key: r.item.key,
    label: r.item.label,
    category: r.item.category,
  }));
}
