"use client";

import type { Formula, PracticeQuestion, Source, Topic, Unit } from "@apmicro/shared-types";
import {
  ADHDQuickMeaning,
  FormulaCard,
  GlassPanel,
  PracticeCard,
  SourceBadge,
  TopicHeroCard,
  WhyItMattersCard,
} from "@apmicro/ui";
import { FileStack, Sparkles } from "lucide-react";
import { useMemo } from "react";

import { graphIdToModuleId, graphModuleMap } from "@/components/graphs/graph-module-registry";
import { TopicSourceReferences } from "@/components/sources/topic-source-references";
import { ADHDFocusDeck } from "@/components/study-mode/adhd-focus-deck";
import { TopicNotebook } from "@/components/topics/topic-notebook";
import { TopicTutorPanel } from "@/components/topics/topic-tutor-panel";
import { useAppStore } from "@/lib/stores/app-store";

export function TopicDetail({
  topic,
  unit,
  formulas,
  sources,
  practice,
}: {
  topic: Topic;
  unit?: Unit;
  formulas: Formula[];
  sources: Source[];
  practice: PracticeQuestion[];
}) {
  const studyMode = useAppStore((state) => state.studyMode);
  const graphModulesForTopic = useMemo(
    () => {
      const seenModuleIds = new Set<string>();

      return topic.graphIds.flatMap((graphId) => {
        const moduleId = graphIdToModuleId[graphId];
        const moduleMeta = moduleId ? graphModuleMap[moduleId] : null;
        if (!moduleMeta || seenModuleIds.has(moduleMeta.id)) {
          return [];
        }

        seenModuleIds.add(moduleMeta.id);
        return [{ graphId, moduleMeta }];
      });
    },
    [topic.graphIds],
  );
  const primaryGraphId = graphModulesForTopic[0]?.graphId ?? topic.graphIds[0];

  return (
    <div className="space-y-6" data-topic-slug={topic.slug}>
      <TopicHeroCard topic={topic} unitLabel={unit ? `Unit ${unit.number}: ${unit.title}` : "AP Micro Topic"} />

      {studyMode === "adhd" ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
          <ADHDQuickMeaning meaning={topic.tenSecondMeaning} trap={topic.apTrap} />
          <WhyItMattersCard message={topic.whyItMatters} />
          <ADHDFocusDeck
            ideas={[
              { title: "10-second meaning", body: topic.tenSecondMeaning, tag: "fast scan" },
              { title: "Why this matters", body: topic.whyItMatters, tag: "anchor" },
              { title: "AP trap", body: topic.apTrap, tag: "watch this" },
            ]}
          />
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <GlassPanel className="h-full">
          <div className="flex items-center gap-2 text-zinc-400">
            <Sparkles className="h-4 w-4" />
            <p className="text-xs uppercase tracking-[0.22em]">Core ideas</p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {topic.keyIdeas.map((idea) => (
              <div key={idea} className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-200">
                {idea}
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Exam phrasing</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-200">
              {topic.examPhrasing.map((phrase) => (
                <li key={phrase}>{phrase}</li>
              ))}
            </ul>
          </div>
        </GlassPanel>

        <GlassPanel className="h-full">
          <div className="flex items-center gap-2 text-zinc-400">
            <FileStack className="h-4 w-4" />
            <p className="text-xs uppercase tracking-[0.22em]">Merged sources</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {sources.map((source) => (
              <SourceBadge key={source.id} source={source} />
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {sources.map((source) => (
              <div key={source.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-medium text-white">{source.title}</p>
                <p className="mt-2 text-xs leading-5 text-zinc-400">{source.summary}</p>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      {formulas.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {formulas.map((formula) => (
            <FormulaCard key={formula.id} formula={formula} />
          ))}
        </div>
      ) : null}

      <TopicSourceReferences slug={topic.slug} />

      <div className="space-y-6">
        {graphModulesForTopic.map(({ graphId, moduleMeta }) => {
          const Component = moduleMeta.component;
          return <Component key={`${moduleMeta.id}-${graphId}`} />;
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4">
          {practice.map((question) => (
            <PracticeCard key={question.id} question={question} />
          ))}
        </div>

        <div className="grid gap-4">
          <TopicTutorPanel topicId={topic.id} graphId={primaryGraphId} />
          <TopicNotebook topicId={topic.id} graphId={primaryGraphId} />
        </div>
      </div>
    </div>
  );
}
