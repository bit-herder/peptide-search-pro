import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { PriceAlertForm } from "@/components/PriceAlertForm";

export const metadata: Metadata = {
  title: "Price Alerts | PeptideSearch Pro",
  description:
    "Get notified when peptide prices drop below your target. Set alerts for $/mg or total price on any tracked peptide.",
};

export default function AlertsPage() {
  return (
    <>
      <Header />
      <main className="max-w-md mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Price Alerts</h1>
        <p className="text-muted mb-8">
          Search and use calculators without an account. When you&apos;re ready to save alerts,
          sign in free with your email — no password needed.
        </p>
        <div className="glass rounded-2xl p-6">
          <PriceAlertForm />
        </div>
        <p className="text-xs text-muted mt-6 text-center">
          Email notifications are processed after each scrape cycle. No spam — one alert per
          peptide target.
        </p>
      </main>
    </>
  );
}
