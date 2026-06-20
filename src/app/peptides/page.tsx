import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { getAllPeptideGuides } from "@/lib/peptide-guides";
import { getPeptideListingStats } from "@/lib/db";
import { formatPrice, formatPricePerMg } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Research Peptides — Price Guides & Comparisons | PeptideSearch Pro",
  description:
    "Browse research peptide price guides. Compare live prices across tracked suppliers for BPC-157, Semaglutide, Tirzepatide, and more.",
};

export default async function PeptidesIndexPage() {
  const guides = getAllPeptideGuides();
  const guidesWithStats = await Promise.all(
    guides.map(async (guide) => ({
      guide,
      stats: await getPeptideListingStats(guide.key),
    }))
  );

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Research Peptide Guides</h1>
        <p className="text-muted mb-8 max-w-2xl">
          Live price comparisons and research summaries for popular peptides. Each page
          shows current listings from tracked suppliers — updated when we scrape.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guidesWithStats.map(({ guide, stats }) => (
            <Link
              key={guide.key}
              href={`/peptides/${guide.key}`}
              className="glass rounded-xl p-5 hover:border-accent/40 border border-transparent transition-colors group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="font-semibold text-lg group-hover:text-accent transition-colors">
                  {guide.label}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent shrink-0">
                  {guide.category}
                </span>
              </div>
              <p className="text-sm text-muted line-clamp-2 mb-3">{guide.summary}</p>
              <div className="flex flex-wrap gap-3 text-xs text-muted">
                <span>{stats.listings} listings</span>
                <span>{stats.providers} suppliers</span>
                {stats.min_price_per_mg != null && (
                  <span className="text-accent font-mono">
                    from {formatPricePerMg(stats.min_price_per_mg)}
                  </span>
                )}
                {stats.min_price_per_mg == null && stats.min_price != null && (
                  <span className="text-accent font-mono">
                    from {formatPrice(stats.min_price)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
