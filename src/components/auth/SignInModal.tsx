"use client";

import { useState } from "react";
import { Loader2, Mail, X } from "lucide-react";
import type { SignInReason } from "./AuthProvider";
import { GUEST_ACTION_LIMIT } from "@/lib/guest-limits";

const REASON_COPY: Record<SignInReason, { title: string; description: string }> = {
  search: {
    title: "Sign in to keep searching",
    description:
      "Create a free account with your email — no password needed — to unlock unlimited price comparisons and web discovery.",
  },
  alerts: {
    title: "Sign in to save price alerts",
    description:
      "Create a free account to save alerts and get notified when prices drop. Just your email — no password required.",
  },
  limit: {
    title: "Continue free — just add your email",
    description: `You've used ${GUEST_ACTION_LIMIT} free actions (searches, supplier clicks, or tool use). PeptideSearch Pro stays 100% free — enter your email to unlock everything and join our list for price drops and deals.`,
  },
  general: {
    title: "Create your free account",
    description:
      "Sign in with your email for unlimited searches, tools, and price alerts. No password required — we'll send price updates and peptide deals you can opt out of anytime.",
  },
};

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
  dismissable: boolean;
  reason: SignInReason;
  onSignIn: (email: string) => Promise<void>;
}

export function SignInModal({
  open,
  onClose,
  dismissable,
  reason,
  onSignIn,
}: SignInModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const copy = REASON_COPY[reason];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSignIn(email);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {dismissable && (
        <button
          type="button"
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
          aria-label="Close"
        />
      )}
      {!dismissable && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" aria-hidden />
      )}
      <div className="relative glass rounded-2xl p-6 w-full max-w-md border border-border shadow-xl">
        {dismissable && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center mb-4">
          <Mail className="w-5 h-5 text-accent" />
        </div>

        <h2 className="text-xl font-bold mb-2 pr-8">{copy.title}</h2>
        <p className="text-sm text-muted mb-6">{copy.description}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-3 py-2.5 outline-none focus:border-accent"
            />
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-dim text-background font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Signing in...
              </>
            ) : (
              "Continue free with email"
            )}
          </button>
        </form>

        <p className="text-xs text-muted mt-4 text-center">
          100% free. No password. Unsubscribe from deal emails anytime.
        </p>
      </div>
    </div>
  );
}
