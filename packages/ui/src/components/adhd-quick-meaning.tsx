import { GlassPanel } from "./glass-panel";

export function ADHDQuickMeaning({
  meaning,
  trap,
}: {
  meaning: string;
  trap: string;
}) {
  return (
    <GlassPanel className="border-cyan-300/15 bg-cyan-300/5">
      <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/70">ADHD mode</p>
      <h3 className="mt-2 text-lg font-medium text-white">10-second version</h3>
      <p className="mt-3 text-sm leading-6 text-zinc-100">{meaning}</p>
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">AP trap</p>
        <p className="mt-2 text-sm leading-6 text-rose-100">{trap}</p>
      </div>
    </GlassPanel>
  );
}
