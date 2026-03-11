"use client";

import type { PracticeQuestion } from "@apmicro/shared-types";
import { PracticeCard } from "@apmicro/ui";
import { useEffect, useMemo, useRef, useState } from "react";

import { graphModuleMap } from "@/components/graphs/graph-module-registry";
import { submitPracticeAttempt } from "@/lib/api";

export function PracticeAttemptPanel({
  question,
  onAttempted,
}: {
  question: PracticeQuestion;
  onAttempted: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState(60);
  const [result, setResult] = useState<{ correct: boolean; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const startedAtRef = useRef(Date.now());

  const graphModule = question.graphInteraction ? graphModuleMap[question.graphInteraction.moduleId] : null;
  const GraphComponent = graphModule?.component;
  const canSubmit = Boolean(answer.trim());

  useEffect(() => {
    setAnswer("");
    setConfidence(60);
    setResult(null);
    setSubmitting(false);
    startedAtRef.current = Date.now();
  }, [question.id]);

  const practiceInteraction = useMemo(() => {
    if (!question.graphInteraction) {
      return undefined;
    }

    return {
      prompt: question.graphInteraction.prompt,
      targetType: question.graphInteraction.targetType,
      targetId: question.graphInteraction.targetId,
      selectedTargetId: answer || null,
      status: result ? (result.correct ? "correct" : "incorrect") : answer ? "selected" : "idle",
      onTargetSelect: async (targetId: string) => {
        if (submitting || result?.correct) {
          return;
        }
        setAnswer(targetId);
        await handleSubmit(targetId);
      },
    } as const;
  }, [answer, question.graphInteraction, result, submitting]);

  async function handleSubmit(nextAnswer?: string) {
    const finalAnswer = (nextAnswer ?? answer).trim();
    if (!finalAnswer) {
      return;
    }
    setSubmitting(true);
    try {
      const attempt = await submitPracticeAttempt({
        questionId: question.id,
        topicId: question.topicId,
        answer: finalAnswer,
        confidence,
        durationSeconds: Math.round((Date.now() - startedAtRef.current) / 1000),
      });
      setResult({
        correct: attempt.correct,
        message: attempt.correct ? "Marked correct and scheduled for later review." : "Marked incorrect and resurfaced in the review queue.",
      });
      onAttempted();
    } catch (error) {
      setResult({
        correct: false,
        message: error instanceof Error ? error.message : "Submit failed",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <PracticeCard question={question} showSolution={false} />
      <div className="rounded-[28px] border border-white/10 bg-black/20 p-4">
        {question.type === "mcq" && question.choices?.length ? (
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Choose one answer</p>
            {question.choices.map((choice, index) => {
              const selected = answer === choice;
              return (
                <button
                  suppressHydrationWarning
                  key={choice}
                  type="button"
                  onClick={() => setAnswer(choice)}
                  className={`w-full rounded-3xl border px-4 py-3 text-left text-sm transition ${
                    selected
                      ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-50"
                      : "border-white/10 bg-white/5 text-zinc-200"
                  }`}
                >
                  <span className="mr-3 text-xs uppercase tracking-[0.22em] text-zinc-500">{String.fromCharCode(65 + index)}</span>
                  {choice}
                </button>
              );
            })}
          </div>
        ) : null}

        {question.type !== "mcq" && !question.graphInteraction ? (
          <label className="block">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
              {question.type === "frq" ? "AP-style response" : "Your answer"}
            </p>
            <textarea
              suppressHydrationWarning
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              rows={question.type === "frq" ? 6 : 4}
              className="mt-3 w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 outline-none"
              placeholder={question.type === "frq" ? "Write the full AP-style explanation." : "Type your answer."}
            />
          </label>
        ) : null}

        {question.graphInteraction && GraphComponent ? (
          <div className="mt-1 space-y-3">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-300">
              Click your answer directly on the graph. This question grades the point or shaded region you select.
            </div>
            <GraphComponent practiceInteraction={practiceInteraction} />
          </div>
        ) : null}

        <label className="mt-4 block">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.22em] text-zinc-500">Confidence</span>
            <span className="text-xs text-cyan-100">{confidence}%</span>
          </div>
          <input
            suppressHydrationWarning
            type="range"
            min={10}
            max={100}
            step={5}
            value={confidence}
            onChange={(event) => setConfidence(Number(event.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-300"
          />
        </label>
        {!question.graphInteraction ? (
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              suppressHydrationWarning
              type="button"
              disabled={submitting || !canSubmit}
              onClick={() => void handleSubmit()}
              className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-50 disabled:opacity-60"
            >
              {submitting ? "Submitting..." : `Submit ${question.type.toUpperCase()}`}
            </button>
            {result ? <p className="text-xs text-zinc-400">{result.message}</p> : null}
          </div>
        ) : result ? (
          <p className="mt-4 text-xs text-zinc-400">{result.message}</p>
        ) : null}

        {result ? (
          <div className={`mt-4 rounded-3xl border p-4 ${result.correct ? "border-emerald-400/20 bg-emerald-500/10" : "border-rose-400/20 bg-rose-500/10"}`}>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">{result.correct ? "Result" : "Review"}</p>
            <p className="mt-3 text-sm leading-6 text-zinc-100">{question.explanation}</p>
            {question.rubric?.length ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">FRQ scoring anchors</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-200">
                  {question.rubric.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {question.graphInteraction ? (
              <p className="mt-4 text-sm text-zinc-200">
                Correct graph target: <span className="font-medium text-white">{question.graphInteraction.targetLabel ?? question.answer}</span>
              </p>
            ) : null}
            {question.trap ? <p className="mt-4 text-xs leading-5 text-rose-100">AP trap: {question.trap}</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
