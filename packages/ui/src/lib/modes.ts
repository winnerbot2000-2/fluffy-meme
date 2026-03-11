import type { StudyMode } from "@apmicro/shared-types";

export const studyModeLabels: Record<StudyMode, string> = {
  standard: "Standard",
  adhd: "ADHD",
  visual: "Visual",
  exam: "Exam",
  tutor: "Tutor",
  "speed-review": "Speed",
};

export const studyModeDescriptions: Record<StudyMode, string> = {
  standard: "Full explanations with formulas, examples, and AP phrasing.",
  adhd: "One idea at a time, compressed cards, and fast scan cues.",
  visual: "Graph-first layout with minimal text and stronger visual emphasis.",
  exam: "Timer-aware drill language and AP exam framing.",
  tutor: "Hinted, adaptive explanation space with graph help hooks.",
  "speed-review": "Dense summaries, rapid graph review, and high-yield traps.",
};
