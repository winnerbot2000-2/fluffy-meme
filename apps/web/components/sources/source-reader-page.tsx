"use client";

import { GlassPanel, SourceBadge, TopBar } from "@apmicro/ui";
import { ChevronLeft, ChevronRight, ExternalLink, FileText, Highlighter } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useMemo } from "react";

import { fetchSourcePage, getSourcePdfUrl } from "@/lib/api";
import { useApiResource } from "@/lib/hooks/use-api-resource";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenizeHighlight(highlight?: string) {
  if (!highlight) {
    return [];
  }

  return Array.from(
    new Set(
      highlight
        .toLowerCase()
        .match(/[a-z0-9']+/g)
        ?.filter((token) => token.length >= 4)
        .slice(0, 8) ?? [],
    ),
  );
}

function renderHighlightedLine(line: string, highlight?: string) {
  const tokens = tokenizeHighlight(highlight);
  if (!tokens.length) {
    return line;
  }

  const matcher = new RegExp(`(${tokens.map(escapeRegExp).join("|")})`, "gi");
  const segments = line.split(matcher);
  if (segments.length === 1) {
    return line;
  }

  return segments.map((segment, index) => {
    const matched = tokens.some((token) => token.toLowerCase() === segment.toLowerCase());
    if (!matched) {
      return <Fragment key={`${segment}-${index}`}>{segment}</Fragment>;
    }

    return (
      <mark key={`${segment}-${index}`} className="rounded bg-amber-300/25 px-1 text-amber-50">
        {segment}
      </mark>
    );
  });
}

export function SourceReaderPage({ sourceId }: { sourceId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageNumber = Math.max(Number(searchParams.get("page") ?? "1"), 1);
  const highlight = searchParams.get("highlight") ?? undefined;
  const topicSlug = searchParams.get("topic") ?? undefined;

  const pageState = useApiResource({
    loader: () => fetchSourcePage(sourceId, pageNumber, highlight),
    initialValue: {
        source: {
          id: sourceId,
          title: "Loading source...",
          shortTitle: "Source",
          path: "",
          type: "notes" as const,
          summary: "",
          tags: [],
          coverage: [],
          uploadedAt: "1970-01-01T00:00:00.000Z",
        },
      pageNumber,
      totalPages: pageNumber,
      heading: undefined,
      lines: [],
      highlightText: highlight,
    },
    deps: [sourceId, pageNumber, highlight],
  });
  const pdfUrl = useMemo(() => getSourcePdfUrl(sourceId, pageState.data.pageNumber), [pageState.data.pageNumber, sourceId]);

  function setPage(nextPage: number) {
    const clamped = Math.min(Math.max(nextPage, 1), pageState.data.totalPages || nextPage);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(clamped));
    if (highlight) {
      params.set("highlight", highlight);
    }
    if (topicSlug) {
      params.set("topic", topicSlug);
    }
    router.push(`/library/source/${sourceId}?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <TopBar
        title={pageState.data.source.title}
        subtitle="Read the source inside the app, jump directly to the cited page, highlight the relevant line, and select text for AI actions."
        actions={
          <Link
            href={pdfUrl}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-zinc-200"
          >
            <ExternalLink className="h-4 w-4" />
            Open original PDF
          </Link>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassPanel className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <SourceBadge source={pageState.data.source} />
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
                Page {pageState.data.pageNumber} of {pageState.data.totalPages}
              </span>
              {topicSlug ? (
                <Link href={`/topic/${topicSlug}`} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                  Back to topic
                </Link>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setPage(pageState.data.pageNumber - 1)}
                disabled={pageState.data.pageNumber <= 1}
                className="rounded-full border border-white/10 bg-white/6 p-2 text-zinc-200 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setPage(pageState.data.pageNumber + 1)}
                disabled={pageState.data.pageNumber >= pageState.data.totalPages}
                className="rounded-full border border-white/10 bg-white/6 p-2 text-zinc-200 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-2 text-zinc-400">
              <FileText className="h-4 w-4" />
              <p className="text-xs uppercase tracking-[0.22em]">Extracted text page</p>
            </div>
            <p className="mt-3 break-all text-sm leading-6 text-zinc-300">{pageState.data.heading ?? "Source page"}</p>
            {highlight ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
                <Highlighter className="h-3.5 w-3.5" />
                Highlight target loaded from citation
              </div>
            ) : null}
          </div>

          <div
            data-source-context="true"
            data-source-id={sourceId}
            data-page-number={String(pageState.data.pageNumber)}
            data-topic-slug={topicSlug ?? ""}
            className="max-h-[70vh] space-y-2 overflow-y-auto rounded-3xl border border-white/10 bg-black/20 p-4"
          >
            {pageState.data.lines.map((line) => (
              <div
                key={`${pageState.data.pageNumber}-${line.index}`}
                className={`grid grid-cols-[40px_minmax(0,1fr)] gap-3 rounded-2xl px-3 py-2 ${
                  line.highlighted ? "bg-amber-300/10 ring-1 ring-amber-300/20" : "bg-white/[0.02]"
                }`}
              >
                <span className="pt-0.5 text-right text-xs text-zinc-500">{line.index}</span>
                <p className="break-all text-sm leading-6 text-zinc-200">{renderHighlightedLine(line.text, pageState.data.highlightText)}</p>
              </div>
            ))}
          </div>
        </GlassPanel>

        <div className="space-y-4">
          <GlassPanel className="space-y-4">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Original PDF view</p>
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
              <iframe
                src={pdfUrl}
                title={`${pageState.data.source.title} page ${pageState.data.pageNumber}`}
                className="h-[72vh] w-full"
              />
            </div>
          </GlassPanel>

          <GlassPanel className="space-y-3">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Selection actions</p>
            <p className="text-sm leading-6 text-zinc-300">
              Highlight any line or phrase in the text pane and use the floating assistant on the right edge to summarize it, simplify it, or link it back to AP Micro graph and concept language.
            </p>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
