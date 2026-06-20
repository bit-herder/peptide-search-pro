import { PEPTIDE_CATALOG, resolvePeptideKey } from "../peptides";
import { PROVIDERS } from "../providers-config";
import { getCachedDiscovery, setCachedDiscovery } from "./cache";
import { extractListingFromUrl } from "./extractor";
import {
  buildPeptideSearchQuery,
  searchWeb,
} from "./search-engine";
import type { SearchHit } from "./types";
import type { DiscoveredListing, DiscoveryMeta } from "./types";

const MAX_URLS_TO_SCRAPE = 28;
const SCRAPE_DELAY_MS = 900;
const DISCOVERY_TIMEOUT_MS = 52000;

const TRACKED_HOSTS = new Set(
  PROVIDERS.map((p) => {
    try {
      return new URL(p.website).hostname.replace(/^www\./, "");
    } catch {
      return p.slug;
    }
  })
);

function isTrackedHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return TRACKED_HOSTS.has(host);
  } catch {
    return false;
  }
}

function prioritizeHits(hits: SearchHit[]): SearchHit[] {
  const scored = hits.map((hit) => {
    let score = 0;
    const text = `${hit.title} ${hit.url} ${hit.snippet ?? ""}`.toLowerCase();
    if (text.includes("peptide")) score += 3;
    if (text.includes("research")) score += 2;
    if (text.includes("mg")) score += 2;
    if (text.includes("buy") || text.includes("shop")) score += 1;
    if (text.includes("product")) score += 1;
    if (isTrackedHost(hit.url)) score -= 5;
    return { hit, score };
  });
  return scored.sort((a, b) => b.score - a.score).map((s) => s.hit);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function discoverPeptideListings(
  query: string
): Promise<{ listings: DiscoveredListing[]; meta: DiscoveryMeta }> {
  const start = Date.now();
  const peptideKey = resolvePeptideKey(query);
  const peptideLabel = peptideKey
    ? PEPTIDE_CATALOG[peptideKey]?.label ?? query
    : query.trim();

  if (!peptideKey) {
    return {
      listings: [],
      meta: {
        enabled: true,
        provider: null,
        urlsSearched: 0,
        urlsScraped: 0,
        listingsFound: 0,
        durationMs: Date.now() - start,
        error: "Unknown peptide — try a catalog name like BPC-157 or Semaglutide",
      },
    };
  }

  const cached = getCachedDiscovery(query, peptideKey);
  if (cached) {
    return {
      listings: cached,
      meta: {
        enabled: true,
        provider: "cache",
        urlsSearched: 0,
        urlsScraped: 0,
        listingsFound: cached.length,
        durationMs: Date.now() - start,
      },
    };
  }

  const searchQueries = [
    buildPeptideSearchQuery(peptideLabel),
    `${peptideLabel} peptide shop buy mg price`,
    `${peptideLabel} research peptide for sale`,
  ];
  let searchProvider: string | null = null;
  let hits: SearchHit[] = [];

  try {
    const deadline = Date.now() + DISCOVERY_TIMEOUT_MS;
    const allHits: SearchHit[] = [];

    for (const searchQuery of searchQueries) {
      if (Date.now() > deadline) break;
      const searchResult = await Promise.race([
        searchWeb(searchQuery),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Search timed out")), deadline - Date.now())
        ),
      ]);
      searchProvider = searchResult.provider;
      allHits.push(...searchResult.hits);
    }

    const seen = new Set<string>();
    hits = prioritizeHits(allHits)
      .filter((h) => !isTrackedHost(h.url))
      .filter((h) => {
        try {
          const key = new URL(h.url).hostname + new URL(h.url).pathname;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        } catch {
          return false;
        }
      });
  } catch (err) {
    return {
      listings: [],
      meta: {
        enabled: true,
        provider: searchProvider,
        urlsSearched: 0,
        urlsScraped: 0,
        listingsFound: 0,
        durationMs: Date.now() - start,
        error: err instanceof Error ? err.message : "Web search failed",
      },
    };
  }

  const urlsToScrape = hits.slice(0, MAX_URLS_TO_SCRAPE);
  const listings: DiscoveredListing[] = [];
  const seenUrls = new Set<string>();

  for (const hit of urlsToScrape) {
    if (Date.now() - start > DISCOVERY_TIMEOUT_MS) break;
    if (seenUrls.has(hit.url)) continue;
    seenUrls.add(hit.url);

    const listing = await extractListingFromUrl(hit.url, peptideKey, hit.title);
    if (listing) listings.push(listing);

    await delay(SCRAPE_DELAY_MS);
  }

  setCachedDiscovery(query, peptideKey, listings);

  return {
    listings,
    meta: {
      enabled: true,
      provider: searchProvider,
      urlsSearched: hits.length,
      urlsScraped: urlsToScrape.length,
      listingsFound: listings.length,
      durationMs: Date.now() - start,
    },
  };
}

export function isDiscoveryAvailable(): boolean {
  return Boolean(
    process.env.SERPAPI_KEY ||
      (process.env.GOOGLE_CSE_API_KEY && process.env.GOOGLE_CSE_ID) ||
      process.env.DISCOVERY_ENABLED !== "false"
  );
}
