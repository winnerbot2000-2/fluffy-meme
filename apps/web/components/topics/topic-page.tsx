"use client";

import { formulas, getTopicBundle as getSeedTopicBundle, sources as seededSources } from "@apmicro/content-core";
import type { Formula, PracticeQuestion, Source, Topic, Unit } from "@apmicro/shared-types";
import { GlassPanel } from "@apmicro/ui";
import { useMemo } from "react";

import { fetchPracticeQuestions, fetchSources, fetchTopicBundle, type ApiTopicBundle } from "@/lib/api";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { TopicDetail } from "./topic-detail";

type TopicPageProps = {
  slug: string;
};

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function synthesizeTopic(bundle: ApiTopicBundle): Topic {
  return {
    id: bundle.id,
    slug: bundle.topicSlug,
    unitId: bundle.unitId ?? "unit-1",
    title: bundle.title,
    shortDescription: bundle.summary,
    tenSecondMeaning: bundle.summary.slice(0, 160),
    whyItMatters: bundle.explanationVariants[0] ?? "This topic was merged from your ingested AP Micro sources.",
    apTrap: bundle.explanationVariants[1] ?? "Check labels, units, and whether the question wants quantity, price, or area.",
    graphIds: unique(
      bundle.graphMentions.map((mention) => {
        if (mention === "tax-wedge") {
          return "tax";
        }
        if (mention === "supply-demand") {
          return "equilibrium";
        }
        return mention.replace("cost-curves", "monopoly");
      }),
    ),
    formulaIds: unique(formulas.filter((formula) => bundle.formulaMentions.some((item) => formula.id.includes(item))).map((formula) => formula.id)),
    sourceIds: unique(bundle.sourceIds),
    keyIdeas: bundle.explanationVariants.slice(0, 3),
    examPhrasing: [
      `Explain ${bundle.title.toLowerCase()} using AP-style graph reasoning.`,
      `Identify how this topic changes equilibrium, surplus, or efficiency.`,
    ],
    visualAnchors: unique([...bundle.graphMentions, ...bundle.formulaMentions]).slice(0, 3),
  };
}

export function TopicPage({ slug }: TopicPageProps) {
  const seededBundle = getSeedTopicBundle(slug);
  const apiTopic = useApiResource({
    loader: () => fetchTopicBundle(slug),
    initialValue: seededBundle
      ? {
          id: seededBundle.topic.id,
          unitId: seededBundle.topic.unitId,
          topicSlug: seededBundle.topic.slug,
          title: seededBundle.topic.title,
          summary: seededBundle.topic.shortDescription,
          sourceIds: seededBundle.topic.sourceIds,
          chunkIds: [],
          explanationVariants: seededBundle.topic.keyIdeas,
          graphMentions: seededBundle.topic.graphIds,
          formulaMentions: seededBundle.topic.formulaIds,
        }
      : {
          id: slug,
          unitId: "unit-1",
          topicSlug: slug,
          title: slug.replace(/-/g, " "),
          summary: "Loading topic bundle...",
          sourceIds: [],
          chunkIds: [],
          explanationVariants: [],
          graphMentions: [],
          formulaMentions: [],
        },
    deps: [slug],
  });
  const sourceState = useApiResource({
    loader: fetchSources,
    initialValue: seededSources,
  });
  const practiceState = useApiResource({
    loader: async () => fetchPracticeQuestions({ topicId: apiTopic.data.id }),
    initialValue: seededBundle?.practice ?? [],
    deps: [apiTopic.data.id],
  });

  const topic = useMemo<Topic>(() => (seededBundle?.topic ?? synthesizeTopic(apiTopic.data)), [apiTopic.data, seededBundle]);
  const unit = useMemo<Unit | undefined>(() => seededBundle?.unit, [seededBundle]);
  const topicFormulas = useMemo<Formula[]>(
    () =>
      seededBundle?.formulas ??
      formulas.filter((formula) => topic.formulaIds.includes(formula.id)),
    [seededBundle, topic.formulaIds],
  );
  const topicSources = useMemo<Source[]>(
    () =>
      sourceState.data.filter((source) => topic.sourceIds.includes(source.id)),
    [sourceState.data, topic.sourceIds],
  );
  const practice = practiceState.data as PracticeQuestion[];

  if (!topic) {
    return (
      <GlassPanel>
        <p className="text-sm text-zinc-400">Topic not found.</p>
      </GlassPanel>
    );
  }

  return <TopicDetail topic={topic} unit={unit} formulas={topicFormulas} sources={topicSources} practice={practice} />;
}
