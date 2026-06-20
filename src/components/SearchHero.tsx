"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Search, TrendingDown, Shield, Zap } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { TRACKED_PROVIDER_COUNT } from "@/lib/providers-config";

interface Suggestion {
  key: string;
  label: string;
  category: string;
}

interface SearchHeroProps {
  initialQuery?: string;
  compact?: boolean;
}

export function SearchHero({ initialQuery = "", compact = false }: SearchHeroProps) {
  const router = useRouter();
  const { isGuestLocked, isAuthenticated } = useAuth();
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchSuggestions = useCallback(async (q: string) => {
    const res = await fetch(`/api/suggest?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setSuggestions(data.suggestions ?? []);
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 150);
    return () => clearTimeout(debounceRef.current);
  }, [query, fetchSuggestions]);

  function goToSearch(term: string) {
    const trimmed = term.trim();
    if (!trimmed) return;
    if (!isAuthenticated && isGuestLocked) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    setShowSuggestions(false);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    goToSearch(query);
  }

  function selectSuggestion(s: Suggestion) {
    setQuery(s.label);
    goToSearch(s.label);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  const popular = [
    "BPC-157",
    "Semaglutide",
    "Tirzepatide",
    "TB-500",
    "Ipamorelin",
    "Retatrutide",
  ];

  return (
    <div className={cn("w-full max-w-3xl mx-auto", compact ? "py-4" : "py-8")}>
      {!compact && (
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            Find the <span className="text-gradient">best peptide prices</span>
            <br />
            across {TRACKED_PROVIDER_COUNT}+ tracked suppliers
          </h1>
          <p className="text-lg text-muted max-w-xl mx-auto">
            Search {TRACKED_PROVIDER_COUNT}+ tracked suppliers and discover more across the web.
            Compare dosages, COA availability, and $/mg in one search.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <div className="glass glow-accent rounded-2xl p-1.5 flex items-center gap-2">
          <Search className="w-5 h-5 text-muted ml-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder="Search peptides — BPC-157, Semaglutide, Tirzepatide..."
            className="flex-1 bg-transparent py-3.5 px-2 text-foreground placeholder:text-muted/60 outline-none text-lg"
            autoComplete="off"
            disabled={isGuestLocked && !isAuthenticated}
          />
          <button
            type="submit"
            disabled={isGuestLocked && !isAuthenticated}
            className="bg-accent hover:bg-accent-dim text-background font-semibold px-6 py-3 rounded-xl transition-colors shrink-0 disabled:opacity-50"
          >
            Search
          </button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-50 w-full mt-2 glass rounded-xl overflow-hidden shadow-2xl">
            {suggestions.map((s, i) => (
              <li key={s.key}>
                <button
                  type="button"
                  onMouseDown={() => selectSuggestion(s)}
                  className={cn(
                    "w-full text-left px-4 py-3 flex items-center justify-between hover:bg-surface-elevated transition-colors",
                    i === activeIndex && "bg-surface-elevated"
                  )}
                >
                  <span className="font-medium">{s.label}</span>
                  <span className="text-xs text-muted">{s.category}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>

      {!compact && (
        <>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {popular.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => goToSearch(p)}
                disabled={isGuestLocked && !isAuthenticated}
                className="text-sm px-3 py-1.5 rounded-full border border-border-bright text-muted hover:text-accent hover:border-accent/50 transition-colors disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
            {[
              { icon: TrendingDown, title: "Best Price", desc: "Sorted by $/mg so you compare apples to apples" },
              { icon: Shield, title: "Tracked Suppliers", desc: "Including VPR Members Club and other vetted research suppliers" },
              { icon: Zap, title: "Web Discovery", desc: "Scours search engines for stores selling your peptide" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass rounded-xl p-5 text-center">
                <Icon className="w-8 h-8 text-accent mx-auto mb-3" />
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
