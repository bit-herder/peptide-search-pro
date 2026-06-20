import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Header } from "@/components/Header";
import { ProviderProfilePanel } from "@/components/ProviderProfilePanel";
import { TrustBadge } from "@/components/TrustBadge";
import { getProductsByProviderSlug, getProviderFromDb, getProviderProfile } from "@/lib/db";
import { getProviderBySlug } from "@/lib/providers-config";
import { computeTrustProfile } from "@/lib/trust";
import { formatPrice, formatPricePerMg, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = getProviderBySlug(slug);
  const db = await getProviderFromDb(slug);
  const name = config?.name ?? db?.name;
  if (!name) return { title: "Vendor Not Found" };
  const trust = await computeTrustProfile(slug);
  return {
    title: `${name} — Trust Score ${trust.score.toFixed(1)} & Prices | PeptideSearch Pro`,
    description: `View ${trust.productCount} indexed products from ${name}. Trust breakdown, COA coverage, and live peptide prices.`,
  };
}

export default async function VendorPage({ params }: PageProps) {
  const { slug } = await params;
  const config = getProviderBySlug(slug);
  const dbProvider = await getProviderFromDb(slug);
  if (!config && !dbProvider) notFound();

  const name = config?.name ?? dbProvider!.name;
  const website = config?.website ?? dbProvider!.website;
  const trust = await computeTrustProfile(slug);
  const products = await getProductsByProviderSlug(slug);
  const profile = await getProviderProfile(slug);

  const tierLabel = {
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
    limited: "Limited data",
  }[trust.tier];

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <nav className="text-sm text-muted mb-4">
          <Link href="/providers" className="hover:text-accent">
            Providers
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{name}</span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{name}</h1>
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-accent inline-flex items-center gap-1 text-sm"
            >
              {website.replace(/^https?:\/\//, "")}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="glass rounded-xl px-5 py-3 text-center">
            <div className="text-xs text-muted mb-1">Trust score</div>
            <TrustBadge score={trust.score} size="md" />
            <div className="text-xs text-muted mt-1">{tierLabel}</div>
          </div>
        </div>

        <section className="glass rounded-xl p-5 mb-8">
          <h2 className="font-semibold mb-4">How we scored {name}</h2>
          <div className="space-y-3">
            {trust.factors.map((f) => (
              <div key={f.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{f.label}</span>
                  <span className="font-mono text-muted">
                    {f.points}/{f.maxPoints}
                  </span>
                </div>
                <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${(f.points / f.maxPoints) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted mt-1">{f.detail}</p>
              </div>
            ))}
          </div>
          <Link href="/how-we-score" className="text-xs text-accent hover:underline mt-4 inline-block">
            Read full methodology →
          </Link>
        </section>

        {profile && (
          <ProviderProfilePanel profile={profile} providerName={name} showRawHits />
        )}

        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              Indexed products ({products.length})
            </h2>
            {trust.lastScraped && (
              <span className="text-xs text-muted">Updated {timeAgo(trust.lastScraped)}</span>
            )}
          </div>

          {products.length > 0 ? (
            <div className="glass rounded-xl overflow-hidden">
              <div className="divide-y divide-border">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-surface-elevated/50"
                  >
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <Link
                        href={`/peptides/${p.peptide_key}`}
                        className="text-xs text-muted hover:text-accent capitalize"
                      >
                        {p.peptide_key.replace(/-/g, " ")}
                      </Link>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-mono font-semibold">{formatPrice(p.price)}</div>
                        <div className="text-xs text-muted">{formatPricePerMg(p.price_per_mg)}</div>
                      </div>
                      <a
                        href={p.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted">
              No products indexed yet. Check back after the next scrape cycle.
            </p>
          )}
        </section>
      </main>
    </>
  );
}
