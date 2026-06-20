"use client";

import { useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { PEPTIDE_CATALOG } from "@/lib/peptides";

export function PriceAlertForm() {
  const { user, isAuthenticated, loading: authLoading, openSignIn } = useAuth();
  const [peptideKey, setPeptideKey] = useState("bpc-157");
  const [alertType, setAlertType] = useState<"price_per_mg" | "price">("price_per_mg");
  const [target, setTarget] = useState("5");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  if (authLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="text-center py-6">
        <p className="text-muted mb-4">
          Use our search and calculators free — sign in only when you want to save price alerts.
        </p>
        <button
          type="button"
          onClick={() => openSignIn("alerts")}
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dim text-background font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          <LogIn className="w-4 h-4" />
          Sign in to create alerts
        </button>
        <p className="text-xs text-muted mt-4">Email only — no password required.</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          peptide_key: peptideKey,
          alert_type: alertType,
          target_value: parseFloat(target),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted">
        Alerts for <span className="text-foreground">{user.email}</span>
      </p>
      <label className="block">
        <span className="text-sm font-medium">Peptide</span>
        <select
          value={peptideKey}
          onChange={(e) => setPeptideKey(e.target.value)}
          className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-3 py-2.5 outline-none focus:border-accent"
        >
          {Object.entries(PEPTIDE_CATALOG).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
      </label>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium">Alert when below</span>
          <select
            value={alertType}
            onChange={(e) => setAlertType(e.target.value as "price_per_mg" | "price")}
            className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-3 py-2.5"
          >
            <option value="price_per_mg">$/mg</option>
            <option value="price">Total price ($)</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Target value</span>
          <input
            type="number"
            step="any"
            required
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-3 py-2.5 outline-none focus:border-accent"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-accent hover:bg-accent-dim text-background font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
      >
        {status === "loading" ? "Saving..." : "Create price alert"}
      </button>
      {status === "ok" && (
        <p className="text-sm text-success text-center">
          Alert saved. We&apos;ll notify you when prices drop below your target.
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-danger text-center">Something went wrong. Try again.</p>
      )}
    </form>
  );
}
