import type { Topic } from "@apmicro/shared-types";

import { GlassPanel } from "./glass-panel";

export function TopicHeroCard({
  topic,
  unitLabel,
}: {
  topic: Topic;
  unitLabel: string;
}) {
  return (
    <GlassPanel className="relative overflow-hidden p-6 lg:p-8" glow>
      <div className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.22em] text-zinc-400">
        {unitLabel}
      </div>
      <h1 className="mt-4 font-display text-4xl text-zinc-50 lg:text-6xl">{topic.title}</h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300">{topic.shortDescription}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">10-second meaning</p>
          <p className="mt-3 text-sm leading-6 text-zinc-100">{topic.tenSecondMeaning}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Why this matters</p>
          <p className="mt-3 text-sm leading-6 text-zinc-100">{topic.whyItMatters}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">AP trap</p>
          <p className="mt-3 text-sm leading-6 text-rose-100">{topic.apTrap}</p>
        </div>
      </div>
    </GlassPanel>
  );
}
