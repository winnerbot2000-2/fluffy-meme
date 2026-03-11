"use client";

import type { SourceSelectionAssistResponse } from "@apmicro/shared-types";
import { GlassPanel } from "@apmicro/ui";
import { Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { assistSourceSelection } from "@/lib/api";
import { useAppStore } from "@/lib/stores/app-store";

type SelectionContext = {
  text: string;
  sourceId?: string;
  pageNumber?: number;
  topicSlug?: string;
};

function getContextFromSelection(): SelectionContext | null {
  const selection = window.getSelection();
  const text = selection?.toString().trim() ?? "";
  if (text.length < 12) {
    return null;
  }

  const anchorNode = selection?.anchorNode ?? null;
  const baseElement =
    anchorNode instanceof HTMLElement
      ? anchorNode
      : anchorNode?.parentElement ?? null;

  const sourceContainer = baseElement?.closest("[data-source-context]") as HTMLElement | null;
  const topicContainer = baseElement?.closest("[data-topic-slug]") as HTMLElement | null;

  return {
    text,
    sourceId: sourceContainer?.dataset.sourceId,
    pageNumber: sourceContainer?.dataset.pageNumber ? Number(sourceContainer.dataset.pageNumber) : undefined,
    topicSlug: sourceContainer?.dataset.topicSlug || topicContainer?.dataset.topicSlug || undefined,
  };
}

export function SelectionAssistant() {
  const addStudySelection = useAppStore((state) => state.addStudySelection);
  const addTestSelection = useAppStore((state) => state.addTestSelection);
  const [selection, setSelection] = useState<SelectionContext | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SourceSelectionAssistResponse | null>(null);

  useEffect(() => {
    function handleSelectionChange() {
      const next = getContextFromSelection();
      setSelection(next);
      if (!next) {
        setResult(null);
        setOpen(false);
      }
    }

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  const selectionPreview = useMemo(() => selection?.text.slice(0, 220), [selection?.text]);

  async function runAction(action: "summarize" | "explain-simple" | "link-to-apmicro" | "tutor-help") {
    if (!selection) {
      return;
    }
    setLoading(true);
    try {
      const response = await assistSourceSelection({
        text: selection.text,
        action,
        sourceId: selection.sourceId,
        pageNumber: selection.pageNumber,
        topicSlug: selection.topicSlug,
      });
      setResult(response);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  function saveForStudy() {
    if (!selection) {
      return;
    }

    addStudySelection({
      text: selection.text,
      topicSlug: selection.topicSlug,
      sourceId: selection.sourceId,
      pageNumber: selection.pageNumber,
    });
    setResult({
      title: "Saved to study later",
      response: "This highlight was added to your study queue. You can use it later when building a review session or a custom test-prep guide.",
      citations: [],
    });
    setOpen(true);
  }

  function markForTest() {
    if (!selection) {
      return;
    }

    addTestSelection({
      text: selection.text,
      topicSlug: selection.topicSlug,
      sourceId: selection.sourceId,
      pageNumber: selection.pageNumber,
    });
    setResult({
      title: "Added to test prep",
      response: "This highlight is now marked as test-relevant. Open the test-prep page to turn your marked topics and highlights into a custom study guide.",
      citations: [],
    });
    setOpen(true);
  }

  if (!selection) {
    return null;
  }

  return (
    <>
      <button
        suppressHydrationWarning
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed right-4 top-1/2 z-40 -translate-y-1/2 rounded-full border border-cyan-300/20 bg-slate-950/90 px-4 py-3 text-xs uppercase tracking-[0.22em] text-cyan-100 shadow-[0_20px_60px_-30px_rgba(8,145,178,0.65)] backdrop-blur"
      >
        AI on selection
      </button>

      {open ? (
        <div className="fixed right-4 top-1/2 z-50 w-[360px] -translate-y-1/2">
          <GlassPanel className="space-y-4" glow>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Selection helper</p>
                <h3 className="mt-2 text-lg text-white">Study actions for highlighted text</h3>
              </div>
              <button suppressHydrationWarning type="button" onClick={() => setOpen(false)} className="rounded-full border border-white/10 bg-white/6 p-2 text-zinc-300">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Selected text</p>
              <p className="mt-3 break-words text-sm leading-6 text-zinc-200">{selectionPreview}{selection && selection.text.length > 220 ? "…" : ""}</p>
            </div>

            <div className="grid gap-2">
              <button
                suppressHydrationWarning
                type="button"
                onClick={saveForStudy}
                className="rounded-3xl border border-white/10 bg-white/6 px-4 py-3 text-left text-sm text-zinc-100"
              >
                Need to study
              </button>
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => void runAction("tutor-help")}
                className="rounded-3xl border border-white/10 bg-white/6 px-4 py-3 text-left text-sm text-zinc-100"
              >
                Need help with AI tutor
              </button>
              <button
                suppressHydrationWarning
                type="button"
                onClick={markForTest}
                className="rounded-3xl border border-white/10 bg-white/6 px-4 py-3 text-left text-sm text-zinc-100"
              >
                Is on the test
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => void runAction("summarize")}
                className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-300"
              >
                One-sentence summary
              </button>
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => void runAction("link-to-apmicro")}
                className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-300"
              >
                Link to AP Micro
              </button>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">Working on the selected text...</div>
            ) : null}

            {result ? (
              <div className="space-y-3">
                <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/8 p-4">
                  <div className="flex items-center gap-2 text-cyan-100/80">
                    <Sparkles className="h-4 w-4" />
                    <p className="text-xs uppercase tracking-[0.22em]">{result.title}</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-100">{result.response}</p>
                </div>
                {result.citations.length ? (
                  <div className="space-y-2">
                    {result.citations.map((citation) => (
                      <Link
                        key={citation.id}
                        href={`/library/source/${citation.sourceId}?page=${citation.pageNumber}&highlight=${encodeURIComponent(citation.highlightText ?? citation.excerpt)}&topic=${encodeURIComponent(selection.topicSlug ?? "")}`}
                        className="block rounded-3xl border border-white/10 bg-black/20 p-4 transition hover:bg-white/8"
                      >
                        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                          {citation.sourceShortTitle} · page {citation.pageNumber}
                        </p>
                        <p className="mt-2 break-words text-sm text-zinc-200">{citation.excerpt}</p>
                      </Link>
                    ))}
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Link href="/test-prep" className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs text-zinc-100">
                    Open test prep
                  </Link>
                  <Link href="/flashcards" className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs text-zinc-100">
                    Open flashcards
                  </Link>
                </div>
              </div>
            ) : null}
          </GlassPanel>
        </div>
      ) : null}
    </>
  );
}
