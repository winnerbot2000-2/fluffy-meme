import { AlertTriangle } from "lucide-react";

import { GlassPanel } from "./glass-panel";

export function APTrapCard({ trap }: { trap: string }) {
  return (
    <GlassPanel className="border-rose-400/15 bg-rose-500/5">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 p-2 text-rose-100">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-rose-200/70">AP Trap</p>
          <p className="mt-2 text-sm leading-6 text-rose-50">{trap}</p>
        </div>
      </div>
    </GlassPanel>
  );
}
