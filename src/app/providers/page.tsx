import Link from "next/link";
import { Header } from "@/components/Header";
import { TrustBadge } from "@/components/TrustBadge";
import { getProviderStats, getProviderProfile } from "@/lib/db";
import { PROVIDERS } from "@/lib/providers-config";
import { computeTrustProfile } from "@/lib/trust";
import { ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProvidersPage() {
  const stats = await getProviderStats();
  const profiles = await Promise.all(
    PROVIDERS.map(async (p) => ({
      provider: p,
      trust: await computeTrustProfile(p.slug),
      enrichment: await getProviderProfile(p.slug),
    }))
  );
  profiles.sort((a, b) => b.trust.score - a.trust.score);

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Tracked Providers</h1>
        <p className="text-muted mb-2">
          We monitor {stats.providers} research peptide suppliers with{" "}
          {stats.products.toLocaleString()} active product listings.
        </p>
        <p className="text-sm text-muted mb-8">
          Trust scores are computed from indexed data —{" "}
          <Link href="/how-we-score" className="text-accent hover:underline">
            see methodology
          </Link>
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map(({ provider, trust, enrichment }) => (
            <div key={provider.slug} className="glass rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <Link
                  href={`/vendors/${provider.slug}`}
                  className="font-semibold text-lg hover:text-accent transition-colors"
                >
                  {provider.name}
                </Link>
                <TrustBadge score={trust.score} />
              </div>
              <div className="text-xs text-muted mb-2 space-y-0.5">
                <div>{trust.productCount} products indexed</div>
                {enrichment && (
                  <>
                    <div>{enrichment.catalog.peptide_count} peptides · COA{" "}
                      {Math.round(enrichment.catalog.coa_rate * 100)}%</div>
                    {enrichment.site_signals.payment.length > 0 && (
                      <div className="capitalize">
                        Pays: {enrichment.site_signals.payment.slice(0, 3).join(", ")}
                      </div>
                    )}
                  </>
                )}
              </div>
              <a
                href={provider.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted hover:text-accent flex items-center gap-1 transition-colors"
              >
                {provider.website.replace(/^https?:\/\//, "")}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted mt-12 max-w-2xl">
          Scores reflect COA coverage, catalog depth, scrape freshness, and an editorial
          baseline — not paid rankings. Always verify supplier credentials before ordering.
        </p>
      </main>
    </>
  );
}
