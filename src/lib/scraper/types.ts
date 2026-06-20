export interface ScrapedProduct {
  external_id: string;
  name: string;
  peptide_key: string;
  dosage_mg?: number | null;
  dosage_label?: string | null;
  price: number;
  price_per_mg?: number | null;
  in_stock?: boolean;
  product_url: string;
  image_url?: string | null;
  purity?: string | null;
  has_coa?: boolean;
}

export type ProviderScraper = "woocommerce" | "catalog" | "vpr" | "demo";

export interface ProviderConfig {
  slug: string;
  name: string;
  website: string;
  trust_score: number;
  enabled: boolean;
  /** Live scrape strategy. Defaults to woocommerce. */
  scraper?: ProviderScraper;
  /** Shop/search base path. Defaults to /shop */
  shopPath?: string;
}

export interface ScraperAdapter {
  config: ProviderConfig;
  scrape(): Promise<ScrapedProduct[]>;
}

const DEFAULT_HEADERS = {
  "User-Agent":
    "PeptideSearchPro/1.0 (+https://peptidesearch.pro; research price aggregator)",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

export async function fetchHtml(
  url: string,
  options: RequestInit = {}
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      ...options,
      headers: { ...DEFAULT_HEADERS, ...options.headers },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }

    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const RATE_LIMIT_MS = 2000;
