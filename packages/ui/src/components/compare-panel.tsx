import { ArrowLeftRight } from "lucide-react";

import { GlassPanel } from "./glass-panel";

export function ComparePanel({
  leftTitle,
  rightTitle,
  insight,
}: {
  leftTitle: string;
  rightTitle: string;
  insight: string;
}) {
  return (
    <GlassPanel className="h-full">
      <div className="flex items-center gap-2 text-zinc-400">
        <ArrowLeftRight className="h-4 w-4" />
        <p className="text-xs uppercase tracking-[0.22em]">Compare Mode</p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Module A</p>
          <p className="mt-2 text-sm text-zinc-100">{leftTitle}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Module B</p>
          <p className="mt-2 text-sm text-zinc-100">{rightTitle}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-zinc-300">{insight}</p>
    </GlassPanel>
  );
}
