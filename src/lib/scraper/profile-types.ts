/** Provider profile enrichment — versioned JSON for breadth + future cross-analysis */

export interface ProviderCatalogStats {
  product_count: number;
  peptide_count: number;
  peptides: string[];
  coa_count: number;
  coa_rate: number;
  in_stock_count: number;
  in_stock_rate: number;
  avg_price_per_mg: number | null;
  min_price_per_mg: number | null;
  max_price_per_mg: number | null;
  avg_price: number | null;
  min_price: number | null;
  max_price: number | null;
  purity_values: string[];
  top_peptides: Array<{
    key: string;
    label: string;
    listing_count: number;
    min_price_per_mg: number | null;
    min_price: number | null;
  }>;
  dosage_range_mg: { min: number | null; max: number | null };
}

export interface ProviderSiteSignals {
  fetched: boolean;
  fetch_error?: string;
  pages_checked: string[];
  payment: string[];
  shipping: string[];
  lab_testing: string[];
  compliance: string[];
  contact: string[];
  social: string[];
  raw_hits: Array<{ category: string; keyword: string; snippet: string }>;
}

export interface ProviderProfile {
  version: 1;
  enriched_at: string;
  catalog: ProviderCatalogStats;
  site_signals: ProviderSiteSignals;
  scrape_run: {
    products_found: number;
  };
}

export const PROFILE_VERSION = 1 as const;
