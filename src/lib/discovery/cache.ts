import type { DiscoveredListing } from "./types";

const TTL_MS = 60 * 60 * 1000;
const store = new Map<string, { expires: number; data: DiscoveredListing[] }>();

function cacheKey(query: string, peptideKey: string | null): string {
  return `${peptideKey ?? query.trim().toLowerCase()}`;
}

export function getCachedDiscovery(
  query: string,
  peptideKey: string | null
): DiscoveredListing[] | null {
  const entry = store.get(cacheKey(query, peptideKey));
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(cacheKey(query, peptideKey));
    return null;
  }
  return entry.data;
}

export function setCachedDiscovery(
  query: string,
  peptideKey: string | null,
  data: DiscoveredListing[]
): void {
  store.set(cacheKey(query, peptideKey), {
    expires: Date.now() + TTL_MS,
    data,
  });
}
