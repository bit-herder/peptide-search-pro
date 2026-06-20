import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { TRUST_METHODOLOGY } from "@/lib/trust";

export const metadata: Metadata = {
  title: "How We Score Supplier Trust | PeptideSearch Pro",
  description:
    "Transparent trust scoring based on COA coverage, catalog depth, data freshness, and editorial baseline. Not paid rankings.",
};

export default function HowWeScorePage() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">How We Score Trust</h1>
        <p className="text-muted mb-8">
          PeptideSearch Pro scores suppliers on a 1–10 scale using observable data from our
          index — not paid placements. Web-discovered stores get a flat 5.5 until we index
          enough data to compute a full profile.
        </p>

        <div className="space-y-6 mb-10">
          {TRUST_METHODOLOGY.map((item) => (
            <div key={item.title} className="glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-lg">{item.title}</h2>
                <span className="text-xs font-mono text-accent">{item.weight}</span>
              </div>
              <p className="text-sm text-muted">{item.description}</p>
            </div>
          ))}
        </div>

        <section className="glass rounded-xl p-5 mb-8">
          <h2 className="font-semibold mb-3">What we don&apos;t do</h2>
          <ul className="text-sm text-muted space-y-2 list-disc pl-5">
            <li>Accept payment to boost rankings</li>
            <li>Audit every COA independently — we flag listings with COA language</li>
            <li>Guarantee supplier legitimacy — always do your own due diligence</li>
            <li>Index every store on the internet — tracked suppliers + web discovery</li>
          </ul>
        </section>

        <section className="glass rounded-xl p-5">
          <h2 className="font-semibold mb-3">Tier labels</h2>
          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-success font-medium">8.5+ Excellent</dt>
              <dd className="text-muted">Strong COA coverage, fresh data, deep catalog</dd>
            </div>
            <div>
              <dt className="text-accent font-medium">7.0+ Good</dt>
              <dd className="text-muted">Solid index data with reasonable transparency signals</dd>
            </div>
            <div>
              <dt className="text-muted font-medium">5.5+ Fair</dt>
              <dd className="text-muted">Limited COA or stale scrape data</dd>
            </div>
            <div>
              <dt className="text-danger font-medium">Below 5.5 Limited</dt>
              <dd className="text-muted">Minimal indexed data or web-only discovery</dd>
            </div>
          </dl>
        </section>

        <p className="text-xs text-muted mt-8">
          Scores update automatically when we re-scrape.{" "}
          <Link href="/providers" className="text-accent hover:underline">
            Browse all providers
          </Link>
        </p>
      </main>
    </>
  );
}
