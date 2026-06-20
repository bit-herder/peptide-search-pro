export interface SearchHit {
  title: string;
  url: string;
  snippet?: string;
}

export interface DiscoveredListing {
  name: string;
  peptide_key: string;
  dosage_mg: number | null;
  dosage_label: string | null;
  price: number;
  price_per_mg: number | null;
  product_url: string;
  provider_name: string;
  provider_slug: string;
  provider_website: string;
  in_stock: boolean;
  has_coa: boolean;
}

export interface DiscoveryMeta {
  enabled: boolean;
  provider: string | null;
  urlsSearched: number;
  urlsScraped: number;
  listingsFound: number;
  durationMs: number;
  error?: string;
}
