import {
  getAllProvidersFromDb,
  getProviderFromDb,
  getProviderProductStats,
} from "./db";
import { getProviderBySlug } from "./providers-config";

export interface TrustFactor {
  label: string;
  detail: string;
  points: number;
  maxPoints: number;
}

export interface TrustProfile {
  slug: string;
  score: number;
  tier: "excellent" | "good" | "fair" | "limited";
  factors: TrustFactor[];
  coaRate: number;
  productCount: number;
  lastScraped: string | null;
}

export const TRUST_METHODOLOGY = [
  {
    title: "COA coverage",
    weight: "Up to 35 pts",
    description:
      "Share of indexed products flagged with Certificate of Analysis (COA) language on the listing or vendor site.",
  },
  {
    title: "Catalog depth",
    weight: "Up to 25 pts",
    description:
      "Number of peptide SKUs we currently index from the vendor. More listings = more data confidence.",
  },
  {
    title: "Data freshness",
    weight: "Up to 20 pts",
    description: "How recently our scrapers successfully pulled prices from this vendor.",
  },
  {
    title: "Operational baseline",
    weight: "Up to 20 pts",
    description:
      "Editorial baseline for known community reputation, payment transparency, and operating history. Updated manually.",
  },
];

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr} UTC`);
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

export async function computeTrustProfile(slug: string): Promise<TrustProfile> {
  const config = getProviderBySlug(slug);
  const dbProvider = await getProviderFromDb(slug);
  const stats = await getProviderProductStats(slug);
  const productCount = stats?.total ?? 0;
  const coaCount = stats?.coa_count ?? 0;
  const coaRate = productCount > 0 ? coaCount / productCount : 0;
  const lastScraped = stats?.last_scraped ?? dbProvider?.last_scraped_at ?? null;
  const days = daysSince(lastScraped);

  const coaPoints = Math.round(coaRate * 35);
  const depthPoints = Math.min(25, Math.round((productCount / 40) * 25));
  let freshnessPoints = 0;
  if (days !== null) {
    if (days <= 3) freshnessPoints = 20;
    else if (days <= 7) freshnessPoints = 15;
    else if (days <= 14) freshnessPoints = 10;
    else if (days <= 30) freshnessPoints = 5;
  }
  const editorialBase = config?.trust_score ?? dbProvider?.trust_score ?? 5;
  const editorialPoints = Math.round(Math.min(10, Math.max(5, editorialBase)) * 2);

  const factors: TrustFactor[] = [
    {
      label: "COA coverage",
      detail: `${coaCount} of ${productCount} listings (${Math.round(coaRate * 100)}%)`,
      points: coaPoints,
      maxPoints: 35,
    },
    {
      label: "Catalog depth",
      detail: `${productCount} indexed products`,
      points: depthPoints,
      maxPoints: 25,
    },
    {
      label: "Data freshness",
      detail: lastScraped ? `Last indexed ${days ?? "?"} days ago` : "Not yet indexed",
      points: freshnessPoints,
      maxPoints: 20,
    },
    {
      label: "Operational baseline",
      detail: "Community reputation & transparency (editorial)",
      points: editorialPoints,
      maxPoints: 20,
    },
  ];

  const totalPoints = factors.reduce((s, f) => s + f.points, 0);
  const normalized = Math.min(10, Math.max(1, Math.round((totalPoints / 10) * 10) / 10));

  let tier: TrustProfile["tier"] = "limited";
  if (normalized >= 8.5) tier = "excellent";
  else if (normalized >= 7) tier = "good";
  else if (normalized >= 5.5) tier = "fair";

  return {
    slug,
    score: normalized,
    tier,
    factors,
    coaRate,
    productCount,
    lastScraped,
  };
}

export async function getAllTrustProfiles(): Promise<TrustProfile[]> {
  const providers = await getAllProvidersFromDb();
  const slugs = new Set(providers.map((p) => p.slug));
  const profiles = await Promise.all(Array.from(slugs).map((slug) => computeTrustProfile(slug)));
  return profiles.sort((a, b) => b.score - a.score);
}
