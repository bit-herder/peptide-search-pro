"use client";

import { useMemo, useState } from "react";

export function DosageCalc() {
  const [concentration, setConcentration] = useState("2.5");
  const [concentrationUnit, setConcentrationUnit] = useState<"mg_ml" | "mcg_ml">("mg_ml");
  const [desiredDose, setDesiredDose] = useState("250");
  const [doseUnit, setDoseUnit] = useState<"mcg" | "mg">("mcg");
  const [syringeUnits, setSyringeUnits] = useState("100");

  const result = useMemo(() => {
    const conc = parseFloat(concentration);
    const dose = parseFloat(desiredDose);
    const units = parseFloat(syringeUnits);
    if (!conc || !dose || !units) return null;

    const mgPerMl = concentrationUnit === "mg_ml" ? conc : conc / 1000;
    const doseMg = doseUnit === "mg" ? dose : dose / 1000;
    const mlNeeded = doseMg / mgPerMl;
    const syringeUnitsNeeded = (mlNeeded / (units / 100)) * units;

    return { mlNeeded, syringeUnitsNeeded, mcgDose: doseMg * 1000 };
  }, [concentration, concentrationUnit, desiredDose, doseUnit, syringeUnits]);

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium">Concentration</span>
          <div className="flex gap-2 mt-1">
            <input
              type="number"
              value={concentration}
              onChange={(e) => setConcentration(e.target.value)}
              className="flex-1 bg-surface-elevated border border-border rounded-lg px-3 py-2.5 outline-none focus:border-accent"
            />
            <select
              value={concentrationUnit}
              onChange={(e) => setConcentrationUnit(e.target.value as "mg_ml" | "mcg_ml")}
              className="bg-surface-elevated border border-border rounded-lg px-2 text-sm"
            >
              <option value="mg_ml">mg/mL</option>
              <option value="mcg_ml">mcg/mL</option>
            </select>
          </div>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Desired dose</span>
          <div className="flex gap-2 mt-1">
            <input
              type="number"
              value={desiredDose}
              onChange={(e) => setDesiredDose(e.target.value)}
              className="flex-1 bg-surface-elevated border border-border rounded-lg px-3 py-2.5 outline-none focus:border-accent"
            />
            <select
              value={doseUnit}
              onChange={(e) => setDoseUnit(e.target.value as "mcg" | "mg")}
              className="bg-surface-elevated border border-border rounded-lg px-2 text-sm"
            >
              <option value="mcg">mcg</option>
              <option value="mg">mg</option>
            </select>
          </div>
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-medium">Syringe units (U-100)</span>
        <input
          type="number"
          value={syringeUnits}
          onChange={(e) => setSyringeUnits(e.target.value)}
          className="mt-1 w-full bg-surface-elevated border border-border rounded-lg px-3 py-2.5 outline-none focus:border-accent"
        />
      </label>
      {result && (
        <div className="grid sm:grid-cols-3 gap-3 pt-4 border-t border-border">
          <div className="bg-surface-elevated rounded-lg p-3">
            <div className="text-xs text-muted">Volume to draw</div>
            <div className="font-mono font-semibold text-accent text-lg">
              {result.mlNeeded.toFixed(3)} mL
            </div>
          </div>
          <div className="bg-surface-elevated rounded-lg p-3">
            <div className="text-xs text-muted">Syringe units</div>
            <div className="font-mono font-semibold text-accent text-lg">
              {result.syringeUnitsNeeded.toFixed(1)} units
            </div>
          </div>
          <div className="bg-surface-elevated rounded-lg p-3">
            <div className="text-xs text-muted">Dose</div>
            <div className="font-mono font-semibold text-lg">
              {result.mcgDose.toFixed(0)} mcg
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
