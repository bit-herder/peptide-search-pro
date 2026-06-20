"use client";

import { ExternalLink, ShieldCheck, Package, Globe } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { SearchProduct } from "@/lib/search";
import { PEPTIDE_CATALOG } from "@/lib/peptides";
import { cn, formatPrice, formatPricePerMg } from "@/lib/utils";

interface SearchResultsProps {
  results: SearchProduct[];
  query: string;
  peptideKey: string | null;
  sort: string;
  onSortChange: (sort: string) => void;
  lowestPrice: number | null;
  lowestPricePerMg: number | null;
  providersCount: number;
  trackedCount?: number;
  discoveredCount?: number;
}

const SORT_OPTIONS = [
  { value: "price_per_mg", label: "Best $/mg" },
  { value: "price", label: "Lowest Price" },
  { value: "trust", label: "Highest Trust" },
  { value: "name", label: "Name A-Z" },
];

export function SearchResults({
  results,
  query,
  peptideKey,
  sort,
  onSortChange,
  lowestPrice,
  lowestPricePerMg,
  providersCount,
  trackedCount,
  discoveredCount,
}: SearchResultsProps) {
  const peptideLabel = peptideKey
    ? PEPTIDE_CATALOG[peptideKey]?.label ?? query
    : query;

  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="w-12 h-12 text-muted mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No results for &ldquo;{query}&rdquo;</h2>
        <p className="text-muted max-w-md mx-auto">
          Try a different peptide name or check the spelling. Popular searches include
          BPC-157, Semaglutide, and Tirzepatide.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{peptideLabel} Prices</h1>
          <p className="text-muted text-sm mt-1">
            {results.length} listings from {providersCount} stores
            {trackedCount !== undefined && discoveredCount !== undefined && discoveredCount > 0 && (
              <> · {trackedCount} tracked + {discoveredCount} from web search</>
            )}
            {lowestPrice !== null && <> · Best price {formatPrice(lowestPrice)}</>}
            {lowestPricePerMg !== null && <> · Best {formatPricePerMg(lowestPricePerMg)}</>}
          </p>
        </div>

        <div className="flex gap-1 glass rounded-lg p-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSortChange(opt.value)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors",
                sort === opt.value
                  ? "bg-accent text-background font-medium"
                  : "text-muted hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {results.map((product, index) => (
          <ProductCard key={product.id} product={product} rank={index + 1} />
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product, rank }: { product: SearchProduct; rank: number }) {
  const { recordAction, isAuthenticated, isGuestLocked } = useAuth();
  const isBestDeal = rank === 1;
  const isDiscovered = product.source === "discovered";

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (isAuthenticated) return;

    if (isGuestLocked) {
      e.preventDefault();
      return;
    }

    const allowed = recordAction("outbound_click", String(product.id));
    if (!allowed) {
      e.preventDefault();
    }
  }

  return (
    <a
      href={product.product_url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={cn(
        "glass rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-accent/30 transition-all group",
        isBestDeal && "border-accent/40 glow-accent"
      )}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center font-mono text-sm font-bold shrink-0",
            isBestDeal ? "bg-accent/20 text-accent" : "bg-surface-elevated text-muted"
          )}
        >
          #{rank}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold truncate group-hover:text-accent transition-colors">
              {product.name}
            </h3>
            {isBestDeal && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success font-medium">
                Best Deal
              </span>
            )}
            {isDiscovered && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 flex items-center gap-1">
                <Globe className="w-3 h-3" /> Web
              </span>
            )}
            {product.has_coa === 1 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> COA
              </span>
            )}
          </div>
          <p className="text-sm text-muted mt-0.5">
            {product.provider_name}
            {product.dosage_label && ` · ${product.dosage_label}`}
            {product.purity && ` · ${product.purity} purity`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 sm:gap-8 shrink-0 pl-14 sm:pl-0">
        <div className="text-right">
          <div className="text-xl font-bold font-mono">{formatPrice(product.price)}</div>
          <div className="text-xs text-muted">{formatPricePerMg(product.price_per_mg)}</div>
        </div>
        <ExternalLink className="w-4 h-4 text-muted group-hover:text-accent transition-colors shrink-0" />
      </div>
    </a>
  );
}
