"use client";

import { BookOpen, BrainCircuit, Compass, FolderUp, LayoutGrid, Search, Sparkles } from "lucide-react";
import Link from "next/link";

import { cn } from "../lib/cn";
import { GlassPanel } from "./glass-panel";

export type SidebarItem = {
  href: string;
  label: string;
  description: string;
};

const icons = [LayoutGrid, Sparkles, BookOpen, BrainCircuit, FolderUp, Search];

export function AppSidebar({
  items,
  activeHref,
}: {
  items: SidebarItem[];
  activeHref: string;
}) {
  return (
    <GlassPanel className="sticky top-6 flex h-[calc(100vh-3rem)] flex-col gap-6 p-4" glow>
      <div className="flex items-center gap-3 px-2 pt-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
          <Compass className="h-5 w-5 text-cyan-200" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Study OS</p>
          <h1 className="font-display text-xl text-zinc-50">Micro Atlas</h1>
        </div>
      </div>

      <nav className="space-y-2">
        {items.map((item, index) => {
          const Icon = icons[index % icons.length];
          const active = activeHref === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group block rounded-3xl px-3 py-3 transition",
                active ? "bg-white/12" : "hover:bg-white/8",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 rounded-2xl border p-2",
                    active
                      ? "border-cyan-300/30 bg-cyan-300/12 text-cyan-100"
                      : "border-white/10 bg-white/6 text-zinc-400 group-hover:text-zinc-100",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className={cn("text-sm font-medium", active ? "text-white" : "text-zinc-200")}>{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">{item.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-3xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Focus</p>
        <h2 className="mt-2 text-sm font-medium text-white">Graph-first study sessions</h2>
        <p className="mt-2 text-xs leading-5 text-zinc-400">
          Jump between modules, lock into ADHD mode, and keep the graph visible while reading.
        </p>
      </div>
    </GlassPanel>
  );
}
