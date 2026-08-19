"use client";

import Link from "next/link";
import { ArrowLeft, FlaskConical, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { parentSiteHref, siteConfig } from "@/lib/site-config";

export function Header() {
  const { user, loading, isAuthenticated, openSignIn, signOut } = useAuth();
  const parentHref = parentSiteHref();

  return (
    <header className="border-b border-border/50 glass sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          {parentHref && (
            <a
              href={parentHref}
              className="hidden sm:inline-flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {siteConfig.parentSiteName}
            </a>
          )}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
            <FlaskConical className="w-6 h-6 text-accent" />
            <span>
              Peptide<span className="text-accent">Search</span> Pro
            </span>
          </Link>
        </div>
        <nav className="flex items-center gap-4 sm:gap-5 text-sm text-muted">
          <Link href="/search" className="hover:text-foreground transition-colors">
            Search
          </Link>
          <Link href="/peptides" className="hover:text-foreground transition-colors hidden sm:inline">
            Peptides
          </Link>
          <Link href="/tools" className="hover:text-foreground transition-colors">
            Tools
          </Link>
          <Link href="/providers" className="hover:text-foreground transition-colors hidden sm:inline">
            Providers
          </Link>
          <Link href="/deals" className="hover:text-foreground transition-colors">
            Deals
          </Link>
          <Link href="/alerts" className="hover:text-foreground transition-colors hidden md:inline">
            Alerts
          </Link>

          {!loading && (
            isAuthenticated && user ? (
              <div className="flex items-center gap-2 pl-1 border-l border-border/50">
                <span className="text-xs text-muted hidden lg:inline truncate max-w-[140px]">
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openSignIn("general")}
                className="flex items-center gap-1 text-accent hover:text-accent-dim transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign in</span>
              </button>
            )
          )}

          <span className="hidden xl:inline text-xs px-2 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
            Research Use Only
          </span>
        </nav>
      </div>
    </header>
  );
}
