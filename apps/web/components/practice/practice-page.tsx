"use client";

import { flashcards, units } from "@apmicro/content-core";
import { FlashcardView, GlassPanel, TopBar } from "@apmicro/ui";
import { useEffect, useMemo, useState } from "react";

import { fetchFlashcards, fetchPracticeQuestions, fetchReviewQueue, fetchTopicBundles, reviewFlashcard } from "@/lib/api";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { PracticeAttemptPanel } from "./practice-attempt-panel";
import { ReviewQueuePanel } from "./review-queue-panel";

type ReviewScope = "all" | "unit" | "subunit";
type QuestionFilter = "all" | "mcq" | "frq" | "graph" | "formula";

export function PracticePage() {
  const questionState = useApiResource({
    loader: () => fetchPracticeQuestions({ origin: "ap-like" }),
    initialValue: [],
  });
  const topicState = useApiResource({
    loader: fetchTopicBundles,
    initialValue: [],
  });
  const flashcardState = useApiResource({
    loader: () => fetchFlashcards(undefined, true),
    initialValue: flashcards,
  });
  const reviewState = useApiResource({
    loader: fetchReviewQueue,
    initialValue: [],
  });

  const [scope, setScope] = useState<ReviewScope>("all");
  const [unitId, setUnitId] = useState<string>("unit-1");
  const [subunitId, setSubunitId] = useState<string>("");
  const [questionFilter, setQuestionFilter] = useState<QuestionFilter>("all");
  const [activeIndex, setActiveIndex] = useState(0);

  const availableSubunits = useMemo(
    () => topicState.data.filter((topic) => topic.unitId === unitId),
    [topicState.data, unitId],
  );

  const filteredQuestions = useMemo(() => {
    return questionState.data.filter((question) => {
      if (questionFilter !== "all" && question.type !== questionFilter) {
        return false;
      }

      if (scope === "unit") {
        return question.unitId === unitId;
      }

      if (scope === "subunit") {
        return question.topicId === subunitId;
      }

      return true;
    });
  }, [questionFilter, questionState.data, scope, subunitId, unitId]);

  const activeQuestion = filteredQuestions[activeIndex] ?? null;
  const activeUnit = units.find((unit) => unit.id === unitId);
  const activeSubunit = availableSubunits.find((topic) => topic.id === subunitId);
  const coverageSummary = useMemo(() => {
    const coveredUnits = new Set(questionState.data.map((question) => question.unitId).filter(Boolean));
    const coveredSubunits = new Set(questionState.data.map((question) => question.topicId));
    return {
      unitCount: coveredUnits.size,
      subunitCount: coveredSubunits.size,
      totalCount: questionState.data.length,
    };
  }, [questionState.data]);

  useEffect(() => {
    if (!availableSubunits.length) {
      setSubunitId("");
      return;
    }

    if (!subunitId || !availableSubunits.some((topic) => topic.id === subunitId)) {
      setSubunitId(availableSubunits[0].id);
    }
  }, [availableSubunits, subunitId]);

  useEffect(() => {
    setActiveIndex(0);
  }, [scope, unitId, subunitId, questionFilter]);

  useEffect(() => {
    if (activeIndex > Math.max(filteredQuestions.length - 1, 0)) {
      setActiveIndex(0);
    }
  }, [activeIndex, filteredQuestions.length]);

  async function refreshStudyState() {
    questionState.setData(await fetchPracticeQuestions({ origin: "ap-like" }));
    flashcardState.setData(await fetchFlashcards(undefined, true));
    reviewState.setData(await fetchReviewQueue());
  }

  return (
    <div className="space-y-6">
      <TopBar
        title="Practice and Review"
        subtitle="Every AP Micro unit is covered with AP-like MCQs, FRQs, and clickable graph questions. Run whole-unit review or isolate a single subunit."
      />

      <GlassPanel className="space-y-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Review scope</p>
            <h3 className="mt-2 font-display text-3xl text-zinc-50">Unit-wide or subunit-by-subunit</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              {coverageSummary.totalCount} AP-like questions loaded across {coverageSummary.unitCount} units and {coverageSummary.subunitCount} subunits, with graph questions answered directly on the graph.
            </p>
          </div>
          <div className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-cyan-100/90">
            Question style: AP-like
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
          <div className="space-y-3 rounded-[28px] border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Choose scope</p>
            <div className="flex flex-wrap gap-2">
              {[
                ["all", "All units"],
                ["unit", "Entire unit"],
                ["subunit", "Single subunit"],
              ].map(([value, label]) => (
                <button
                  suppressHydrationWarning
                  key={value}
                  type="button"
                  onClick={() => setScope(value as ReviewScope)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    scope === value
                      ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-50"
                      : "border-white/10 bg-white/6 text-zinc-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-[28px] border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Choose unit</p>
            <select
              suppressHydrationWarning
              value={unitId}
              onChange={(event) => setUnitId(event.target.value)}
              className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 outline-none"
            >
              {units.map((unit) => (
                <option key={unit.id} value={unit.id} className="bg-zinc-950">
                  Unit {unit.number}: {unit.title}
                </option>
              ))}
            </select>
            <p className="text-xs leading-5 text-zinc-500">{activeUnit?.description}</p>
          </div>

          <div className="space-y-3 rounded-[28px] border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Choose subunit</p>
            <select
              suppressHydrationWarning
              value={subunitId}
              onChange={(event) => setSubunitId(event.target.value)}
              disabled={!availableSubunits.length}
              className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 outline-none disabled:opacity-50"
            >
              {availableSubunits.map((topic) => (
                <option key={topic.id} value={topic.id} className="bg-zinc-950">
                  {topic.title}
                </option>
              ))}
            </select>
            <p className="text-xs leading-5 text-zinc-500">
              {activeSubunit?.summary ?? "Select a unit to load its subunits."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ["all", "Mixed"],
            ["mcq", "MCQ"],
            ["frq", "FRQ"],
            ["graph", "Graph"],
            ["formula", "Formula"],
          ].map(([value, label]) => (
            <button
              suppressHydrationWarning
              key={value}
              type="button"
              onClick={() => setQuestionFilter(value as QuestionFilter)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                questionFilter === value
                  ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-50"
                  : "border-white/10 bg-white/6 text-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </GlassPanel>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <GlassPanel className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Review session</p>
              <h3 className="mt-2 text-2xl text-white">
                {scope === "all"
                  ? "All-unit mixed review"
                  : scope === "unit"
                    ? `Unit review: ${activeUnit?.title ?? "Unknown unit"}`
                    : `Subunit review: ${activeSubunit?.title ?? "Select a subunit"}`}
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {filteredQuestions.length} question{filteredQuestions.length === 1 ? "" : "s"} match the current scope.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setActiveIndex((current) => Math.max(current - 1, 0))}
                disabled={activeIndex === 0}
                className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-zinc-200 disabled:opacity-40"
              >
                Previous
              </button>
              <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300">
                {filteredQuestions.length ? `${activeIndex + 1} / ${filteredQuestions.length}` : "0 / 0"}
              </div>
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setActiveIndex((current) => Math.min(current + 1, Math.max(filteredQuestions.length - 1, 0)))}
                disabled={!filteredQuestions.length || activeIndex >= filteredQuestions.length - 1}
                className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-zinc-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>

          {activeQuestion ? (
            <PracticeAttemptPanel question={activeQuestion} onAttempted={refreshStudyState} />
          ) : (
            <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-6 text-sm leading-6 text-zinc-400">
              No questions match this filter yet. Try switching back to mixed review, choose a different unit, or include graph questions.
            </div>
          )}
        </GlassPanel>

        <div className="space-y-4">
          <GlassPanel className="space-y-4">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Due flashcards</p>
            <div className="grid gap-4">
              {flashcardState.data.map((flashcard) => (
                <div key={flashcard.id} className="space-y-3">
                  <FlashcardView flashcard={flashcard} />
                  <div className="flex gap-2">
                    {[55, 75, 95].map((confidence) => (
                      <button
                        suppressHydrationWarning
                        key={confidence}
                        type="button"
                        onClick={async () => {
                          await reviewFlashcard(flashcard.id, confidence);
                          await refreshStudyState();
                        }}
                        className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-zinc-100"
                      >
                        Mark {confidence}%
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel className="space-y-4">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Review queue</p>
            <ReviewQueuePanel items={reviewState.data} onCompleted={refreshStudyState} />
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
