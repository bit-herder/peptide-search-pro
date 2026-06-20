"use client";

import { Mail } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { GUEST_ACTION_LIMIT } from "@/lib/guest-limits";

export function GuestLockedOverlay() {
  const { openSignIn } = useAuth();

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4 pointer-events-auto">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px]" aria-hidden />
      <div className="relative glass rounded-2xl p-6 w-full max-w-md border border-accent/30 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6 text-accent" />
        </div>
        <h2 className="text-xl font-bold mb-2">You&apos;ve used your {GUEST_ACTION_LIMIT} free actions</h2>
        <p className="text-sm text-muted mb-5">
          PeptideSearch Pro is completely free — we just need your email to keep going. Unlock
          unlimited searches, supplier links, calculators, and price alerts.
        </p>
        <button
          type="button"
          onClick={() => openSignIn("limit")}
          className="w-full bg-accent hover:bg-accent-dim text-background font-semibold py-3 rounded-xl transition-colors"
        >
          Continue free with email
        </button>
        <p className="text-xs text-muted mt-4">
          No password. Join our list for price drops, new suppliers, and peptide deals.
        </p>
      </div>
    </div>
  );
}
