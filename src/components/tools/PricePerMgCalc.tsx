"use client";

import { useMemo, useState } from "react";
import { formatPricePerMg } from "@/lib/utils";

export function PricePerMgCalc() {
  const [price, setPrice] = useState("49.99");
  const [vialMg, setVialMg] = useState("5");

  const result = useMemo(() => {
    const p = parseFloat(price);
    const mg = parseFloat(vialMg);
    if (!p || !mg) return null;
    const perMg = p / mg;
    const perMcg = perMg / 1000;
    return { perMg, perMcg, vialsFor1g: 1000 / mg };
  }, [price, vialMg]);

  return (
    <div className="space-y-5">
      <label className="block">
        <span className="text-sm font-medium">Total price (USD)</span>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-3 py-2.5 outline-none focus:border-accent"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Peptide amount in vial (mg)</span>
        <input
          type="number"
          value={vialMg}
          onChange={(e) => setVialMg(e.target.value)}
          className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-3 py-2.5 outline-none focus:border-accent"
        />
      </label>
      {result && (
        <div className="grid sm:grid-cols-3 gap-3 pt-4 border-t border-border">
          <div className="bg-surface-elevated rounded-lg p-3">
            <div className="text-xs text-muted">Price per mg</div>
            <div className="font-mono font-semibold text-accent text-lg">
              {formatPricePerMg(result.perMg)}
            </div>
          </div>
          <div className="bg-surface-elevated rounded-lg p-3">
            <div className="text-xs text-muted">Price per mcg</div>
            <div className="font-mono font-semibold text-lg">
              ${result.perMcg.toFixed(4)}
            </div>
          </div>
          <div className="bg-surface-elevated rounded-lg p-3">
            <div className="text-xs text-muted">Vials per 1g peptide</div>
            <div className="font-mono font-semibold text-lg">
              {result.vialsFor1g.toFixed(1)}
            </div>
          </div>
        </div>
      )}
      <p className="text-xs text-muted">
        Tip: Use our{" "}
        <a href="/search" className="text-accent hover:underline">
          price search
        </a>{" "}
        to compare live $/mg across suppliers automatically.
      </p>
    </div>
  );
}
