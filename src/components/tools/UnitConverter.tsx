"use client";

import { useMemo, useState } from "react";

type Unit = "mg" | "mcg" | "g";

export function UnitConverter() {
  const [value, setValue] = useState("5");
  const [from, setFrom] = useState<Unit>("mg");

  const converted = useMemo(() => {
    const v = parseFloat(value);
    if (isNaN(v)) return null;
    const toMg = from === "mg" ? v : from === "mcg" ? v / 1000 : v * 1000;
    return {
      mg: toMg,
      mcg: toMg * 1000,
      g: toMg / 1000,
    };
  }, [value, from]);

  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 bg-surface-elevated border border-border rounded-lg px-3 py-2.5 outline-none focus:border-accent"
        />
        <select
          value={from}
          onChange={(e) => setFrom(e.target.value as Unit)}
          className="bg-surface-elevated border border-border rounded-lg px-3"
        >
          <option value="mg">mg</option>
          <option value="mcg">mcg (µg)</option>
          <option value="g">g</option>
        </select>
      </div>
      {converted && (
        <div className="grid sm:grid-cols-3 gap-3 pt-4 border-t border-border">
          {(["mg", "mcg", "g"] as Unit[]).map((u) => (
            <div key={u} className="bg-surface-elevated rounded-lg p-3">
              <div className="text-xs text-muted uppercase">{u}</div>
              <div className="font-mono font-semibold text-lg">
                {u === "mcg"
                  ? converted.mcg.toFixed(0)
                  : converted[u].toFixed(u === "g" ? 6 : 4)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
