import type { Formula } from "@apmicro/shared-types";

import { GlassPanel } from "./glass-panel";

export function FormulaCard({ formula }: { formula: Formula }) {
  return (
    <GlassPanel className="h-full">
      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Formula</p>
      <h3 className="mt-2 text-lg font-medium text-white">{formula.label}</h3>
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-sm text-cyan-100">
        {formula.expression}
      </div>
      <p className="mt-4 text-sm leading-6 text-zinc-300">{formula.description}</p>
      <p className="mt-4 text-xs leading-5 text-amber-200">AP tip: {formula.apTip}</p>
    </GlassPanel>
  );
}
