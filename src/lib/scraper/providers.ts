import {
  createCatalogScraper,
  createDemoScraper,
  createVprScraper,
  createWooCommerceScraper,
} from "./adapters";
import { PROVIDERS, getProviderBySlug } from "../providers-config";
import { ProviderConfig, ScraperAdapter } from "./types";

export { PROVIDERS, getProviderBySlug };

const SEARCH_TERMS_FULL = [
  "BPC-157",
  "TB-500",
  "Semaglutide",
  "Tirzepatide",
  "Retatrutide",
  "Ipamorelin",
  "CJC-1295",
  "GHK-Cu",
  "PT-141",
  "Melanotan",
  "AOD-9604",
  "MOTS-c",
  "Sermorelin",
  "Selank",
  "Semax",
  "Epitalon",
  "Tesamorelin",
  "NAD+",
  "Thymosin",
];

/** Shorter term list when indexing many suppliers (keeps scrape runs bounded). */
const SEARCH_TERMS_CORE = [
  "BPC-157",
  "TB-500",
  "Semaglutide",
  "Tirzepatide",
  "Retatrutide",
  "Ipamorelin",
  "CJC-1295",
  "GHK-Cu",
  "PT-141",
  "MOTS-c",
  "Sermorelin",
  "NAD+",
];

function getSearchTerms(): string[] {
  const enabled = PROVIDERS.filter((p) => p.enabled).length;
  return enabled > 40 ? SEARCH_TERMS_CORE : SEARCH_TERMS_FULL;
}

export type ScraperMode = "demo" | "live";

function resolveScraperMode(mode?: ScraperMode): ScraperMode {
  if (mode) return mode;
  const env = process.env.SCRAPER_MODE?.toLowerCase();
  if (env === "live" || env === "demo") return env;
  return "live";
}

function getShopBaseUrl(provider: ProviderConfig): string {
  const base = provider.website.replace(/\/$/, "");
  const path = provider.shopPath ?? "/shop";
  if (path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

const PURE_RAWZ_CATALOG = [
  { path: "/product/bpc-157-5mg/", name: "BPC-157 5mg", peptide_key: "bpc-157", dosage_mg: 5 },
  { path: "/product/semaglutide-5mg/", name: "Semaglutide 5mg", peptide_key: "semaglutide", dosage_mg: 5 },
  { path: "/product/tirzepatide-10mg/", name: "Tirzepatide 10mg", peptide_key: "tirzepatide", dosage_mg: 10 },
  { path: "/product/ipamorelin-5mg/", name: "Ipamorelin 5mg", peptide_key: "ipamorelin", dosage_mg: 5 },
  { path: "/product/tb-500-5mg/", name: "TB-500 5mg", peptide_key: "tb-500", dosage_mg: 5 },
  { path: "/product/retatrutide-10mg/", name: "Retatrutide 10mg", peptide_key: "retatrutide", dosage_mg: 10 },
];

function createLiveAdapter(provider: ProviderConfig): ScraperAdapter {
  if (provider.scraper === "vpr") {
    return createVprScraper(provider);
  }

  if (provider.scraper === "catalog" || provider.slug === "pure-rawz") {
    return createCatalogScraper(provider, PURE_RAWZ_CATALOG);
  }

  const shopUrl = getShopBaseUrl(provider);
  return createWooCommerceScraper(provider, shopUrl, getSearchTerms());
}

export function getScraperAdapters(mode?: ScraperMode): ScraperAdapter[] {
  const resolved = resolveScraperMode(mode);

  return PROVIDERS.filter((provider) => provider.enabled).map((provider) => {
    if (resolved === "demo" || provider.scraper === "demo") {
      return createDemoScraper(provider);
    }
    return createLiveAdapter(provider);
  });
}
