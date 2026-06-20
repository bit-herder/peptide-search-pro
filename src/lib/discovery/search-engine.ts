import type { SearchHit } from "./types";

const USER_AGENT =
  "PeptideSearchPro/1.0 (+https://peptidesearch.pro; research price aggregator)";

const BLOCKED_DOMAINS = new Set([
  "reddit.com",
  "www.reddit.com",
  "wikipedia.org",
  "youtube.com",
  "facebook.com",
  "twitter.com",
  "x.com",
  "instagram.com",
  "pubmed.ncbi.nlm.nih.gov",
  "ncbi.nlm.nih.gov",
  "amazon.com",
  "ebay.com",
  "pinterest.com",
  "linkedin.com",
  "quora.com",
  "tiktok.com",
  "peptidebase.io",
  "peptigrity.com",
  "thepeptideindex.org",
  "peptinox.com",
  "peptidedeck.com",
  "peptideresearchreviews.com",
  "thepeptidecatalog.com",
  "peptideals.com",
  "peptideprice.store",
  "peptides.org",
]);

const BLOCKED_TITLE_KEYWORDS = [
  "review",
  "where to buy",
  "vendor guide",
  "vendor-by-vendor",
  "compare peptide prices",
  "for sale: verified vendors",
];

export function buildPeptideSearchQuery(peptideLabel: string): string {
  return `${peptideLabel} research peptide buy price`;
}

export function isBlockedUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    for (const blocked of BLOCKED_DOMAINS) {
      if (host === blocked.replace(/^www\./, "") || host.endsWith(`.${blocked}`)) {
        return true;
      }
    }
    return false;
  } catch {
    return true;
  }
}

export function isBlockedHit(hit: SearchHit): boolean {
  if (isBlockedUrl(hit.url)) return true;
  const text = `${hit.title} ${hit.snippet ?? ""}`.toLowerCase();
  return BLOCKED_TITLE_KEYWORDS.some((kw) => text.includes(kw));
}

export function dedupeSearchHits(hits: SearchHit[]): SearchHit[] {
  const seen = new Set<string>();
  const out: SearchHit[] = [];
  for (const hit of hits) {
    try {
      const url = new URL(hit.url);
      const key = url.hostname.replace(/^www\./, "") + url.pathname.replace(/\/$/, "");
      if (seen.has(key) || isBlockedHit(hit)) continue;
      seen.add(key);
      out.push(hit);
    } catch {
      // skip invalid URLs
    }
  }
  return out;
}

async function searchSerpApi(query: string): Promise<SearchHit[]> {
  const key = process.env.SERPAPI_KEY;
  if (!key) return [];

  const params = new URLSearchParams({
    engine: "google",
    q: query,
    num: "20",
    api_key: key,
  });

  const res = await fetch(`https://serpapi.com/search.json?${params}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    organic_results?: Array<{ title?: string; link?: string; snippet?: string }>;
  };

  return (data.organic_results ?? [])
    .filter((r) => r.link && r.title)
    .map((r) => ({
      title: r.title!,
      url: r.link!,
      snippet: r.snippet,
    }));
}

async function searchGoogleCse(query: string): Promise<SearchHit[]> {
  const key = process.env.GOOGLE_CSE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;
  if (!key || !cx) return [];

  const params = new URLSearchParams({
    key,
    cx,
    q: query,
    num: "10",
  });

  const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    items?: Array<{ title?: string; link?: string; snippet?: string }>;
  };

  return (data.items ?? [])
    .filter((r) => r.link && r.title)
    .map((r) => ({
      title: r.title!,
      url: r.link!,
      snippet: r.snippet,
    }));
}

async function searchDuckDuckGo(query: string): Promise<SearchHit[]> {
  const body = new URLSearchParams({ q: query, b: "", kl: "us-en" });
  const res = await fetch("https://html.duckduckgo.com/html/", {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return [];

  const html = await res.text();
  const hits: SearchHit[] = [];
  const linkRe =
    /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const snippetRe =
    /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;

  let match: RegExpExecArray | null;
  const snippets: string[] = [];
  while ((match = snippetRe.exec(html)) !== null) {
    snippets.push(stripTags(match[1]));
  }

  let i = 0;
  linkRe.lastIndex = 0;
  while ((match = linkRe.exec(html)) !== null) {
    let url = decodeURIComponent(match[1]);
    if (url.startsWith("//duckduckgo.com/l/?uddg=")) {
      try {
        url = decodeURIComponent(url.split("uddg=")[1]?.split("&")[0] ?? url);
      } catch {
        // keep original
      }
    }
    hits.push({
      title: stripTags(match[2]),
      url,
      snippet: snippets[i],
    });
    i++;
  }

  return hits;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export async function searchWeb(query: string): Promise<{
  hits: SearchHit[];
  provider: string;
}> {
  if (process.env.SERPAPI_KEY) {
    const hits = await searchSerpApi(query);
    if (hits.length) return { hits: dedupeSearchHits(hits), provider: "serpapi" };
  }

  if (process.env.GOOGLE_CSE_API_KEY && process.env.GOOGLE_CSE_ID) {
    const hits = await searchGoogleCse(query);
    if (hits.length) return { hits: dedupeSearchHits(hits), provider: "google_cse" };
  }

  const hits = await searchDuckDuckGo(query);
  return { hits: dedupeSearchHits(hits), provider: "duckduckgo" };
}

export function getDomainName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const base = host.split(".")[0] ?? host;
    return base
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  } catch {
    return "Unknown Store";
  }
}

export function getDomainSlug(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").replace(/\./g, "-");
  } catch {
    return "unknown-store";
  }
}

export function getOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}
