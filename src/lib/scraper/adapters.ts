import * as cheerio from "cheerio";
import {
  calcPricePerMg,
  normalizePeptideKey,
  parseDosageMg,
  parsePrice,
  PEPTIDE_CATALOG,
  resolvePeptideKey,
  slugify,
} from "../peptides";
import {
  delay,
  fetchHtml,
  ProviderConfig,
  RATE_LIMIT_MS,
  ScrapedProduct,
  ScraperAdapter,
} from "./types";

function matchPeptideKey(name: string): string | null {
  const resolved = resolvePeptideKey(name);
  if (resolved) return resolved;

  const lower = name.toLowerCase();
  for (const key of Object.keys(PEPTIDE_CATALOG)) {
    const label = PEPTIDE_CATALOG[key].label.toLowerCase();
    if (lower.includes(label) || lower.includes(key.replace(/-/g, " "))) {
      return key;
    }
  }
  return null;
}

function buildProduct(
  base: Omit<ScrapedProduct, "price_per_mg"> & { price: number }
): ScrapedProduct | null {
  if (!base.peptide_key || base.price <= 0) return null;
  return {
    ...base,
    price_per_mg: calcPricePerMg(base.price, base.dosage_mg ?? null),
  };
}

/** Generic WooCommerce-style shop scraper */
export function createWooCommerceScraper(
  config: ProviderConfig,
  shopUrl: string,
  searchTerms: string[]
): ScraperAdapter {
  return {
    config,
    async scrape() {
      const products: ScrapedProduct[] = [];

      for (const term of searchTerms) {
        await delay(RATE_LIMIT_MS);
        try {
          const url = `${shopUrl}?s=${encodeURIComponent(term)}&post_type=product`;
          const html = await fetchHtml(url);
          const $ = cheerio.load(html);

          $(".product, .type-product, li.product").each((_, el) => {
            const $el = $(el);
            const name =
              $el.find(".woocommerce-loop-product__title, h2, .product-title").first().text().trim() ||
              $el.find("a").first().attr("title")?.trim() ||
              "";
            if (!name) return;

            const peptideKey = matchPeptideKey(name);
            if (!peptideKey) return;

            const priceText =
              $el.find(".price .amount, .price, .woocommerce-Price-amount").first().text() ||
              "";
            const price = parsePrice(priceText);
            if (!price) return;

            const href = $el.find("a").first().attr("href") || "";
            const productUrl = href.startsWith("http")
              ? href
              : new URL(href, config.website).toString();

            const img = $el.find("img").first().attr("src") || null;
            const dosage = parseDosageMg(name);
            const inStock = !$el.find(".out-of-stock, .sold-out").length;
            const blockText = $el.text().toLowerCase();
            const hasCoa =
              blockText.includes("coa") ||
              blockText.includes("certificate of analysis") ||
              blockText.includes("lab test");

            const product = buildProduct({
              external_id: slugify(`${config.slug}-${name}`),
              name,
              peptide_key: peptideKey,
              dosage_mg: dosage.mg,
              dosage_label: dosage.label,
              price,
              in_stock: inStock,
              product_url: productUrl,
              image_url: img,
              has_coa: hasCoa,
            });
            if (product) products.push(product);
          });
        } catch {
          // Continue with next search term
        }
      }

      return dedupeProducts(products);
    },
  };
}

/** Static catalog scraper for providers with predictable product URLs */
export function createCatalogScraper(
  config: ProviderConfig,
  catalog: Array<{
    path: string;
    name: string;
    peptide_key: string;
    dosage_mg: number;
    fallback_price?: number;
  }>
): ScraperAdapter {
  return {
    config,
    async scrape() {
      const products: ScrapedProduct[] = [];

      for (const item of catalog) {
        await delay(RATE_LIMIT_MS);
        const url = new URL(item.path, config.website).toString();

        try {
          const html = await fetchHtml(url);
          const $ = cheerio.load(html);

          const priceText =
            $(".price .amount, .product-price, .price, [itemprop='price']").first().text() ||
            $('meta[property="product:price:amount"]').attr("content") ||
            "";
          const price = parsePrice(priceText) ?? item.fallback_price ?? 0;

          const name =
            $("h1.product_title, h1.entry-title, h1").first().text().trim() || item.name;

          const inStock =
            !$(".out-of-stock, .sold-out, .stock.out-of-stock").length &&
            !html.toLowerCase().includes("out of stock");

          const hasCoa =
            html.toLowerCase().includes("certificate of analysis") ||
            html.toLowerCase().includes("coa") ||
            html.toLowerCase().includes("lab report");

          const purityMatch = html.match(/(\d{2}(?:\.\d+)?)\s*%\s*purity/i);
          const img =
            $(".woocommerce-product-gallery__image img, .product-image img")
              .first()
              .attr("src") || null;

          const product = buildProduct({
            external_id: slugify(`${config.slug}-${item.peptide_key}-${item.dosage_mg}`),
            name,
            peptide_key: item.peptide_key,
            dosage_mg: item.dosage_mg,
            dosage_label: `${item.dosage_mg}mg`,
            price,
            in_stock: inStock,
            product_url: url,
            image_url: img,
            purity: purityMatch ? `${purityMatch[1]}%` : null,
            has_coa: hasCoa,
          });
          if (product) products.push(product);
        } catch {
          if (item.fallback_price) {
            const product = buildProduct({
              external_id: slugify(`${config.slug}-${item.peptide_key}-${item.dosage_mg}`),
              name: item.name,
              peptide_key: item.peptide_key,
              dosage_mg: item.dosage_mg,
              dosage_label: `${item.dosage_mg}mg`,
              price: item.fallback_price,
              in_stock: true,
              product_url: url,
              has_coa: true,
            });
            if (product) products.push(product);
          }
        }
      }

      return dedupeProducts(products);
    },
  };
}

function dedupeProducts(products: ScrapedProduct[]): ScrapedProduct[] {
  const seen = new Map<string, ScrapedProduct>();
  for (const p of products) {
    const key = `${p.peptide_key}-${p.dosage_mg}-${p.price}`;
    if (!seen.has(key) || seen.get(key)!.price > p.price) {
      seen.set(key, p);
    }
  }
  return Array.from(seen.values());
}

interface VprProduct {
  id: number;
  slug: string;
  name: string;
  category: string;
  image: string | null;
  limitedStock: boolean;
  membersOnly: boolean;
}

interface VprPriceTier {
  id: number;
  productSlug: string;
  quantity: number;
  pricePerVial: number;
}

async function fetchVprTrpc<T>(baseUrl: string, procedure: string): Promise<T> {
  const origin = baseUrl.replace(/\/$/, "");
  const url = `${origin}/api/trpc/${procedure}?batch=1&input=${encodeURIComponent(JSON.stringify({ 0: {} }))}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "PeptideSearchPro/1.0 (+https://peptidesearch.pro; research price aggregator)",
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`VPR API HTTP ${response.status}`);
  }
  const payload = (await response.json()) as Array<{
    result?: { data?: { json?: T } };
  }>;
  const data = payload[0]?.result?.data?.json;
  if (data === undefined) {
    throw new Error(`VPR API missing data for ${procedure}`);
  }
  return data;
}

/** VPR Members Club — tRPC public catalog (vprmembersclub.com) */
export function createVprScraper(config: ProviderConfig): ScraperAdapter {
  return {
    config,
    async scrape() {
      const [catalog, tiers] = await Promise.all([
        fetchVprTrpc<VprProduct[]>(config.website, "admin.publicProducts"),
        fetchVprTrpc<VprPriceTier[]>(config.website, "admin.publicPriceTiers"),
      ]);

      const priceBySlug = new Map<string, number>();
      for (const tier of tiers) {
        if (tier.quantity !== 1) continue;
        const existing = priceBySlug.get(tier.productSlug);
        if (existing === undefined || tier.pricePerVial < existing) {
          priceBySlug.set(tier.productSlug, tier.pricePerVial);
        }
      }

      const products: ScrapedProduct[] = [];
      for (const item of catalog) {
        const price = priceBySlug.get(item.slug);
        if (!price) continue;

        const peptideKey = matchPeptideKey(item.name);
        if (!peptideKey) continue;

        const dosage = parseDosageMg(item.name);
        const productUrl = `${config.website.replace(/\/$/, "")}/shop/${item.slug}`;
        const imageUrl = item.image
          ? item.image.startsWith("http")
            ? item.image
            : `${config.website.replace(/\/$/, "")}${item.image}`
          : null;

        const product = buildProduct({
          external_id: String(item.id),
          name: item.name.replace(/, sold per vial$/i, ""),
          peptide_key: peptideKey,
          dosage_mg: dosage.mg,
          dosage_label: dosage.label,
          price,
          in_stock: !item.limitedStock,
          product_url: productUrl,
          image_url: imageUrl,
          purity: "99%+",
          has_coa: true,
        });
        if (product) products.push(product);
      }

      return dedupeProducts(products);
    },
  };
}

export function createDemoScraper(config: ProviderConfig): ScraperAdapter {
  const demoCatalog: Array<{
    peptide_key: string;
    dosages: number[];
    basePrice: number;
    variance: number;
  }> = [
    { peptide_key: "bpc-157", dosages: [5, 10], basePrice: 45, variance: 0.15 },
    { peptide_key: "tb-500", dosages: [5, 10], basePrice: 55, variance: 0.12 },
    { peptide_key: "semaglutide", dosages: [5, 10, 15], basePrice: 89, variance: 0.2 },
    { peptide_key: "tirzepatide", dosages: [5, 10, 15], basePrice: 95, variance: 0.18 },
    { peptide_key: "retatrutide", dosages: [10, 15], basePrice: 120, variance: 0.22 },
    { peptide_key: "ipamorelin", dosages: [2, 5, 10], basePrice: 35, variance: 0.1 },
    { peptide_key: "cjc-1295", dosages: [2, 5], basePrice: 42, variance: 0.11 },
    { peptide_key: "ghk-cu", dosages: [50, 100], basePrice: 38, variance: 0.09 },
    { peptide_key: "pt-141", dosages: [10], basePrice: 48, variance: 0.13 },
    { peptide_key: "melanotan-ii", dosages: [10], basePrice: 32, variance: 0.08 },
    { peptide_key: "aod-9604", dosages: [5], basePrice: 55, variance: 0.14 },
    { peptide_key: "mots-c", dosages: [10], basePrice: 65, variance: 0.16 },
    { peptide_key: "sermorelin", dosages: [2, 5], basePrice: 40, variance: 0.1 },
    { peptide_key: "tesamorelin", dosages: [2, 5], basePrice: 75, variance: 0.17 },
    { peptide_key: "selank", dosages: [5, 10], basePrice: 36, variance: 0.09 },
    { peptide_key: "semax", dosages: [5, 10], basePrice: 34, variance: 0.09 },
    { peptide_key: "thymosin-alpha-1", dosages: [5, 10], basePrice: 85, variance: 0.19 },
  ];

  return {
    config,
    async scrape() {
      const hash = config.slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      const products: ScrapedProduct[] = [];

      for (const item of demoCatalog) {
        for (const dosage of item.dosages) {
          const jitter = 1 + ((hash % 100) / 100 - 0.5) * item.variance * 2;
          const price = Math.round(item.basePrice * (dosage / 5) * jitter * 100) / 100;
          const label = PEPTIDE_CATALOG[item.peptide_key]?.label ?? item.peptide_key;

          products.push({
            external_id: slugify(`${config.slug}-${item.peptide_key}-${dosage}`),
            name: `${label} ${dosage}mg`,
            peptide_key: item.peptide_key,
            dosage_mg: dosage,
            dosage_label: `${dosage}mg`,
            price,
            price_per_mg: calcPricePerMg(price, dosage),
            in_stock: (hash + dosage) % 13 !== 0,
            product_url: `${config.website}/product/${normalizePeptideKey(label)}-${dosage}mg`,
            purity: "99%+",
            has_coa: config.trust_score >= 7,
          });
        }
      }

      return products;
    },
  };
}
