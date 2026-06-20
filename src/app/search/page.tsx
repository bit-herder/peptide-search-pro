"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { SearchHero } from "@/components/SearchHero";
import { SearchResults } from "@/components/SearchResults";
import { useAuth } from "@/components/auth/AuthProvider";
import { SearchProduct } from "@/lib/search";
import { Loader2 } from "lucide-react";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") ?? "";
  const sort = searchParams.get("sort") ?? "price_per_mg";
  const { isAuthenticated, loading: authLoading, recordAction, actionsRemaining } = useAuth();

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [meta, setMeta] = useState({
    peptide_key: null as string | null,
    total: 0,
    providers_count: 0,
    lowest_price: null as number | null,
    lowest_price_per_mg: null as number | null,
    tracked_count: 0,
    discovered_count: 0,
  });
  const lastCountedQuery = useRef<string | null>(null);

  const fetchResults = useCallback(async (q: string, s: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}&sort=${encodeURIComponent(s)}&discover=true`
      );
      const data = await res.json();
      setResults(data.results ?? []);
      setMeta({
        peptide_key: data.peptide_key,
        total: data.total,
        providers_count: data.providers_count,
        lowest_price: data.lowest_price,
        lowest_price_per_mg: data.lowest_price_per_mg,
        tracked_count: data.tracked_count ?? 0,
        discovered_count: data.discovered_count ?? 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(query, sort);
  }, [query, sort, fetchResults]);

  useEffect(() => {
    if (authLoading || !query.trim() || isAuthenticated) return;
    if (lastCountedQuery.current === query) return;
    recordAction("search", query);
    lastCountedQuery.current = query;
  }, [query, isAuthenticated, authLoading, recordAction]);

  function handleSortChange(newSort: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", newSort);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <SearchHero initialQuery={query} compact />

        {!authLoading && !isAuthenticated && query && !loading && (
          <p className="text-xs text-muted text-center mb-4">
            {actionsRemaining} free action{actionsRemaining === 1 ? "" : "s"} left — searches and
            supplier clicks each count
          </p>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
            <span className="text-muted">Searching tracked suppliers &amp; scanning the web...</span>
            <span className="text-xs text-muted/70">This can take up to 30 seconds</span>
          </div>
        ) : query ? (
          <SearchResults
            results={results}
            query={query}
            peptideKey={meta.peptide_key}
            sort={sort}
            onSortChange={handleSortChange}
            lowestPrice={meta.lowest_price}
            lowestPricePerMg={meta.lowest_price_per_mg}
            providersCount={meta.providers_count}
            trackedCount={meta.tracked_count}
            discoveredCount={meta.discovered_count}
          />
        ) : (
          <p className="text-center text-muted py-12">Enter a peptide to search</p>
        )}
      </main>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
