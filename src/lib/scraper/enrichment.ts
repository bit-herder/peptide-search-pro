import { PEPTIDE_CATALOG } from "../peptides";
import type { ScrapedProduct } from "./types";
import type {
  ProviderCatalogStats,
  ProviderProfile,
  ProviderSiteSignals,
} from "./profile-types";
import { PROFILE_VERSION } from "./profile-types";
import { fetchHtml, delay, RATE_LIMIT_MS } from "./types";

// cspell:disable
const SIGNAL_PATTERNS: Record<string, RegExp[]> = {
  payment: [
    /\bbitcoin\b/i,
    /\bbtc\b/i,
    /\bethereum\b/i,
    /\bcrypto(currency)?\b/i,
    /\bzelle\b/i,
    /\bcash\s*app\b/i,
    /\bvenmo\b/i,
    /\bpaypal\b/i,
    /\bstripe\b/i,
    /\bcredit\s*card\b/i,
    /\bvisa\b/i,
    /\bmastercard\b/i,
    /\bach\b/i,
    /\bwire\s*transfer\b/i,
  ],
  shipping: [
    /\bfree\s+shipping\b/i,
    /\bflat\s+rate\s+shipping\b/i,
    /\bworldwide\s+shipping\b/i,
    /\bus\s+only\b/i,
    /\bdiscreet\s+(packaging|shipping)\b/i,
    /\bcold\s+chain\b/i,
    /\bovernight\b/i,
    /\b2[- ]day\b/i,
  ],
  lab_testing: [
    /\bhplc\b/i,
    /\bmass\s+spec(trometry)?\b/i,
    /\bthird[- ]party\s+test/i,
    /\bindependent\s+lab\b/i,
    /\bcertificate\s+of\s+analysis\b/i,
    /\bcoa\b/i,
    /\bpurity\s+(test|report|certificate)\b/i,
    /\blab\s+test(ed|ing)?\b/i,
  ],
  compliance: [
    /\bresearch\s+use\s+only\b/i,
    /\bnot\s+for\s+human\s+consumption\b/i,
    /\bnfhc\b/i,
    /\blaboratory\s+research\b/i,
    /\bfor\s+research\s+purposes\b/i,
  ],
  contact: [
    /\bsupport@/i,
    /\bcontact@/i,
    /\bhelp@/i,
    /\btelegram\b/i,
    /\bdiscord\b/i,
    /\blive\s+chat\b/i,
  ],
  social: [
    /\binstagram\.com\/[\w.]+/i,
    /\btwitter\.com\/[\w]+/i,
    /\bx\.com\/[\w]+/i,
    /\bfacebook\.com\/[\w.]+/i,
    /\breddit\.com\/r\/[\w]+/i,
  ],
};
// cspell:enable

function snippetAround(text: string, index: number, radius = 60): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + radius);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

function detectSignals(html: string): Omit<ProviderSiteSignals, "fetched" | "pages_checked"> {
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ");
  const payment = new Set<string>();
  const shipping = new Set<string>();
  const lab_testing = new Set<string>();
  const compliance = new Set<string>();
  const contact = new Set<string>();
  const social = new Set<string>();
  const raw_hits: ProviderSiteSignals["raw_hits"] = [];

  const buckets = {
    payment,
    shipping,
    lab_testing,
    compliance,
    contact,
    social,
  } as const;

  for (const [category, patterns] of Object.entries(SIGNAL_PATTERNS) as Array<
    [keyof typeof buckets, RegExp[]]
  >) {
    for (const pattern of patterns) {
      const match = pattern.exec(text);
      if (match) {
        buckets[category].add(match[0].toLowerCase());
        raw_hits.push({
          category,
          keyword: match[0],
          snippet: snippetAround(text, match.index),
        });
      }
      pattern.lastIndex = 0;
    }
  }

  return {
    payment: [...payment],
    shipping: [...shipping],
    lab_testing: [...lab_testing],
    compliance: [...compliance],
    contact: [...contact],
    social: [...social],
    raw_hits: raw_hits.slice(0, 40),
  };
}

export async function fetchSiteSignals(website: string): Promise<ProviderSiteSignals> {
  const base = website.replace(/\/$/, "");
  const paths = ["", "/about", "/about-us", "/faq", "/shipping", "/lab-testing"];
  const pages_checked: string[] = [];
  const merged: ProviderSiteSignals = {
    fetched: false,
    pages_checked,
    payment: [],
    shipping: [],
    lab_testing: [],
    compliance: [],
    contact: [],
    social: [],
    raw_hits: [],
  };

  const seenHits = new Set<string>();

  for (const path of paths) {
    const url = path ? `${base}${path}` : base;
    try {
      await delay(path ? RATE_LIMIT_MS : 0);
      const html = await fetchHtml(url);
      pages_checked.push(url);
      const signals = detectSignals(html);

      for (const key of [
        "payment",
        "shipping",
        "lab_testing",
        "compliance",
        "contact",
        "social",
      ] as const) {
        for (const v of signals[key]) {
          if (!merged[key].includes(v)) merged[key].push(v);
        }
      }
      for (const hit of signals.raw_hits) {
        const id = `${hit.category}:${hit.keyword}`;
        if (!seenHits.has(id)) {
          seenHits.add(id);
          merged.raw_hits.push(hit);
        }
      }
      merged.fetched = true;
    } catch {
      // optional pages — continue
    }
  }

  if (!merged.fetched) {
    merged.fetch_error = "Could not fetch provider homepage";
  }

  merged.raw_hits = merged.raw_hits.slice(0, 50);
  return merged;
}

export function buildCatalogStats(products: ScrapedProduct[]): ProviderCatalogStats {
  const peptides = [...new Set(products.map((p) => p.peptide_key))];
  const coa_count = products.filter((p) => p.has_coa).length;
  const in_stock_count = products.filter((p) => p.in_stock !== false).length;
  const ppmValues = products
    .map((p) => p.price_per_mg)
    .filter((v): v is number => v != null && v > 0);
  const prices = products.map((p) => p.price).filter((p) => p > 0);
  const dosages = products.map((p) => p.dosage_mg).filter((d): d is number => d != null && d > 0);
  const purity_values = [
    ...new Set(products.map((p) => p.purity).filter((p): p is string => !!p)),
  ];

  const peptideCounts = new Map<string, ScrapedProduct[]>();
  for (const p of products) {
    const list = peptideCounts.get(p.peptide_key) ?? [];
    list.push(p);
    peptideCounts.set(p.peptide_key, list);
  }

  const top_peptides = [...peptideCounts.entries()]
    .map(([key, items]) => {
      const ppms = items.map((i) => i.price_per_mg).filter((v): v is number => v != null);
      const itemPrices = items.map((i) => i.price);
      return {
        key,
        label: PEPTIDE_CATALOG[key]?.label ?? key,
        listing_count: items.length,
        min_price_per_mg: ppms.length ? Math.min(...ppms) : null,
        min_price: itemPrices.length ? Math.min(...itemPrices) : null,
      };
    })
    .sort((a, b) => b.listing_count - a.listing_count)
    .slice(0, 12);

  const avg = (nums: number[]) =>
    nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;

  return {
    product_count: products.length,
    peptide_count: peptides.length,
    peptides,
    coa_count,
    coa_rate: products.length ? coa_count / products.length : 0,
    in_stock_count,
    in_stock_rate: products.length ? in_stock_count / products.length : 0,
    avg_price_per_mg: avg(ppmValues),
    min_price_per_mg: ppmValues.length ? Math.min(...ppmValues) : null,
    max_price_per_mg: ppmValues.length ? Math.max(...ppmValues) : null,
    avg_price: avg(prices),
    min_price: prices.length ? Math.min(...prices) : null,
    max_price: prices.length ? Math.max(...prices) : null,
    purity_values,
    top_peptides,
    dosage_range_mg: {
      min: dosages.length ? Math.min(...dosages) : null,
      max: dosages.length ? Math.max(...dosages) : null,
    },
  };
}

export async function buildProviderProfile(
  website: string,
  products: ScrapedProduct[],
  options: { fetchSite?: boolean } = {}
): Promise<ProviderProfile> {
  const catalog = buildCatalogStats(products);
  const site_signals =
    options.fetchSite !== false && products.length > 0
      ? await fetchSiteSignals(website)
      : {
          fetched: false,
          pages_checked: [],
          payment: [],
          shipping: [],
          lab_testing: [],
          compliance: [],
          contact: [],
          social: [],
          raw_hits: [],
        };

  return {
    version: PROFILE_VERSION,
    enriched_at: new Date().toISOString(),
    catalog,
    site_signals,
    scrape_run: { products_found: products.length },
  };
}
