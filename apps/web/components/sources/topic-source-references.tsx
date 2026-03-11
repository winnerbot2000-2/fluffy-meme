"use client";

import type { TopicReference } from "@apmicro/shared-types";
import { GlassPanel, SourceBadge } from "@apmicro/ui";
import Link from "next/link";

import { fetchTopicReferences } from "@/lib/api";
import { useApiResource } from "@/lib/hooks/use-api-resource";

export function TopicSourceReferences({ slug }: { slug: string }) {
  const referenceState = useApiResource<TopicReference[]>({
    loader: () => fetchTopicReferences(slug),
    initialValue: [],
    deps: [slug],
  });

  return (
    <GlassPanel className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">PDF references</p>
          <h3 className="mt-2 text-2xl text-white">Jump from concept to source page</h3>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
          {referenceState.data.length} references
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {referenceState.data.map((reference) => (
          <Link
            key={reference.id}
            href={`/library/source/${reference.sourceId}?page=${reference.pageNumber}&highlight=${encodeURIComponent(reference.highlightText ?? reference.excerpt)}&topic=${encodeURIComponent(slug)}`}
            className="min-w-0 rounded-[28px] border border-white/10 bg-black/20 p-5 transition hover:bg-white/8"
          >
            <div className="flex flex-wrap items-center gap-2">
              <SourceBadge
                source={{
                  id: reference.sourceId,
                  title: reference.sourceTitle,
                  shortTitle: reference.sourceShortTitle,
                  path: "",
                  type: "notes",
                  summary: "",
                  tags: [],
                  coverage: [],
                  uploadedAt: "1970-01-01T00:00:00.000Z",
                }}
              />
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">Page {reference.pageNumber}</span>
            </div>
            <h4 className="mt-4 break-all text-lg font-medium text-white">{reference.heading}</h4>
            <p
              className="mt-3 break-all text-sm leading-6 text-zinc-300"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {reference.excerpt}
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-cyan-100/80">Open source page</p>
          </Link>
        ))}

        {referenceState.data.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-5 text-sm leading-6 text-zinc-500">
            {referenceState.loading ? "Loading source references..." : "No source references were found for this topic yet."}
          </div>
        ) : null}
      </div>
    </GlassPanel>
  );
}
