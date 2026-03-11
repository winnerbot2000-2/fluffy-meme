"use client";

import type { Flashcard } from "@apmicro/shared-types";
import { RotateCw } from "lucide-react";
import { useState } from "react";

import { GlassPanel } from "./glass-panel";

export function FlashcardView({ flashcard }: { flashcard: Flashcard }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button suppressHydrationWarning type="button" onClick={() => setFlipped((value) => !value)} className="w-full text-left">
      <GlassPanel className="h-full min-h-64">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{flashcard.difficulty}</p>
          <RotateCw className="h-4 w-4 text-zinc-400" />
        </div>
        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{flipped ? "Back" : "Front"}</p>
          <p className="mt-3 text-lg leading-7 text-zinc-100">{flipped ? flashcard.back : flashcard.front}</p>
        </div>
      </GlassPanel>
    </button>
  );
}
