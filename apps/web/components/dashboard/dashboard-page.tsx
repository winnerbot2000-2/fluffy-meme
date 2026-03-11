"use client";

import { seededProgress, sources, topics, units } from "@apmicro/content-core";
import {
  FocusCard,
  GlassPanel,
  ModeSwitcher,
  ProgressWidget,
  SourceBadge,
  TopBar,
} from "@apmicro/ui";
import { ArrowRight, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { fetchDashboardOverview } from "@/lib/api";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { useAppStore } from "@/lib/stores/app-store";

export function DashboardPage() {
  const studyMode = useAppStore((state) => state.studyMode);
  const setStudyMode = useAppStore((state) => state.setStudyMode);
  const todaysFocusTopicId = useAppStore((state) => state.todaysFocusTopicId);
  const testSelectionsCount = useAppStore((state) => state.testSelections.length);
  const studySelectionsCount = useAppStore((state) => state.studySelections.length);
  const testTopicCount = useAppStore((state) => state.testTopicSlugs.length);
  const dashboard = useApiResource({
    loader: () => fetchDashboardOverview(todaysFocusTopicId),
    initialValue: {
      focusTopicId: todaysFocusTopicId,
      recommendedNextTopicId: topics[1]?.id,
      sources,
      progress: seededProgress,
      dueReviews: [],
      weakTopicIds: seededProgress.map((item) => item.topicId),
    },
    deps: [todaysFocusTopicId],
  });

  const todaysFocus = useMemo(
    () => topics.find((topic) => topic.id === (dashboard.data.focusTopicId ?? todaysFocusTopicId)) ?? topics[0],
    [dashboard.data.focusTopicId, todaysFocusTopicId],
  );
  const nextTopic =
    topics.find((topic) => topic.id === dashboard.data.recommendedNextTopicId) ??
    topics.find((topic) => topic.id !== todaysFocus.id) ??
    topics[1];

  return (
    <div className="space-y-6">
      <TopBar
        title="AP Microeconomics Study OS"
        subtitle="A graph-first workspace for AP Micro prep with mode-aware study flows, source-aware topic intelligence, and a premium dark interface."
      />

      <GlassPanel className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Global mode switcher</p>
          <h3 className="mt-2 text-xl font-medium text-white">Study mode changes the whole workspace</h3>
        </div>
        <ModeSwitcher activeMode={studyMode} onChange={setStudyMode} />
      </GlassPanel>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr_1fr]">
        <GlassPanel className="h-full" glow>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-cyan-100">
            <Target className="h-3.5 w-3.5" />
            Today&apos;s Focus
          </div>
          <h3 className="mt-4 font-display text-3xl text-zinc-50">{todaysFocus.title}</h3>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-300">{todaysFocus.shortDescription}</p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">10-second meaning</p>
              <p className="mt-2 text-sm text-zinc-100">{todaysFocus.tenSecondMeaning}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Why this matters</p>
              <p className="mt-2 text-sm text-zinc-100">{todaysFocus.whyItMatters}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">AP trap</p>
              <p className="mt-2 text-sm text-rose-100">{todaysFocus.apTrap}</p>
            </div>
          </div>
          <Link
            href={`/topic/${todaysFocus.slug}`}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-zinc-100"
          >
            Open topic
            <ArrowRight className="h-4 w-4" />
          </Link>
        </GlassPanel>

        <FocusCard title="Recommended Next Step" caption="Momentum">
          Move from {todaysFocus.title} into <strong>{nextTopic.title}</strong>. It builds directly on the graph logic you just practiced.
        </FocusCard>

        <FocusCard title="Graph Lab Shortcut" caption="High-leverage move">
          Start with the tax and subsidy modules back to back. Compare mode makes the wedge story stick much faster than reading a static page.
        </FocusCard>
      </div>

      <GlassPanel className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Test prep builder</p>
          <h3 className="mt-2 text-2xl text-white">Turn highlighted topics into a custom study guide</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            You currently have {testSelectionsCount} test-marked highlight{testSelectionsCount === 1 ? "" : "s"}, {testTopicCount} selected topic{testTopicCount === 1 ? "" : "s"}, and {studySelectionsCount} saved study highlight{studySelectionsCount === 1 ? "" : "s"}.
          </p>
        </div>
        <Link
          href="/test-prep"
          className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-50"
        >
          Open test prep
          <ArrowRight className="h-4 w-4" />
        </Link>
      </GlassPanel>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {seededProgress.map((progress) => (
          <ProgressWidget key={progress.id} progress={progress} />
        ))}
        <GlassPanel className="h-full">
          <div className="flex items-center gap-2 text-zinc-400">
            <Sparkles className="h-4 w-4" />
            <p className="text-xs uppercase tracking-[0.22em]">Source-aware library</p>
          </div>
          <h3 className="mt-3 text-lg font-medium text-white">Seeded from your PDFs</h3>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            The platform is already seeded with the Kacapyr packet, Krugman AP textbook, and the College Board course guide.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {dashboard.data.sources.map((source) => (
              <SourceBadge key={source.id} source={source} />
            ))}
          </div>
        </GlassPanel>
        <GlassPanel className="h-full">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Coverage map</p>
          <div className="mt-4 space-y-3">
            {units.map((unit) => (
              <div key={unit.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-zinc-100">
                    Unit {unit.number}: {unit.title}
                  </p>
                  <span className="text-xs text-zinc-500">{unit.examWeight}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-zinc-400">{unit.description}</p>
              </div>
            ))}
          </div>
        </GlassPanel>
        <GlassPanel className="h-full">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Due review queue</p>
          <div className="mt-4 space-y-3">
            {dashboard.data.dueReviews.length > 0 ? (
              dashboard.data.dueReviews.map((item) => {
                const label = topics.find((topic) => topic.id === item.topicId)?.title ?? item.topicId;
                return (
                  <div key={item.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-zinc-100">{label}</p>
                      <span className="text-xs text-zinc-500">P{item.priority}</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-zinc-400">{item.reason}</p>
                  </div>
                );
              })
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
                {dashboard.loading ? "Refreshing review queue..." : "No due items right now."}
              </div>
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
