"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { DealCard } from "@/components/DealCard";
import { cn } from "@/lib/utils";
import type { Deal } from "@/lib/deals";

type TabKey = "all" | "best_value" | "category_deals" | "price_drops" | "bulk_discounts";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "best_value", label: "Best Value" },
  { key: "category_deals", label: "Category Deals" },
  { key: "price_drops", label: "Price Drops" },
  { key: "bulk_discounts", label: "Bulk Discounts" },
];

function DealsPageContent() {
  const searchParams = useSearchParams();
  const activeTab: TabKey = (searchParams.get("type") as TabKey) ?? "all";

  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    const params = new URLSearchParams();
    if (activeTab !== "all") {
      params.set("type", activeTab);
    }
    params.set("limit", "20");

    fetch(`/api/deals?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (activeTab === "all") {
          const all: Deal[] = [
            ...(data.best_value ?? []),
            ...(data.category_deals ?? []),
            ...(data.price_drops ?? []),
            ...(data.bulk_discounts ?? []),
          ];
          all.sort((a, b) => a.price_per_mg - b.price_per_mg);
          setDeals(all);
        } else {
          setDeals(data.deals ?? []);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Peptide Deals</h1>
        <p className="text-muted text-sm mt-1">
          Best prices across 60+ suppliers
        </p>
      </div>

      <div className="flex gap-1 glass rounded-lg p-1 mb-6 overflow-x-auto">
        {TABS.map((tab) => {
          const href =
            tab.key === "all" ? "/deals" : `/deals?type=${tab.key}`;
          return (
            <Link
              key={tab.key}
              href={href}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap",
                activeTab === tab.key
                  ? "bg-accent text-background font-medium"
                  : "text-muted hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {loading && (
        <div className="grid md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="glass rounded-xl p-5 animate-pulse space-y-3"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-surface-elevated" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-elevated rounded w-3/4" />
                  <div className="h-3 bg-surface-elevated rounded w-1/2" />
                </div>
                <div className="space-y-2">
                  <div className="h-5 bg-surface-elevated rounded w-16" />
                  <div className="h-3 bg-surface-elevated rounded w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold mb-2">
            Couldn&apos;t fetch deals. Try again.
          </h2>
          <p className="text-muted text-sm">
            Something went wrong loading deals.
          </p>
        </div>
      )}

      {!loading && !error && deals.length === 0 && (
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold mb-2">No deals found</h2>
          <p className="text-muted text-sm">
            No deals found. Try searching for a specific peptide.
          </p>
        </div>
      )}

      {!loading && !error && deals.length > 0 && (
        <div className="grid md:grid-cols-2 gap-3">
          {deals.map((deal) => (
            <DealCard key={deal.product_id} deal={deal} />
          ))}
        </div>
      )}
    </main>
  );
}

export default function DealsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-muted">Loading deals...</div>
        </div>
      }
    >
      <DealsPageContent />
    </Suspense>
  );
}
