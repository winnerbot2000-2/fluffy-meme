import type { PracticeQuestion } from "@apmicro/shared-types";

import { GlassPanel } from "./glass-panel";

export function PracticeCard({
  question,
  showSolution = true,
}: {
  question: PracticeQuestion;
  showSolution?: boolean;
}) {
  return (
    <GlassPanel className="h-full">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{question.type}</p>
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-100/90">
              {question.origin ?? "ap-like"}
            </span>
          </div>
          <h3 className="mt-2 text-lg font-medium text-white">{question.stem}</h3>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">{question.difficulty}</span>
      </div>
      {question.prompt ? <p className="mt-4 text-sm leading-6 text-zinc-300">{question.prompt}</p> : null}
      {question.choices?.length ? (
        <div className="mt-4 grid gap-2">
          {question.choices.map((choice, index) => (
            <div key={choice} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200">
              {String.fromCharCode(65 + index)}. {choice}
            </div>
          ))}
        </div>
      ) : null}
      {showSolution ? (
        <>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Answer</p>
            <p className="mt-2 text-sm leading-6 text-zinc-100">
              {question.graphInteraction?.targetLabel ?? question.answer}
            </p>
          </div>
          <p className="mt-4 text-sm leading-6 text-zinc-400">{question.explanation}</p>
          {question.rubric?.length ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">FRQ rubric anchors</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-200">
                {question.rubric.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {question.trap ? <p className="mt-3 text-xs leading-5 text-rose-100">AP trap: {question.trap}</p> : null}
        </>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
          Submit your response to reveal the answer, rubric, and AP trap.
        </div>
      )}
    </GlassPanel>
  );
}
