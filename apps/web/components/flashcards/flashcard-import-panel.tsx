"use client";

import { GlassPanel } from "@apmicro/ui";
import { Import, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

import type { ApiTopicBundle } from "@/lib/api";
import { importFlashcards } from "@/lib/api";

export function FlashcardImportPanel({
  topics,
  selectedTopicId,
  onImported,
}: {
  topics: ApiTopicBundle[];
  selectedTopicId?: string;
  onImported: (topicId: string | undefined, importedIds: string[]) => Promise<void> | void;
}) {
  const [topicId, setTopicId] = useState(selectedTopicId ?? "");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [rawText, setRawText] = useState("");
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setTopicId(selectedTopicId ?? "");
  }, [selectedTopicId]);

  async function handleImport() {
    if (!rawText.trim()) {
      setMessage("Paste at least one card in Quizlet export format.");
      return;
    }

    setImporting(true);
    setMessage(null);
    try {
      const response = await importFlashcards({
        topicId: topicId || undefined,
        rawText,
        source: "quizlet",
        difficulty,
      });

      setMessage(`Imported ${response.importedCount} flashcard${response.importedCount === 1 ? "" : "s"}.`);
      if (response.importedCount > 0) {
        setRawText("");
      }
      await onImported(topicId || undefined, response.flashcards.map((card) => card.id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <GlassPanel className="space-y-4">
      <div className="flex items-center gap-2 text-zinc-400">
        <Import className="h-4 w-4" />
        <p className="text-xs uppercase tracking-[0.22em]">Import cards</p>
      </div>
      <div className="grid gap-3 xl:grid-cols-[1fr_180px_160px]">
        <label className="block">
          <p className="mb-2 text-xs uppercase tracking-[0.22em] text-zinc-500">Attach to topic</p>
          <select
            suppressHydrationWarning
            value={topicId}
            onChange={(event) => setTopicId(event.target.value)}
            className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 outline-none"
          >
            <option value="" className="bg-zinc-950">
              Custom import deck
            </option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id} className="bg-zinc-950">
                {topic.title}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <p className="mb-2 text-xs uppercase tracking-[0.22em] text-zinc-500">Difficulty</p>
          <select
            suppressHydrationWarning
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as "easy" | "medium" | "hard")}
            className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 outline-none"
          >
            <option value="easy" className="bg-zinc-950">
              Easy
            </option>
            <option value="medium" className="bg-zinc-950">
              Medium
            </option>
            <option value="hard" className="bg-zinc-950">
              Hard
            </option>
          </select>
        </label>

        <div className="flex items-end">
          <button
            suppressHydrationWarning
            type="button"
            onClick={() => void handleImport()}
            disabled={importing || !rawText.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50 disabled:opacity-60"
          >
            {importing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Import className="h-4 w-4" />}
            Import deck
          </button>
        </div>
      </div>

      <label className="block">
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-zinc-500">Quizlet-style paste</p>
        <textarea
          suppressHydrationWarning
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          rows={7}
          className="w-full rounded-[28px] border border-white/10 bg-black/20 px-4 py-4 font-mono text-sm leading-6 text-zinc-100 outline-none"
          placeholder={`Scarcity\tResources are limited while wants are unlimited\nOpportunity cost\tThe next best alternative forgone\nAllocative efficiency\tOccurs where price equals marginal cost`}
        />
      </label>

      <div className="rounded-[28px] border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-300">
        Paste one flashcard per line. Best format is Quizlet export style:
        <span className="mt-2 block font-mono text-xs text-cyan-100">term[TAB]definition</span>
        The importer also accepts <span className="font-mono text-cyan-100">term :: definition</span> or <span className="font-mono text-cyan-100">term | definition</span>.
      </div>

      {message ? (
        <div className="rounded-[28px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200">{message}</div>
      ) : null}
    </GlassPanel>
  );
}
