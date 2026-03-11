import type { GraphPoint } from "@apmicro/shared-types";

import { GlassPanel } from "./glass-panel";

export function PointExplanationPopover({ point }: { point: GraphPoint | null }) {
  if (!point) {
    return (
      <GlassPanel className="h-full">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Point explainer</p>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Click a highlighted point on the graph to see what it is, how it is calculated, and what changes it.
        </p>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="h-full">
      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Point explainer</p>
      <h4 className="mt-2 text-lg font-medium text-white">{point.label}</h4>
      <p className="mt-4 text-sm leading-6 text-zinc-300">{point.description}</p>
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Show me the math</p>
        <p className="mt-2 font-mono text-sm text-cyan-100">{point.math}</p>
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Show me the intuition</p>
        <p className="mt-2 text-sm leading-6 text-zinc-200">{point.intuition}</p>
      </div>
    </GlassPanel>
  );
}
