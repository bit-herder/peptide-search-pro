import Link from "next/link";
import type { Metadata } from "next";
import {
  Beaker,
  Calculator,
  Droplets,
  FlaskConical,
  Layers,
  Scale,
  Store,
} from "lucide-react";
import { Header } from "@/components/Header";
import { TrustBadge } from "@/components/TrustBadge";
import { getTopEnrichedProviders } from "@/lib/db";
import { formatPricePerMg } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Peptide Research Calculators | PeptideSearch Pro",
  description:
    "Free reconstitution, dosage, price-per-mg, unit conversion, and blend calculators for laboratory research protocols.",
};

const TOOLS = [
  {
    href: "/tools/reconstitution",
    icon: Droplets,
    title: "Reconstitution",
    desc: "Peptide mg + bac water → concentration and units per draw",
  },
  {
    href: "/tools/dosage",
    icon: Beaker,
    title: "Dosage & Syringe",
    desc: "Desired mcg/mg dose → mL and insulin syringe units",
  },
  {
    href: "/tools/price-per-mg",
    icon: Calculator,
    title: "Price per mg",
    desc: "Compare vial value — normalize different sizes to $/mg",
  },
  {
    href: "/tools/units",
    icon: Scale,
    title: "Unit Converter",
    desc: "Convert mg, mcg (µg), and grams instantly",
  },
  {
    href: "/tools/blend",
    icon: Layers,
    title: "Blend / Combo",
    desc: "Two peptides in one vial — individual concentrations",
  },
];

export default async function ToolsHubPage() {
  const enriched = await getTopEnrichedProviders(6);

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-2">
          <FlaskConical className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold">Research Tools</h1>
        </div>
        <p className="text-muted mb-8 max-w-2xl">
          Calculators for reconstitution, dosing, and price normalization. Built for
          laboratory research workflows — not medical dosing advice.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="glass rounded-xl p-5 hover:border-accent/40 border border-transparent transition-colors group flex gap-4"
            >
              <tool.icon className="w-8 h-8 text-accent shrink-0 group-hover:scale-105 transition-transform" />
              <div>
                <h2 className="font-semibold text-lg group-hover:text-accent transition-colors">
                  {tool.title}
                </h2>
                <p className="text-sm text-muted">{tool.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {enriched.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-2 mb-2">
              <Store className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-bold">Supplier intelligence</h2>
            </div>
            <p className="text-sm text-muted mb-4 max-w-2xl">
              Each scrape builds a rich provider profile — catalog breadth, COA coverage,
              payment and shipping signals — so you can cross-check suppliers alongside
              calculator results. More data points unlock as we add comparison features.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {enriched.map(({ slug, name, trust_score, profile }) => (
                <Link
                  key={slug}
                  href={`/vendors/${slug}`}
                  className="glass rounded-xl p-4 hover:border-accent/40 border border-transparent transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-semibold group-hover:text-accent transition-colors">
                      {name}
                    </span>
                    <TrustBadge score={trust_score} size="sm" />
                  </div>
                  <div className="text-xs text-muted space-y-0.5">
                    <div>
                      {profile.catalog.peptide_count} peptides ·{" "}
                      {Math.round(profile.catalog.coa_rate * 100)}% COA
                    </div>
                    {profile.catalog.min_price_per_mg != null && (
                      <div>
                        From {formatPricePerMg(profile.catalog.min_price_per_mg)} / mg
                      </div>
                    )}
                    {profile.site_signals.payment.length > 0 && (
                      <div className="capitalize truncate">
                        {profile.site_signals.payment.slice(0, 2).join(" · ")}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            <Link
              href="/providers"
              className="text-sm text-accent hover:underline mt-4 inline-block"
            >
              Browse all providers →
            </Link>
          </section>
        )}

        <p className="text-xs text-muted mt-10 max-w-xl">
          Pair these tools with our{" "}
          <Link href="/search" className="text-accent hover:underline">
            price search
          </Link>{" "}
          and{" "}
          <Link href="/peptides" className="text-accent hover:underline">
            peptide guides
          </Link>{" "}
          for end-to-end research planning.
        </p>
      </main>
    </>
  );
}
