import Link from "next/link";
import type { ProviderProfile } from "@/lib/scraper/profile-types";
import { formatPrice, formatPricePerMg, timeAgo } from "@/lib/utils";

interface ProviderProfilePanelProps {
  profile: ProviderProfile;
  providerName: string;
  showRawHits?: boolean;
}

function SignalTags({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="text-xs text-muted mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="text-xs px-2 py-0.5 rounded-full bg-surface-elevated border border-border capitalize"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ProviderProfilePanel({
  profile,
  providerName,
  showRawHits = false,
}: ProviderProfilePanelProps) {
  const { catalog, site_signals } = profile;

  return (
    <div className="space-y-6">
      <section className="glass rounded-xl p-5">
        <h2 className="font-semibold mb-4">Catalog intelligence</h2>
        <p className="text-xs text-muted mb-4">
          Aggregated from {catalog.product_count} scraped listings · enriched{" "}
          {timeAgo(profile.enriched_at)}
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Peptides indexed", value: String(catalog.peptide_count) },
            {
              label: "COA listings",
              value: `${Math.round(catalog.coa_rate * 100)}%`,
            },
            {
              label: "In stock",
              value: `${Math.round(catalog.in_stock_rate * 100)}%`,
            },
            {
              label: "Best $/mg",
              value:
                catalog.min_price_per_mg != null
                  ? formatPricePerMg(catalog.min_price_per_mg)
                  : "—",
            },
          ].map((s) => (
            <div key={s.label} className="bg-surface-elevated rounded-lg p-3">
              <div className="text-xs text-muted">{s.label}</div>
              <div className="font-mono font-semibold">{s.value}</div>
            </div>
          ))}
        </div>

        {catalog.top_peptides.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Top peptides at {providerName}</div>
            <div className="flex flex-wrap gap-2">
              {catalog.top_peptides.map((p) => (
                <Link
                  key={p.key}
                  href={`/peptides/${p.key}`}
                  className="text-xs px-2.5 py-1 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                >
                  {p.label} ({p.listing_count})
                  {p.min_price_per_mg != null && (
                    <span className="text-muted ml-1">
                      from {formatPricePerMg(p.min_price_per_mg)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {catalog.purity_values.length > 0 && (
          <p className="text-xs text-muted mt-4">
            Purity mentions: {catalog.purity_values.join(", ")}
          </p>
        )}
        {catalog.dosage_range_mg.min != null && (
          <p className="text-xs text-muted mt-1">
            Dosage range: {catalog.dosage_range_mg.min}–{catalog.dosage_range_mg.max} mg
            · Price range {formatPrice(catalog.min_price ?? 0)}–
            {formatPrice(catalog.max_price ?? 0)}
          </p>
        )}
      </section>

      {site_signals.fetched && (
        <section className="glass rounded-xl p-5">
          <h2 className="font-semibold mb-2">Site signals</h2>
          <p className="text-xs text-muted mb-4">
            Detected from {site_signals.pages_checked.length} page(s) on the supplier site.
            Stored for cross-analysis as we add more comparison features.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <SignalTags label="Payment" items={site_signals.payment} />
            <SignalTags label="Shipping" items={site_signals.shipping} />
            <SignalTags label="Lab & testing" items={site_signals.lab_testing} />
            <SignalTags label="Compliance" items={site_signals.compliance} />
            <SignalTags label="Contact channels" items={site_signals.contact} />
            <SignalTags label="Social" items={site_signals.social} />
          </div>
        </section>
      )}

      {showRawHits && site_signals.raw_hits.length > 0 && (
        <details className="glass rounded-xl p-5">
          <summary className="text-sm font-medium cursor-pointer">
            Raw signal snippets ({site_signals.raw_hits.length}) — for research
          </summary>
          <ul className="mt-3 space-y-2 text-xs text-muted max-h-64 overflow-y-auto">
            {site_signals.raw_hits.map((hit, i) => (
              <li key={i} className="border-l-2 border-accent/30 pl-2">
                <span className="text-accent uppercase">{hit.category}</span> · {hit.keyword}
                <div className="italic mt-0.5">&ldquo;{hit.snippet}&rdquo;</div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
