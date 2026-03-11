"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { GlassPanel } from "@apmicro/ui";

export type FocusIdea = {
  title: string;
  body: string;
  tag: string;
};

export function ADHDFocusDeck({ ideas }: { ideas: FocusIdea[] }) {
  const [index, setIndex] = useState(0);
  const current = ideas[index];

  return (
    <GlassPanel className="h-full border-cyan-300/15 bg-cyan-300/5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/70">Focus deck</p>
          <h3 className="mt-2 text-lg font-medium text-white">{current.title}</h3>
        </div>
        <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
          {index + 1} / {ideas.length}
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{current.tag}</p>
        <p className="mt-3 text-sm leading-6 text-zinc-100">{current.body}</p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          suppressHydrationWarning
          type="button"
          onClick={() => setIndex((value) => (value - 1 + ideas.length) % ideas.length)}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-zinc-200"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous idea
        </button>
        <button
          suppressHydrationWarning
          type="button"
          onClick={() => setIndex((value) => (value + 1) % ideas.length)}
          className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-50"
        >
          Next idea
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </GlassPanel>
  );
}
