"use client";

import { useMemo, useState } from "react";

export function ReconstitutionCalc() {
  const [peptideMg, setPeptideMg] = useState("5");
  const [bacMl, setBacMl] = useState("2");
  const [syringeUnits, setSyringeUnits] = useState("100");

  const result = useMemo(() => {
    const mg = parseFloat(peptideMg);
    const ml = parseFloat(bacMl);
    const units = parseFloat(syringeUnits);
    if (!mg || !ml || !units) return null;
    const mgPerMl = mg / ml;
    const mcgPerMl = mgPerMl * 1000;
    const mlPer10Units = (10 / units) * ml;
    const mcgPer10Units = mgPerMl * mlPer10Units * 1000;
    return { mgPerMl, mcgPerMl, mcgPer10Units, mlPer10Units };
  }, [peptideMg, bacMl, syringeUnits]);

  return (
    <div className="space-y-5">
      <Field label="Peptide in vial (mg)" value={peptideMg} onChange={setPeptideMg} />
      <Field label="Bacteriostatic water added (mL)" value={bacMl} onChange={setBacMl} />
      <Field
        label="Insulin syringe capacity (units)"
        value={syringeUnits}
        onChange={setSyringeUnits}
        hint="U-100 syringe = 100 units = 1 mL"
      />
      {result && (
        <div className="grid sm:grid-cols-2 gap-3 pt-4 border-t border-border">
          <Result label="Concentration" value={`${result.mgPerMl.toFixed(3)} mg/mL`} />
          <Result label="Concentration" value={`${result.mcgPerMl.toFixed(0)} mcg/mL`} />
          <Result label="Per 10 units drawn" value={`${result.mcgPer10Units.toFixed(1)} mcg`} />
          <Result label="Volume per 10 units" value={`${result.mlPer10Units.toFixed(3)} mL`} />
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="block text-xs text-muted mb-1">{hint}</span>}
      <input
        type="number"
        min="0"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-3 py-2.5 outline-none focus:border-accent"
      />
    </label>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-elevated rounded-lg p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="font-mono font-semibold text-accent text-lg">{value}</div>
    </div>
  );
}
