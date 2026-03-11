"use client";

import * as Progress from "@radix-ui/react-progress";
import type { ProgressTracking } from "@apmicro/shared-types";

import { GlassPanel } from "./glass-panel";

export function ProgressWidget({ progress }: { progress: ProgressTracking }) {
  return (
    <GlassPanel className="h-full">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Progress</p>
          <h3 className="mt-2 text-lg font-medium text-white">Confidence {progress.confidence}%</h3>
        </div>
        <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
          {progress.streakDays} day streak
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
            <span>Mastery</span>
            <span>{progress.mastery}%</span>
          </div>
          <Progress.Root className="relative h-2 overflow-hidden rounded-full bg-white/8" value={progress.mastery}>
            <Progress.Indicator
              className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-300 transition-transform"
              style={{ transform: `translateX(-${100 - progress.mastery}%)` }}
            />
          </Progress.Root>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Weak areas</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {progress.weakSpots.map((spot) => (
              <span
                key={spot}
                className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-xs text-rose-100"
              >
                {spot}
              </span>
            ))}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
