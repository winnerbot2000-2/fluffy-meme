"use client";

import { flashcards as seededFlashcards } from "@apmicro/content-core";
import type { Flashcard } from "@apmicro/shared-types";
import { GlassPanel, TopBar } from "@apmicro/ui";
import { ArrowLeft, ArrowRight, Layers3, RotateCw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { ApiTopicBundle } from "@/lib/api";
import { fetchFlashcards, fetchTopicBundles, reviewFlashcard } from "@/lib/api";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { FlashcardChatSidebar } from "./flashcard-chat-sidebar";
import { FlashcardImportPanel } from "./flashcard-import-panel";

export function FlashcardsPage() {
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [dueOnly, setDueOnly] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const topicState = useApiResource<ApiTopicBundle[]>({
    loader: fetchTopicBundles,
    initialValue: [],
  });
  const flashcardState = useApiResource<Flashcard[]>({
    loader: () => fetchFlashcards(selectedTopicId || undefined, dueOnly),
    initialValue: seededFlashcards,
    deps: [selectedTopicId, dueOnly],
  });

  const activeFlashcard = flashcardState.data[activeIndex] ?? null;
  const activeTopic = useMemo(
    () => topicState.data.find((topic) => topic.id === activeFlashcard?.topicId),
    [activeFlashcard?.topicId, topicState.data],
  );

  useEffect(() => {
    setFlipped(false);
  }, [activeFlashcard?.id]);

  useEffect(() => {
    if (activeIndex > Math.max(flashcardState.data.length - 1, 0)) {
      setActiveIndex(0);
    }
  }, [activeIndex, flashcardState.data.length]);

  async function refreshDeck(nextTopicId?: string, importedIds?: string[]) {
    if (typeof nextTopicId === "string") {
      setSelectedTopicId(nextTopicId);
    }

    const nextCards = await fetchFlashcards(nextTopicId || selectedTopicId || undefined, dueOnly);
    flashcardState.setData(nextCards);
    if (importedIds?.length) {
      const nextIndex = nextCards.findIndex((card) => importedIds.includes(card.id));
      setActiveIndex(nextIndex >= 0 ? nextIndex : 0);
    } else {
      setActiveIndex(0);
    }
  }

  async function markCard(confidence: number) {
    if (!activeFlashcard) {
      return;
    }

    await reviewFlashcard(activeFlashcard.id, confidence);
    const nextCards = await fetchFlashcards(selectedTopicId || undefined, dueOnly);
    flashcardState.setData(nextCards);
    setFlipped(false);
    if (nextCards.length === 0) {
      setActiveIndex(0);
      return;
    }
    setActiveIndex((current) => Math.min(current, Math.max(nextCards.length - 1, 0)));
  }

  return (
    <div className="space-y-6">
      <TopBar
        title="Flashcards"
        subtitle="Study AP Micro terms like a deck app, paste Quizlet-style imports directly into the platform, and keep a chatbot open beside the active card."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_380px]">
        <div className="space-y-4">
          <GlassPanel className="space-y-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Deck controls</p>
                <h3 className="mt-2 text-2xl text-white">Quizlet-style study flow</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Flip the card, rate how well you knew it, and keep a card-specific tutor thread open on the right.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => setDueOnly(false)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    !dueOnly ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-50" : "border-white/10 bg-white/6 text-zinc-300"
                  }`}
                >
                  All cards
                </button>
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => setDueOnly(true)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    dueOnly ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-50" : "border-white/10 bg-white/6 text-zinc-300"
                  }`}
                >
                  Due now
                </button>
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-[1fr_240px]">
              <label className="block">
                <p className="mb-2 text-xs uppercase tracking-[0.22em] text-zinc-500">Topic filter</p>
                <select
                  suppressHydrationWarning
                  value={selectedTopicId}
                  onChange={(event) => {
                    setSelectedTopicId(event.target.value);
                    setActiveIndex(0);
                  }}
                  className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 outline-none"
                >
                  <option value="" className="bg-zinc-950">
                    All topics
                  </option>
                  <option value="custom-review" className="bg-zinc-950">
                    Custom import deck
                  </option>
                  {topicState.data.map((topic) => (
                    <option key={topic.id} value={topic.id} className="bg-zinc-950">
                      {topic.title}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-[28px] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Deck size</p>
                <p className="mt-2 text-3xl font-medium text-white">{flashcardState.data.length}</p>
                <p className="mt-2 text-xs leading-5 text-zinc-400">cards in the current filter</p>
              </div>
            </div>
          </GlassPanel>

          <FlashcardImportPanel
            topics={topicState.data}
            selectedTopicId={selectedTopicId || undefined}
            onImported={async (topicId, importedIds) => {
              await refreshDeck(topicId, importedIds);
            }}
          />

          <GlassPanel className="space-y-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Study stage</p>
                <h3 className="mt-2 text-2xl text-white">{activeFlashcard ? activeFlashcard.front : "No flashcards loaded"}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {activeFlashcard
                    ? activeTopic?.title ?? activeFlashcard.topicId
                    : "Import a deck or switch to a topic that has flashcards."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => setActiveIndex((current) => Math.max(current - 1, 0))}
                  disabled={activeIndex <= 0}
                  className="rounded-full border border-white/10 bg-white/6 p-3 text-zinc-200 disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300">
                  {flashcardState.data.length ? `${activeIndex + 1} / ${flashcardState.data.length}` : "0 / 0"}
                </div>
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => setActiveIndex((current) => Math.min(current + 1, Math.max(flashcardState.data.length - 1, 0)))}
                  disabled={!flashcardState.data.length || activeIndex >= flashcardState.data.length - 1}
                  className="rounded-full border border-white/10 bg-white/6 p-3 text-zinc-200 disabled:opacity-40"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {activeFlashcard ? (
              <>
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => setFlipped((value) => !value)}
                  className="block w-full text-left"
                >
                  <div className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-8 transition hover:bg-white/8">
                    <div className="flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs uppercase tracking-[0.22em] text-zinc-400">
                        <Layers3 className="h-3.5 w-3.5" />
                        {flipped ? "Answer side" : "Prompt side"}
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-zinc-400">
                        <RotateCw className="h-3.5 w-3.5" />
                        Tap to flip
                      </div>
                    </div>

                    <div className="mt-10 min-h-[220px]">
                      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{flipped ? "Definition" : "Term"}</p>
                      <p className="mt-5 max-w-4xl text-3xl leading-[1.25] text-white lg:text-4xl">
                        {flipped ? activeFlashcard.back : activeFlashcard.front}
                      </p>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-2">
                      {activeFlashcard.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>

                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    { label: "Missed it", confidence: 45, description: "Bring it back quickly." },
                    { label: "Knew it", confidence: 75, description: "Keep it in rotation." },
                    { label: "Locked in", confidence: 95, description: "Push it further out." },
                  ].map((item) => (
                    <button
                      suppressHydrationWarning
                      key={item.label}
                      type="button"
                      onClick={() => void markCard(item.confidence)}
                      className="rounded-[28px] border border-white/10 bg-black/20 p-4 text-left transition hover:bg-white/8"
                    >
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="mt-2 text-xs leading-5 text-zinc-400">{item.description}</p>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-6 text-sm leading-6 text-zinc-400">
                No flashcards are available for this filter yet. Import a Quizlet-style deck above or switch to a topic with cards.
              </div>
            )}

            <div className="rounded-[28px] border border-cyan-300/15 bg-cyan-300/8 p-4 text-sm leading-6 text-zinc-200">
              <div className="flex items-center gap-2 text-cyan-100/80">
                <Sparkles className="h-4 w-4" />
                <p className="text-xs uppercase tracking-[0.22em]">Study flow</p>
              </div>
              <p className="mt-3">Flip the card, self-rate it, then use the tutor panel to test yourself, ask for a mnemonic, or connect the card to AP graph language.</p>
            </div>
          </GlassPanel>
        </div>

        <FlashcardChatSidebar flashcard={activeFlashcard} />
      </div>
    </div>
  );
}
