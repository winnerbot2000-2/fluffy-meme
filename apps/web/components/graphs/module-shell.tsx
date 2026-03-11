"use client";

import type { GraphPoint, ShadedArea } from "@apmicro/shared-types";
import {
  ADHDQuickMeaning,
  APTrapCard,
  GraphCard,
  GraphLegend,
  SliderPanel,
  WhyItMattersCard,
} from "@apmicro/ui";
import { Bot, Brain, Calculator, Eye, GraduationCap, Landmark, SendHorizonal, Sparkles, Wand2 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { GraphSurface, type CoordinateDomain, type CurveDefinition, type RenderableArea, type RenderablePoint } from "@apmicro/graph-engine";
import { useAppStore } from "@/lib/stores/app-store";
import { ADHDFocusDeck, type FocusIdea } from "../study-mode/adhd-focus-deck";

type Metric = {
  label: string;
  value: string;
  note: string;
};

export type GraphPracticeInteraction = {
  prompt: string;
  targetType: "point" | "area";
  targetId: string;
  selectedTargetId?: string | null;
  status?: "idle" | "selected" | "correct" | "incorrect";
  onTargetSelect?: (targetId: string, targetType: "point" | "area") => void;
};

export type GraphTutorResult = {
  response: string;
};

export type GraphTutorConfig = {
  starterPrompts: Array<{ label: string; prompt: string }>;
  onCommand: (prompt: string) => GraphTutorResult | Promise<GraphTutorResult>;
};

export type GraphOverlayOption = {
  id: string;
  label: string;
  active: boolean;
  accent?: string;
  onToggle: () => void;
};

export function GraphModuleShell({
  title,
  eyebrow,
  domain,
  xAxisLabel,
  yAxisLabel,
  curves,
  points,
  areas,
  legend,
  sliders,
  onSliderChange,
  onAnchorDrag,
  metrics,
  trapWarnings,
  tenSecondMeaning,
  whyItMatters,
  intuition,
  mathSteps,
  explainLike12,
  examWording,
  focusIdeas,
  practiceInteraction,
  graphTutor,
  overlayOptions,
}: {
  title: string;
  eyebrow: string;
  domain: CoordinateDomain;
  xAxisLabel: string;
  yAxisLabel: string;
  curves: CurveDefinition[];
  points: RenderablePoint[];
  areas: RenderableArea[];
  legend: Array<{ label: string; color: string }>;
  sliders: Parameters<typeof SliderPanel>[0]["fields"];
  onSliderChange: (id: string, value: number) => void;
  onAnchorDrag?: (curveId: string, anchorId: string, nextCoordinate: { x: number; y: number }) => void;
  metrics: Metric[];
  trapWarnings: string[];
  tenSecondMeaning: string;
  whyItMatters: string;
  intuition: string;
  mathSteps: string[];
  explainLike12: string;
  examWording: string;
  focusIdeas: FocusIdea[];
  practiceInteraction?: GraphPracticeInteraction;
  graphTutor?: GraphTutorConfig;
  overlayOptions?: GraphOverlayOption[];
}) {
  const studyMode = useAppStore((state) => state.studyMode);
  const globalExplainLike12 = useAppStore((state) => state.explainLike12);
  const globalExamWording = useAppStore((state) => state.examWording);
  const toggleExplainLike12 = useAppStore((state) => state.toggleExplainLike12);
  const toggleExamWording = useAppStore((state) => state.toggleExamWording);

  const [selectedPointId, setSelectedPointId] = useState<string | null>(points[0]?.id ?? null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(areas[0]?.id ?? null);
  const [showMath, setShowMath] = useState(true);
  const [showIntuition, setShowIntuition] = useState(true);
  const [cleanView, setCleanView] = useState(false);
  const [tutorPrompt, setTutorPrompt] = useState("");
  const [tutorMessages, setTutorMessages] = useState<Array<{ id: string; role: "user" | "assistant"; content: string }>>([]);
  const [tutorBusy, setTutorBusy] = useState(false);

  const selectedPoint = useMemo<GraphPoint | null>(
    () => points.find((point) => point.id === selectedPointId) ?? null,
    [points, selectedPointId],
  );
  const selectedArea = useMemo<ShadedArea | null>(
    () => areas.find((area) => area.id === selectedAreaId) ?? null,
    [areas, selectedAreaId],
  );

  useEffect(() => {
    if (selectedPointId && !points.some((point) => point.id === selectedPointId)) {
      setSelectedPointId(points[0]?.id ?? null);
    }
  }, [points, selectedPointId]);

  useEffect(() => {
    if (selectedAreaId && !areas.some((area) => area.id === selectedAreaId)) {
      setSelectedAreaId(areas[0]?.id ?? null);
    }
  }, [areas, selectedAreaId]);

  const inPracticeMode = Boolean(practiceInteraction);
  const renderedCurves = useMemo(
    () =>
      inPracticeMode
        ? curves.map((curve) => ({
            ...curve,
            draggable: false,
            anchors: undefined,
          }))
        : curves,
    [curves, inPracticeMode],
  );

  const practiceStatusMessage =
    practiceInteraction?.status === "correct"
      ? "Correct target selected."
      : practiceInteraction?.status === "incorrect"
        ? "Selected target was incorrect."
        : practiceInteraction?.status === "selected"
          ? "Selection captured. Submit or click again to change it."
          : "Click directly on the graph to answer.";

  const controlRow = (
    <div className="grid w-full gap-2 sm:grid-cols-2 xl:w-[360px]">
      <TogglePill active={showMath} onClick={() => setShowMath((value) => !value)} icon={Calculator}>
        Show me the math
      </TogglePill>
      <TogglePill active={showIntuition} onClick={() => setShowIntuition((value) => !value)} icon={Sparkles}>
        Show me the intuition
      </TogglePill>
      <TogglePill active={globalExplainLike12} onClick={toggleExplainLike12} icon={Brain}>
        Explain like I&apos;m 12
      </TogglePill>
      <TogglePill active={globalExamWording} onClick={toggleExamWording} icon={GraduationCap}>
        Exam wording
      </TogglePill>
      <TogglePill active={cleanView} onClick={() => setCleanView((value) => !value)} icon={Eye}>
        Clean graph view
      </TogglePill>
    </div>
  );

  const focusRail =
    inPracticeMode ? (
      <div className="grid gap-4">
        <div className="rounded-[28px] border border-cyan-300/20 bg-cyan-300/8 p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/80">Graph response mode</p>
          <p className="mt-3 text-base font-medium text-white">{practiceInteraction?.prompt}</p>
          <p className="mt-3 text-sm leading-6 text-zinc-300">{practiceStatusMessage}</p>
        </div>
      </div>
    ) : studyMode === "adhd" ? (
      <div className="grid gap-4">
        <ADHDQuickMeaning meaning={tenSecondMeaning} trap={trapWarnings[0] ?? "Watch the labels and units."} />
        <WhyItMattersCard message={whyItMatters} />
        <ADHDFocusDeck ideas={focusIdeas} />
      </div>
    ) : (
      <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Selected on graph</p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Point</p>
            {selectedPoint ? (
              <>
                <p className="mt-2 text-sm font-medium text-white">{selectedPoint.label}</p>
                <p className="mt-2 text-sm leading-5 text-zinc-300">{selectedPoint.description}</p>
                <p className="mt-2 text-xs text-cyan-100">{selectedPoint.math}</p>
              </>
            ) : (
              <p className="mt-2 text-sm leading-5 text-zinc-500">Click a graph point to inspect it.</p>
            )}
          </div>
          <div className="border-t border-white/10 pt-4 md:border-l md:border-t-0 md:pl-4 md:pt-0">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Area</p>
            {selectedArea ? (
              <>
                <p className="mt-2 text-sm font-medium text-white">{selectedArea.label}</p>
                <p className="mt-2 text-sm leading-5 text-zinc-300">{selectedArea.description}</p>
                <p className="mt-2 text-xs text-cyan-100">{selectedArea.math}</p>
              </>
            ) : (
              <p className="mt-2 text-sm leading-5 text-zinc-500">Click a shaded region to inspect it.</p>
            )}
          </div>
        </div>
      </div>
    );

  async function handleTutorCommand(prompt: string) {
    if (!graphTutor || !prompt.trim()) {
      return;
    }

    const userMessage = { id: `user-${crypto.randomUUID()}`, role: "user" as const, content: prompt.trim() };
    setTutorMessages((current) => [...current, userMessage]);
    setTutorBusy(true);
    setTutorPrompt("");

    try {
      const result = await graphTutor.onCommand(prompt.trim());
      setTutorMessages((current) => [
        ...current,
        { id: `assistant-${crypto.randomUUID()}`, role: "assistant", content: result.response },
      ]);
    } finally {
      setTutorBusy(false);
    }
  }

  const tutorRail = graphTutor ? (
    <div className="rounded-[28px] border border-cyan-300/15 bg-cyan-300/8 p-5">
      <div className="flex items-center gap-2 text-cyan-100/80">
        <Bot className="h-4 w-4" />
        <p className="text-xs uppercase tracking-[0.22em]">Graph tutor</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-zinc-100">
        Ask for a graph change, a cleaner scenario, or a targeted AP explanation. The tutor can change the graph state directly.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {graphTutor.starterPrompts.map((item) => (
          <button
            suppressHydrationWarning
            key={item.label}
            type="button"
            onClick={() => void handleTutorCommand(item.prompt)}
            className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-100"
          >
            <Wand2 className="mr-2 inline h-3.5 w-3.5" />
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-4 max-h-44 space-y-3 overflow-y-auto rounded-[24px] border border-white/10 bg-black/20 p-4">
        {tutorMessages.length ? (
          tutorMessages.map((message) => (
            <div key={message.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">{message.role}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-200">{message.content}</p>
            </div>
          ))
        ) : (
          <p className="text-sm leading-6 text-zinc-400">Try “increase demand”, “raise the tax”, “show bigger DWL”, or “reset the graph”.</p>
        )}
      </div>
      <div className="mt-4 space-y-3">
        <textarea
          suppressHydrationWarning
          value={tutorPrompt}
          onChange={(event) => setTutorPrompt(event.target.value)}
          rows={3}
          className="w-full rounded-[24px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-100 outline-none"
          placeholder="Ask the tutor to shift curves, change a policy wedge, or explain the current graph."
        />
        <button
          suppressHydrationWarning
          type="button"
          disabled={tutorBusy || !tutorPrompt.trim()}
          onClick={() => void handleTutorCommand(tutorPrompt)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50 disabled:opacity-60"
        >
          <SendHorizonal className="h-4 w-4" />
          {tutorBusy ? "Updating graph..." : "Ask graph tutor"}
        </button>
      </div>
    </div>
  ) : null;

  const overlayRail =
    overlayOptions && overlayOptions.length > 0 ? (
      <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Layer in AP ideas</p>
            <p className="mt-1 text-xs leading-5 text-zinc-400">Add surplus, benchmarks, and policy views without crowding the graph.</p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-400">
            {overlayOptions.filter((option) => option.active).length}/{overlayOptions.length}
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {overlayOptions.map((option) => (
            <button
              suppressHydrationWarning
              key={option.id}
              type="button"
              onClick={option.onToggle}
              className={`inline-flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 text-left text-xs transition ${
                option.active
                  ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-50"
                  : "border-white/10 bg-white/5 text-zinc-300"
              }`}
            >
              <span>{option.label}</span>
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: option.active ? option.accent ?? "#67e8f9" : "rgba(161,161,170,0.5)" }}
              />
            </button>
          ))}
        </div>
      </div>
    ) : null;

  const explanationSections = [
    showMath
      ? {
          id: "math",
          icon: Calculator,
          title: "Show me the math",
          content: (
            <ol className="space-y-2 text-sm leading-6 text-zinc-200">
              {mathSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          ),
        }
      : null,
    showIntuition
      ? {
          id: "intuition",
          icon: Sparkles,
          title: "Show me the intuition",
          content: <p className="text-sm leading-6 text-zinc-200">{intuition}</p>,
        }
      : null,
    globalExplainLike12
      ? {
          id: "eli12",
          icon: Brain,
          title: "Explain like I'm 12",
          content: <p className="text-sm leading-6 text-zinc-200">{explainLike12}</p>,
        }
      : null,
    globalExamWording
      ? {
          id: "exam",
          icon: Landmark,
          title: "Exam wording",
          content: <p className="text-sm leading-6 text-zinc-200">{examWording}</p>,
        }
      : null,
  ].filter(Boolean) as Array<{
    id: string;
    icon: typeof Calculator;
    title: string;
    content: ReactNode;
  }>;

  const explanationRail =
    explanationSections.length > 0 ? (
      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/20">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Quick explainers</p>
        </div>
        <div className="grid gap-px bg-white/10 md:grid-cols-2">
          {explanationSections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.id} className="space-y-3 bg-black/20 px-4 py-4">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Icon className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-[0.22em]">{section.title}</p>
                </div>
                {section.content}
              </div>
            );
          })}
        </div>
      </div>
    ) : null;

  return (
    <GraphCard title={title} eyebrow={eyebrow} controls={controlRow}>
      <div className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_332px]">
          <div className="space-y-4">
            <div className={studyMode === "adhd" ? "xl:sticky xl:top-5" : undefined}>
              <GraphSurface
                domain={domain}
                xAxisLabel={xAxisLabel}
                yAxisLabel={yAxisLabel}
                curves={renderedCurves}
                points={points}
                areas={areas}
                selectedPointId={selectedPointId}
                selectedAreaId={selectedAreaId}
                onPointSelect={(pointId) => {
                  setSelectedPointId(pointId);
                  if (practiceInteraction?.targetType === "point") {
                    practiceInteraction.onTargetSelect?.(pointId, "point");
                  }
                }}
                onAreaSelect={(areaId) => {
                  setSelectedAreaId(areaId);
                  if (practiceInteraction?.targetType === "area") {
                    practiceInteraction.onTargetSelect?.(areaId, "area");
                  }
                }}
                onAnchorDrag={inPracticeMode ? undefined : onAnchorDrag}
              />
            </div>

            {!cleanView ? (
              <>
                <GraphLegend items={legend} />
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
                  {metrics.map((metric) => (
                    <div key={metric.label} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{metric.label}</p>
                      <p className="mt-2 text-2xl font-medium text-white">{metric.value}</p>
                      <p className="mt-2 text-xs leading-5 text-zinc-400">{metric.note}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {!cleanView ? (
            <div className="space-y-3">
              {!inPracticeMode ? <SliderPanel title="Adjust the graph" fields={sliders} onChange={onSliderChange} /> : null}
              {overlayRail}
              {tutorRail}
            </div>
          ) : null}
        </div>

        {!cleanView ? (
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            {explanationRail}
            {focusRail}
          </div>
        ) : null}
      </div>

      {!cleanView ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {trapWarnings.map((warning) => (
            <APTrapCard key={warning} trap={warning} />
          ))}
        </div>
      ) : null}
    </GraphCard>
  );
}

function TogglePill({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Calculator;
  children: ReactNode;
}) {
  return (
    <button
      suppressHydrationWarning
      type="button"
      onClick={onClick}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-xs transition ${
        active
          ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-50"
          : "border-white/10 bg-white/6 text-zinc-300"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{children}</span>
    </button>
  );
}
