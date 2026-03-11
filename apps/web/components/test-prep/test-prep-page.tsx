"use client";

import { formulas, topics as seededTopics, units } from "@apmicro/content-core";
import { GlassPanel, TopBar } from "@apmicro/ui";
import { CalendarClock, CheckCircle2, ClipboardList, FileText, Sparkles, Target } from "lucide-react";
import { useMemo, useState } from "react";

import { graphIdToModuleId, graphModuleMap } from "@/components/graphs/graph-module-registry";
import { fetchTopicBundles, type ApiTopicBundle } from "@/lib/api";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { useAppStore } from "@/lib/stores/app-store";

type GuideTopic = {
  slug: string;
  title: string;
  unitLabel: string;
  tenSecondMeaning: string;
  whyItMatters: string;
  apTrap: string;
  graphLabels: string[];
  formulaLabels: string[];
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function buildGuideTopics(bundles: ApiTopicBundle[]): GuideTopic[] {
  const seededMap = new Map(
    seededTopics.map((topic) => [
      topic.slug,
      {
        slug: topic.slug,
        title: topic.title,
        unitLabel: units.find((unit) => unit.id === topic.unitId)?.title ?? topic.unitId,
        tenSecondMeaning: topic.tenSecondMeaning,
        whyItMatters: topic.whyItMatters,
        apTrap: topic.apTrap,
        graphLabels: topic.graphIds
          .map((graphId) => graphIdToModuleId[graphId])
          .map((moduleId) => (moduleId ? graphModuleMap[moduleId]?.title : undefined))
          .filter(Boolean) as string[],
        formulaLabels: topic.formulaIds.map((id) => formulas.find((formula) => formula.id === id)?.label).filter(Boolean) as string[],
      },
    ]),
  );

  for (const bundle of bundles) {
    if (seededMap.has(bundle.topicSlug)) {
      continue;
    }

    seededMap.set(bundle.topicSlug, {
      slug: bundle.topicSlug,
      title: bundle.title,
      unitLabel: units.find((unit) => unit.id === bundle.unitId)?.title ?? bundle.unitId ?? "AP Micro topic",
      tenSecondMeaning: bundle.summary,
      whyItMatters: bundle.explanationVariants[0] ?? "This topic is worth reviewing because it appears in your source-aware topic map.",
      apTrap: bundle.explanationVariants[1] ?? "Check the graph labels, what shifts, and what the AP prompt is actually asking you to calculate.",
      graphLabels: bundle.graphMentions
        .map((mention) => {
          if (mention === "tax-wedge") {
            return graphModuleMap["tax-market"]?.title;
          }
          if (mention === "supply-demand") {
            return graphModuleMap["supply-demand-equilibrium"]?.title;
          }
          const mapped = mention.replace("cost-curves", "monopoly");
          const moduleId = graphIdToModuleId[mapped];
          return moduleId ? graphModuleMap[moduleId]?.title : mention;
        })
        .filter(Boolean) as string[],
      formulaLabels: bundle.formulaMentions.map((mention) => mention.replace(/-/g, " ")),
    });
  }

  return Array.from(seededMap.values());
}

export function TestPrepPage() {
  const testPrepTitle = useAppStore((state) => state.testPrepTitle);
  const setTestPrepTitle = useAppStore((state) => state.setTestPrepTitle);
  const testPrepDate = useAppStore((state) => state.testPrepDate);
  const setTestPrepDate = useAppStore((state) => state.setTestPrepDate);
  const testTopicSlugs = useAppStore((state) => state.testTopicSlugs);
  const setTestTopicSlugs = useAppStore((state) => state.setTestTopicSlugs);
  const toggleTestTopicSlug = useAppStore((state) => state.toggleTestTopicSlug);
  const testSelections = useAppStore((state) => state.testSelections);
  const removeTestSelection = useAppStore((state) => state.removeTestSelection);
  const clearTestSelections = useAppStore((state) => state.clearTestSelections);
  const studySelections = useAppStore((state) => state.studySelections);
  const removeStudySelection = useAppStore((state) => state.removeStudySelection);

  const topicState = useApiResource({
    loader: fetchTopicBundles,
    initialValue: [],
  });
  const [pasteBuffer, setPasteBuffer] = useState("");

  const allGuideTopics = useMemo(() => buildGuideTopics(topicState.data), [topicState.data]);
  const selectedGuideTopics = useMemo(
    () => allGuideTopics.filter((topic) => testTopicSlugs.includes(topic.slug)),
    [allGuideTopics, testTopicSlugs],
  );

  const matchedPasteTopics = useMemo(() => {
    const tokens = pasteBuffer
      .split(/\n|,/)
      .map((item) => normalize(item))
      .filter(Boolean);

    if (!tokens.length) {
      return [];
    }

    return allGuideTopics.filter((topic) => {
      const haystack = [topic.slug, topic.title, topic.unitLabel].map(normalize).join(" ");
      return tokens.some((token) => haystack.includes(token) || token.includes(normalize(topic.title)));
    });
  }, [allGuideTopics, pasteBuffer]);

  const groupedSelections = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const selection of testSelections) {
      const key = selection.topicSlug ?? "general";
      const current = groups.get(key) ?? [];
      current.push(selection.text);
      groups.set(key, current);
    }
    return Array.from(groups.entries());
  }, [testSelections]);

  function applyPastedTopics() {
    setTestTopicSlugs(matchedPasteTopics.map((topic) => topic.slug));
  }

  return (
    <div className="space-y-6">
      <TopBar
        title="Test Prep Builder"
        subtitle="Add the topics on your next test, pull in highlighted lines you marked as test-relevant, and generate a custom AP Micro study guide."
      />

      <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-4">
          <GlassPanel className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-400">
              <CalendarClock className="h-4 w-4" />
              <p className="text-xs uppercase tracking-[0.22em]">Test details</p>
            </div>
            <label className="block">
              <p className="mb-2 text-xs uppercase tracking-[0.22em] text-zinc-500">Title</p>
              <input
                suppressHydrationWarning
                value={testPrepTitle}
                onChange={(event) => setTestPrepTitle(event.target.value)}
                className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 outline-none"
                placeholder="Unit 2 and Unit 4 test"
              />
            </label>
            <label className="block">
              <p className="mb-2 text-xs uppercase tracking-[0.22em] text-zinc-500">Test date</p>
              <input
                suppressHydrationWarning
                type="date"
                value={testPrepDate}
                onChange={(event) => setTestPrepDate(event.target.value)}
                className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 outline-none"
              />
            </label>
          </GlassPanel>

          <GlassPanel className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-400">
              <ClipboardList className="h-4 w-4" />
              <p className="text-xs uppercase tracking-[0.22em]">Topics on the test</p>
            </div>
            <label className="block">
              <p className="mb-2 text-xs uppercase tracking-[0.22em] text-zinc-500">Paste topic list</p>
              <textarea
                suppressHydrationWarning
                value={pasteBuffer}
                onChange={(event) => setPasteBuffer(event.target.value)}
                rows={5}
                className="w-full rounded-[28px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-zinc-100 outline-none"
                placeholder="Supply and Demand Equilibrium&#10;Taxes and Subsidies&#10;Monopoly Profit and Deadweight Loss"
              />
            </label>
            <button
              suppressHydrationWarning
              type="button"
              onClick={applyPastedTopics}
              className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-50"
            >
              Load matched topics
            </button>
            <div className="flex flex-wrap gap-2">
              {allGuideTopics.map((topic) => {
                const active = testTopicSlugs.includes(topic.slug);
                return (
                  <button
                    suppressHydrationWarning
                    key={topic.slug}
                    type="button"
                    onClick={() => toggleTestTopicSlug(topic.slug)}
                    className={`rounded-full border px-3 py-2 text-xs transition ${
                      active ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-50" : "border-white/10 bg-white/6 text-zinc-300"
                    }`}
                  >
                    {topic.title}
                  </button>
                );
              })}
            </div>
          </GlassPanel>

          <GlassPanel className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-400">
              <Target className="h-4 w-4" />
              <p className="text-xs uppercase tracking-[0.22em]">Marked from highlights</p>
            </div>
            <div className="space-y-3">
              {testSelections.map((selection) => (
                <div key={selection.id} className="rounded-[28px] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{selection.topicSlug ?? "general selection"}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-200">{selection.text}</p>
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => removeTestSelection(selection.id)}
                    className="mt-3 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-zinc-200"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {!testSelections.length ? (
                <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-500">
                  Highlight text anywhere in the app and choose <span className="text-zinc-300">Is on the test</span> to add it here automatically.
                </div>
              ) : null}
            </div>
            {testSelections.length ? (
              <button
                suppressHydrationWarning
                type="button"
                onClick={clearTestSelections}
                className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-zinc-200"
              >
                Clear marked highlights
              </button>
            ) : null}
          </GlassPanel>

          <GlassPanel className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-400">
              <FileText className="h-4 w-4" />
              <p className="text-xs uppercase tracking-[0.22em]">Need to study</p>
            </div>
            <div className="space-y-3">
              {studySelections.slice(0, 6).map((selection) => (
                <div key={selection.id} className="rounded-[28px] border border-white/10 bg-black/20 p-4">
                  <p className="text-sm leading-6 text-zinc-200">{selection.text}</p>
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => removeStudySelection(selection.id)}
                    className="mt-3 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-zinc-200"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {!studySelections.length ? (
                <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-500">
                  Highlight text and choose <span className="text-zinc-300">Need to study</span> to build a quick review queue.
                </div>
              ) : null}
            </div>
          </GlassPanel>
        </div>

        <GlassPanel className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Generated study guide</p>
              <h3 className="mt-2 font-display text-3xl text-zinc-50">{testPrepTitle || "Custom AP Micro study guide"}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {testPrepDate ? `Test date: ${testPrepDate}. ` : ""}
                {selectedGuideTopics.length} selected topic{selectedGuideTopics.length === 1 ? "" : "s"} and {testSelections.length} marked highlight{testSelections.length === 1 ? "" : "s"}.
              </p>
            </div>
            <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-cyan-100">
              Custom guide ready
            </div>
          </div>

          {selectedGuideTopics.length || testSelections.length ? (
            <div className="space-y-4">
              <div className="rounded-[28px] border border-cyan-300/15 bg-cyan-300/8 p-5">
                <div className="flex items-center gap-2 text-cyan-100/80">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-[0.22em]">Study order</p>
                </div>
                <ol className="mt-4 space-y-2 text-sm leading-6 text-zinc-100">
                  {selectedGuideTopics.map((topic, index) => (
                    <li key={topic.slug}>
                      {index + 1}. {topic.title} ({topic.unitLabel})
                    </li>
                  ))}
                </ol>
              </div>

              {selectedGuideTopics.map((topic) => (
                <div key={topic.slug} className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{topic.unitLabel}</p>
                  <h4 className="mt-2 text-xl text-white">{topic.title}</h4>
                  <div className="mt-4 grid gap-3 lg:grid-cols-3">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">10-second meaning</p>
                      <p className="mt-2 text-sm leading-6 text-zinc-200">{topic.tenSecondMeaning}</p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Why this matters</p>
                      <p className="mt-2 text-sm leading-6 text-zinc-200">{topic.whyItMatters}</p>
                    </div>
                    <div className="rounded-3xl border border-rose-300/15 bg-rose-300/8 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-rose-100/80">AP trap</p>
                      <p className="mt-2 text-sm leading-6 text-rose-50">{topic.apTrap}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Sparkles className="h-4 w-4" />
                        <p className="text-xs uppercase tracking-[0.22em]">Graphs to review</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(topic.graphLabels.length ? topic.graphLabels : ["No dedicated graph called out"]).map((item) => (
                          <span key={item} className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-200">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Formulas or ideas to know cold</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(topic.formulaLabels.length ? topic.formulaLabels : ["Graph logic and AP wording"]).map((item) => (
                          <span key={item} className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-200">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {groupedSelections.length ? (
                <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Marked lines and phrases</p>
                  <div className="mt-4 space-y-4">
                    {groupedSelections.map(([topicSlug, snippets]) => (
                      <div key={topicSlug}>
                        <p className="text-sm font-medium text-white">{topicSlug === "general" ? "General test notes" : topicSlug}</p>
                        <div className="mt-3 space-y-2">
                          {snippets.map((snippet) => (
                            <div key={snippet} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm leading-6 text-zinc-200">
                              {snippet}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-6 text-sm leading-6 text-zinc-500">
              Add some topics or mark highlights as test-relevant and the guide will build itself here.
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}
