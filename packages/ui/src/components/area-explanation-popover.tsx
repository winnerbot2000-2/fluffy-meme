import type { ShadedArea } from "@apmicro/shared-types";

import { GlassPanel } from "./glass-panel";

export function AreaExplanationPopover({ area }: { area: ShadedArea | null }) {
  if (!area) {
    return (
      <GlassPanel className="h-full">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Area explainer</p>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Click a shaded region to break down what the area means and how the graph translates into a calculation.
        </p>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="h-full">
      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Area explainer</p>
      <h4 className="mt-2 text-lg font-medium text-white">{area.label}</h4>
      <p className="mt-4 text-sm leading-6 text-zinc-300">{area.description}</p>
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Show me the math</p>
        <p className="mt-2 font-mono text-sm text-cyan-100">{area.math}</p>
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Show me the intuition</p>
        <p className="mt-2 text-sm leading-6 text-zinc-200">{area.intuition}</p>
      </div>
    </GlassPanel>
  );
}
