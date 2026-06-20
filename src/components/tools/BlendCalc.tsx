"use client";

import { useMemo, useState } from "react";

export function BlendCalc() {
  const [peptide1Mg, setPeptide1Mg] = useState("5");
  const [peptide2Mg, setPeptide2Mg] = useState("5");
  const [bacMl, setBacMl] = useState("2");
  const [name1, setName1] = useState("Peptide A");
  const [name2, setName2] = useState("Peptide B");

  const result = useMemo(() => {
    const p1 = parseFloat(peptide1Mg);
    const p2 = parseFloat(peptide2Mg);
    const ml = parseFloat(bacMl);
    if (!p1 || !p2 || !ml) return null;
    return {
      totalMg: p1 + p2,
      p1MgMl: p1 / ml,
      p2MgMl: p2 / ml,
      p1McgPer10u: ((p1 / ml) * 1000 * 10) / 100,
      p2McgPer10u: ((p2 / ml) * 1000 * 10) / 100,
    };
  }, [peptide1Mg, peptide2Mg, bacMl]);

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        Calculate individual concentrations when reconstituting two peptides in the same vial
        (research protocols only).
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium">Peptide 1 name</span>
          <input
            value={name1}
            onChange={(e) => setName1(e.target.value)}
            className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-3 py-2.5 outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Peptide 1 amount (mg)</span>
          <input
            type="number"
            value={peptide1Mg}
            onChange={(e) => setPeptide1Mg(e.target.value)}
            className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-3 py-2.5 outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Peptide 2 name</span>
          <input
            value={name2}
            onChange={(e) => setName2(e.target.value)}
            className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-3 py-2.5 outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Peptide 2 amount (mg)</span>
          <input
            type="number"
            value={peptide2Mg}
            onChange={(e) => setPeptide2Mg(e.target.value)}
            className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-3 py-2.5 outline-none focus:border-accent"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-medium">Bac water (mL)</span>
        <input
          type="number"
          value={bacMl}
          onChange={(e) => setBacMl(e.target.value)}
          className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-3 py-2.5 outline-none focus:border-accent"
        />
      </label>
      {result && (
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="text-sm text-muted">
            Total peptide: <span className="font-mono text-foreground">{result.totalMg} mg</span> in{" "}
            {bacMl} mL
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-surface-elevated rounded-lg p-3">
              <div className="font-medium text-sm mb-1">{name1}</div>
              <div className="font-mono text-accent">{result.p1MgMl.toFixed(3)} mg/mL</div>
              <div className="text-xs text-muted mt-1">
                {result.p1McgPer10u.toFixed(1)} mcg per 10 units
              </div>
            </div>
            <div className="bg-surface-elevated rounded-lg p-3">
              <div className="font-medium text-sm mb-1">{name2}</div>
              <div className="font-mono text-accent">{result.p2MgMl.toFixed(3)} mg/mL</div>
              <div className="text-xs text-muted mt-1">
                {result.p2McgPer10u.toFixed(1)} mcg per 10 units
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
