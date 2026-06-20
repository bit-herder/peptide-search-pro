import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Header } from "@/components/Header";
import { TrustBadge } from "@/components/TrustBadge";
import { getPeptideGuide } from "@/lib/peptide-guides";
import { getProductsByPeptideKey, getPeptideListingStats } from "@/lib/db";
import { PEPTIDE_CATALOG } from "@/lib/peptides";
import { computeTrustProfile } from "@/lib/trust";
import { formatPrice, formatPricePerMg } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getPeptideGuide(slug);
  if (!guide) return { title: "Peptide Not Found" };
  const stats = await getPeptideListingStats(slug);
  const priceHint =
    stats.min_price_per_mg != null
      ? ` from ${formatPricePerMg(stats.min_price_per_mg)}`
      : "";
  return {
    title: `${guide.label} Price Comparison${priceHint} | PeptideSearch Pro`,
    description: `${guide.summary} Compare ${stats.listings} live listings across ${stats.providers} suppliers.`,
  };
}

export default async function PeptidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getPeptideGuide(slug);
  if (!guide || !PEPTIDE_CATALOG[slug]) notFound();

  const stats = await getPeptideListingStats(slug);
  const products = await getProductsByPeptideKey(slug, 30);
  const productsWithTrust = await Promise.all(
    products.slice(0, 15).map(async (p) => ({
      product: p,
      trust: await computeTrustProfile(p.provider_slug),
    }))
  );

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <nav className="text-sm text-muted mb-4">
          <Link href="/peptides" className="hover:text-accent">
            Peptides
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{guide.label}</span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{guide.label} Prices</h1>
            <p className="text-muted max-w-2xl">{guide.summary}</p>
          </div>
          <Link
            href={`/search?q=${encodeURIComponent(guide.label)}`}
            className="bg-accent hover:bg-accent-dim text-background font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            Search all listings
          </Link>
        </div>

        <div className="grid sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Listings", value: stats.listings.toString() },
            { label: "Suppliers", value: stats.providers.toString() },
            {
              label: "Best $/mg",
              value: stats.min_price_per_mg != null ? formatPricePerMg(stats.min_price_per_mg) : "—",
            },
            {
              label: "Lowest price",
              value: stats.min_price != null ? formatPrice(stats.min_price) : "—",
            },
          ].map((s) => (
            <div key={s.label} className="glass rounded-xl p-4 text-center">
              <div className="text-xs text-muted mb-1">{s.label}</div>
              <div className="font-mono font-semibold text-lg">{s.value}</div>
            </div>
          ))}
        </div>

        {productsWithTrust.length > 0 ? (
          <div className="glass rounded-xl overflow-hidden mb-10">
            <div className="px-4 py-3 border-b border-border text-sm font-medium">
              Top listings by $/mg
            </div>
            <div className="divide-y divide-border">
              {productsWithTrust.map(({ product: p, trust }) => (
                  <div
                    key={p.id}
                    className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-surface-elevated/50"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <Link
                          href={`/vendors/${p.provider_slug}`}
                          className="hover:text-accent"
                        >
                          {p.provider_name}
                        </Link>
                        <TrustBadge score={trust.score} size="sm" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="font-mono font-semibold">{formatPrice(p.price)}</div>
                        <div className="text-xs text-muted">{formatPricePerMg(p.price_per_mg)}</div>
                      </div>
                      <a
                        href={p.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:text-accent-dim"
                        aria-label="View product"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-muted mb-10">
            No live listings yet.{" "}
            <Link href={`/search?q=${encodeURIComponent(guide.label)}`} className="text-accent">
              Run a web search
            </Link>{" "}
            to discover stores.
          </p>
        )}

        {guide.faq.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4">FAQ</h2>
            <div className="space-y-4">
              {guide.faq.map((item) => (
                <div key={item.q} className="glass rounded-xl p-4">
                  <h3 className="font-medium mb-1">{item.q}</h3>
                  <p className="text-sm text-muted">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/tools/reconstitution" className="text-accent hover:underline">
            Reconstitution calculator
          </Link>
          <span className="text-muted">·</span>
          <Link href="/alerts" className="text-accent hover:underline">
            Set a price alert
          </Link>
        </div>

        <p className="text-xs text-muted mt-8 max-w-2xl">
          For laboratory research use only. Not medical advice. Prices change frequently —
          verify on the supplier site before ordering.
        </p>
      </main>
    </>
  );
}
