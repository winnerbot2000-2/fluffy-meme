"use client";

import { units } from "@apmicro/content-core";
import { GlassPanel, TopBar } from "@apmicro/ui";
import Link from "next/link";

import { fetchTopicBundles } from "@/lib/api";
import { useApiResource } from "@/lib/hooks/use-api-resource";

export function TopicsPage() {
  const topicState = useApiResource({
    loader: fetchTopicBundles,
    initialValue: [],
  });

  return (
    <div className="space-y-6">
      <TopBar
        title="Topic Atlas"
        subtitle="Merged topic pages now pull from the ingestion database so new PDF material can expand the curriculum without a code edit."
      />

      <div className="space-y-5">
        {units.map((unit) => {
          const unitTopics = topicState.data.filter((topic) => topic.unitId === unit.id);

          return (
            <GlassPanel key={unit.id} className="space-y-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Unit {unit.number}</p>
                  <h3 className="mt-2 font-display text-3xl text-zinc-50">{unit.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{unit.description}</p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">{unit.examWeight}</span>
              </div>

              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {unitTopics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/topic/${topic.topicSlug}`}
                    className="rounded-[28px] border border-white/10 bg-black/20 p-5 transition hover:bg-white/8"
                  >
                    <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Topic</p>
                    <h4 className="mt-2 text-lg font-medium text-white">{topic.title}</h4>
                    <p className="mt-3 text-sm leading-6 text-zinc-300">{topic.summary}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {[...topic.graphMentions, ...topic.formulaMentions].slice(0, 3).map((anchor) => (
                        <span key={anchor} className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
                          {anchor}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}

                {unitTopics.length === 0 ? (
                  <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-zinc-500">
                    {topicState.loading ? "Loading merged topics..." : "No ingested topics mapped to this unit yet."}
                  </div>
                ) : null}
              </div>
            </GlassPanel>
          );
        })}
      </div>
    </div>
  );
}
