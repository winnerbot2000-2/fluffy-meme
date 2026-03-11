"use client";

import { sources } from "@apmicro/content-core";
import { ComparePanel, GlassPanel, SourceBadge, TopBar } from "@apmicro/ui";
import { Bot, Camera, Rows3 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { graphModules } from "@/components/graphs/graph-module-registry";
import { useAppStore } from "@/lib/stores/app-store";

export function GraphLabPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const compareMode = useAppStore((state) => state.compareMode);
  const toggleCompareMode = useAppStore((state) => state.toggleCompareMode);

  const activeId = searchParams.get("module") ?? "supply-demand-equilibrium";
  const activeModule = useMemo(
    () => graphModules.find((module) => module.id === activeId) ?? graphModules[0],
    [activeId],
  );
  const ActiveComponent = activeModule.component;

  const comparisonTarget =
    activeModule.id === "tax-market"
      ? graphModules.find((module) => module.id === "subsidy-market")!
      : graphModules.find((module) => module.id === "tax-market")!;

  return (
    <div className="space-y-5">
      <TopBar
        title="Interactive Graph Lab"
        subtitle="The graph stage is the center of the platform: draggable curves, instant calculations, AP trap warnings, and visual math explanations."
        actions={
          <button
            suppressHydrationWarning
            type="button"
            onClick={toggleCompareMode}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-zinc-200"
          >
            <Rows3 className="h-4 w-4" />
            {compareMode ? "Exit compare" : "Compare mode"}
          </button>
        }
      />

      <GlassPanel className="space-y-3 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Graph modules</p>
            <p className="mt-1 text-sm text-zinc-300">Switch scenarios without pushing the graph below the fold.</p>
          </div>
          <div className="hidden rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-400 md:block">
            {graphModules.length} modules
          </div>
        </div>

        <div className="-mx-1 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-2 px-1">
            {graphModules.map((module, index) => {
              const active = module.id === activeModule.id;
              return (
                <button
                  suppressHydrationWarning
                  key={module.id}
                  type="button"
                  onClick={() => router.push(`/graph-lab?module=${module.id}`)}
                  className={`group min-w-[172px] rounded-[22px] border px-3.5 py-3 text-left transition ${
                    active
                      ? "border-cyan-300/30 bg-cyan-300/12 text-cyan-50 shadow-[0_12px_36px_-24px_rgba(34,211,238,0.65)]"
                      : "border-white/10 bg-white/5 text-zinc-200 hover:border-white/20 hover:bg-white/[0.075]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium ${
                        active ? "bg-cyan-200/20 text-cyan-50" : "bg-white/8 text-zinc-400"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <p className="text-sm font-medium leading-5">{module.title}</p>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-zinc-400 transition group-hover:text-zinc-300">
                    {module.summary}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/80">Active graph</p>
            <p className="mt-1 text-sm font-medium text-white">{activeModule.title}</p>
            <p className="mt-1 text-xs leading-5 text-zinc-400">{activeModule.summary}</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-cyan-300" />
            Click a module to swap the live graph
          </div>
        </div>
      </GlassPanel>

      {compareMode ? (
        <ComparePanel
          leftTitle={activeModule.title}
          rightTitle={comparisonTarget.title}
          insight={
            activeModule.id === "ppc"
              ? "PPC graphs are about tradeoffs across goods; tax graphs are about wedges inside a single market. Keep those stories separate on AP FRQs."
              : "Taxes reduce quantity below the efficient point, while subsidies increase quantity beyond it. The wedge is the same shape, but the policy direction flips the story."
          }
        />
      ) : null}

      <ActiveComponent />

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <GlassPanel className="h-full">
          <div className="flex items-center gap-2 text-zinc-400">
            <Camera className="h-4 w-4" />
            <p className="text-xs uppercase tracking-[0.22em]">Graph screenshot analyzer</p>
          </div>
          <h3 className="mt-3 text-lg font-medium text-white">Rebuild a screenshot as an interactive graph</h3>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            Architecture hook is ready for graph-type inference, axis detection, likely equilibrium detection, and interactive reconstruction.
          </p>
          <div className="mt-4 rounded-3xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
            Planned API endpoint: <span className="font-mono text-cyan-100">POST /api/graph-analyzer/reconstruct</span>
          </div>
        </GlassPanel>

        <GlassPanel className="h-full">
          <div className="flex items-center gap-2 text-zinc-400">
            <Bot className="h-4 w-4" />
            <p className="text-xs uppercase tracking-[0.22em]">Tutor hooks</p>
          </div>
          <h3 className="mt-3 text-lg font-medium text-white">Ask for hints, exam wording, or simpler intuition</h3>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            The shell is ready to send graph state, selected point, selected area, and current mode into a tutor session.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">hint-first</span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">harder explanation</span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">graph help</span>
          </div>
        </GlassPanel>

        <GlassPanel className="h-full">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Source-aware starting library</p>
          <h3 className="mt-3 text-lg font-medium text-white">Seeded from your PDFs</h3>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            The content system starts with the three AP Micro PDFs you added and preserves source metadata for future merged-topic retrieval.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {sources.map((source) => (
              <SourceBadge key={source.id} source={source} />
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
