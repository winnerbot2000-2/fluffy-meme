"use client";

import type { StudyMode } from "@apmicro/shared-types";

import { studyModeDescriptions, studyModeLabels } from "../lib/modes";
import { cn } from "../lib/cn";

export function ModeSwitcher({
  activeMode,
  onChange,
}: {
  activeMode: StudyMode;
  onChange: (mode: StudyMode) => void;
}) {
  return (
    <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
      {Object.entries(studyModeLabels).map(([mode, label]) => {
        const isActive = activeMode === mode;
        return (
          <button
            suppressHydrationWarning
            key={mode}
            type="button"
            onClick={() => onChange(mode as StudyMode)}
            className={cn(
              "group rounded-3xl border px-4 py-3 text-left transition",
              isActive
                ? "border-cyan-300/40 bg-cyan-300/12 shadow-[0_0_60px_-30px_rgba(34,211,238,0.8)]"
                : "border-white/10 bg-white/5 hover:bg-white/8",
            )}
          >
            <p className={cn("text-sm font-medium", isActive ? "text-cyan-50" : "text-zinc-100")}>{label}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{studyModeDescriptions[mode as StudyMode]}</p>
          </button>
        );
      })}
    </div>
  );
}
