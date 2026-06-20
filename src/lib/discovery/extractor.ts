import * as cheerio from "cheerio";
import {
  calcPricePerMg,
  parseDosageMg,
  parsePrice,
  resolvePeptideKey,
} from "../peptides";
import { fetchHtml } from "../scraper/types";
import type { DiscoveredListing } from "./types";
import { getDomainName, getDomainSlug, getOrigin } from "./search-engine";

function extractJsonLdProduct(html: string): { name?: string; price?: number } | null {
  const scripts = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi
  );
  if (!scripts) return null;

  for (const script of scripts) {
    const jsonText = script
      .replace(/<script type="application\/ld\+json">/i, "")
      .replace(/<\/script>/i, "")
      .trim();
    try {
      const data = JSON.parse(jsonText) as unknown;
      const nodes = Array.isArray(data) ? data : [data];
      for (const node of nodes) {
        const obj = node as Record<string, unknown>;
        if (obj["@type"] === "Product" || obj["@type"] === "product") {
          const offers = obj.offers as Record<string, unknown> | undefined;
          const priceRaw =
            offers?.price ?? offers?.lowPrice ?? obj.price;
          const price =
            typeof priceRaw === "number"
              ? priceRaw
              : parsePrice(String(priceRaw ?? ""));
          return {
            name: typeof obj.name === "string" ? obj.name : undefined,
            price: price ?? undefined,
          };
        }
      }
    } catch {
      // try next script block
    }
  }
  return null;
}

function extractPriceFromHtml(html: string, $: cheerio.CheerioAPI): number | null {
  const jsonLd = extractJsonLdProduct(html);
  if (jsonLd?.price) return jsonLd.price;

  const ogPrice = $('meta[property="product:price:amount"]').attr("content");
  if (ogPrice) {
    const p = parsePrice(ogPrice);
    if (p) return p;
  }

  const selectors = [
    ".price .amount",
    ".woocommerce-Price-amount",
    ".product-price",
    "[itemprop='price']",
    ".price",
    ".product__price",
    ".money",
  ];
  for (const sel of selectors) {
    const text = $(sel).first().text().trim();
    const p = parsePrice(text);
    if (p && p > 0 && p < 10000) return p;
  }

  const priceMatch = html.match(/\$\s?(\d{1,4}(?:\.\d{2})?)/);
  return priceMatch ? parsePrice(priceMatch[0]) : null;
}

function extractNameFromHtml(
  html: string,
  $: cheerio.CheerioAPI,
  fallback: string
): string {
  const jsonLd = extractJsonLdProduct(html);
  if (jsonLd?.name) return jsonLd.name;

  const h1 =
    $("h1.product_title").first().text().trim() ||
    $("h1.entry-title").first().text().trim() ||
    $("h1").first().text().trim();
  if (h1) return h1;

  const ogTitle = $('meta[property="og:title"]').attr("content");
  if (ogTitle) return ogTitle;

  return fallback;
}

export async function extractListingFromUrl(
  url: string,
  peptideKey: string,
  fallbackTitle: string
): Promise<DiscoveredListing | null> {
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    const name = extractNameFromHtml(html, $, fallbackTitle);
    const resolvedKey = resolvePeptideKey(name) ?? peptideKey;
    if (resolvedKey !== peptideKey) {
      const nameLower = name.toLowerCase();
      const keyLabel = peptideKey.replace(/-/g, " ");
      if (!nameLower.includes(keyLabel) && !nameLower.includes(peptideKey.replace(/-/g, ""))) {
        return null;
      }
    }

    const price = extractPriceFromHtml(html, $);
    if (!price || price <= 0 || price < 12) return null;

    const dosage = parseDosageMg(name);
    const inStock =
      !$(".out-of-stock, .sold-out, .stock.out-of-stock").length &&
      !html.toLowerCase().includes("out of stock");

    const hasCoa =
      html.toLowerCase().includes("certificate of analysis") ||
      html.toLowerCase().includes("coa");

    return {
      name,
      peptide_key: peptideKey,
      dosage_mg: dosage.mg,
      dosage_label: dosage.label,
      price,
      price_per_mg: calcPricePerMg(price, dosage.mg),
      product_url: url,
      provider_name: getDomainName(url),
      provider_slug: `web-${getDomainSlug(url)}`,
      provider_website: getOrigin(url),
      in_stock: inStock,
      has_coa: hasCoa,
    };
  } catch {
    return null;
  }
}
