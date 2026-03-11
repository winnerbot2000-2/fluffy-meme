"use client";

import { Bell, Command, LayoutPanelTop, MoonStar } from "lucide-react";
import type { ReactNode } from "react";

import { GlassPanel } from "./glass-panel";

export function TopBar({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <GlassPanel className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between" glow>
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.24em] text-zinc-400">
          <LayoutPanelTop className="h-3.5 w-3.5" />
          Premium Study Platform
        </div>
        <h2 className="mt-4 font-display text-3xl text-zinc-50 lg:text-5xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {actions}
        <button
          suppressHydrationWarning
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-zinc-200"
        >
          <Command className="h-4 w-4" />
          Search
        </button>
        <button suppressHydrationWarning type="button" className="rounded-full border border-white/10 bg-white/6 p-3 text-zinc-300">
          <Bell className="h-4 w-4" />
        </button>
        <button suppressHydrationWarning type="button" className="rounded-full border border-white/10 bg-white/6 p-3 text-zinc-300">
          <MoonStar className="h-4 w-4" />
        </button>
      </div>
    </GlassPanel>
  );
}
