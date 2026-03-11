"use client";

import { formatNumber, samplePPC } from "@apmicro/graph-engine";
import { useMemo, useState } from "react";

import { GraphModuleShell, type GraphPracticeInteraction } from "./module-shell";

const ppcDomain = {
  xMin: 0,
  xMax: 70,
  yMin: 0,
  yMax: 70,
};

const defaultState = {
  maxX: 58,
  maxY: 62,
  bow: 1.55,
  startX: 18,
  deltaX: 8,
};

function ppcY(maxX: number, maxY: number, bow: number, quantityX: number) {
  const ratio = Math.min(Math.max(quantityX / maxX, 0), 1);
  return maxY * Math.pow(1 - ratio, bow);
}

export function PPCModule({ practiceInteraction }: { practiceInteraction?: GraphPracticeInteraction } = {}) {
  const [state, setState] = useState(defaultState);

  const curve = useMemo(() => samplePPC({ maxX: state.maxX, maxY: state.maxY, bow: state.bow }), [state]);
  const pointAY = ppcY(state.maxX, state.maxY, state.bow, state.startX);
  const pointBX = Math.min(state.startX + state.deltaX, state.maxX - 1);
  const pointBY = ppcY(state.maxX, state.maxY, state.bow, pointBX);
  const lostY = pointAY - pointBY;
  const perUnitCost = lostY / Math.max(pointBX - state.startX, 1);

  function handleTutorCommand(prompt: string) {
    const lower = prompt.toLowerCase();

    if (lower.includes("reset")) {
      setState(defaultState);
      return { response: "I reset the PPC to the baseline production tradeoff." };
    }
    if (lower.includes("more bowed") || lower.includes("increase opportunity cost")) {
      setState((current) => ({ ...current, bow: Math.min(current.bow + 0.15, 2.2) }));
      return { response: "I bowed the PPC out more so the increasing opportunity cost story is stronger." };
    }
    if (lower.includes("straighter") || lower.includes("constant opportunity cost")) {
      setState((current) => ({ ...current, bow: Math.max(current.bow - 0.15, 1.1) }));
      return { response: "I flattened the curvature so the PPC looks closer to constant opportunity cost." };
    }
    if (lower.includes("economic growth") || lower.includes("grow x")) {
      setState((current) => ({ ...current, maxX: Math.min(current.maxX + 4, 66), maxY: Math.min(current.maxY + 4, 66) }));
      return { response: "I expanded the intercepts to simulate growth and a larger attainable set." };
    }
    if (lower.includes("bigger tradeoff") || lower.includes("more x")) {
      setState((current) => ({ ...current, deltaX: Math.min(current.deltaX + 3, 18) }));
      return { response: "I increased the movement from point A to point B so the opportunity-cost calculation is bigger." };
    }

    return { response: "Try asking me to increase opportunity cost, make the PPC straighter, show economic growth, or reset the graph." };
  }

  return (
    <GraphModuleShell
      title="PPC and Opportunity Cost"
      eyebrow="Tradeoff Engine"
      domain={ppcDomain}
      xAxisLabel="Good X"
      yAxisLabel="Good Y"
      curves={[
        {
          id: "ppc",
          label: "PPC",
          color: "#22d3ee",
          points: curve,
          draggable: true,
          anchors: [
            { id: "x-max", label: "X max", x: state.maxX, y: 0 },
            { id: "y-max", label: "Y max", x: 0, y: state.maxY },
          ],
          labelAt: { x: state.maxX * 0.58, y: ppcY(state.maxX, state.maxY, state.bow, state.maxX * 0.58) + 4 },
        },
      ]}
      points={[
        {
          id: "point-a",
          label: "A",
          x: state.startX,
          y: pointAY,
          description: "Current efficient point on the PPC before shifting more resources into Good X.",
          math: `A = (${formatNumber(state.startX)}, ${formatNumber(pointAY)})`,
          intuition: "This is one feasible efficient production mix.",
          color: "#f8fafc",
        },
        {
          id: "point-b",
          label: "B",
          x: pointBX,
          y: pointBY,
          description: "New efficient point after increasing production of Good X.",
          math: `B = (${formatNumber(pointBX)}, ${formatNumber(pointBY)})`,
          intuition: "Moving right means producing more X, but you must give up some Y.",
          color: "#34d399",
        },
        {
          id: "inside",
          label: "Inside",
          x: state.maxX * 0.45,
          y: state.maxY * 0.28,
          description: "A point inside the PPC is attainable but inefficient.",
          math: "Inside the frontier means unused resources or unemployment.",
          intuition: "You can make this combo, but you are leaving some capacity on the table.",
          color: "#f59e0b",
        },
        {
          id: "outside",
          label: "Outside",
          x: state.maxX * 0.82,
          y: state.maxY * 0.76,
          description: "A point outside the PPC is currently unattainable.",
          math: "Outside the frontier exceeds available resources or technology.",
          intuition: "You would need more resources or better technology to get here.",
          color: "#fb7185",
        },
      ]}
      areas={[
        {
          id: "attainable-region",
          label: "Attainable Set",
          fill: "rgba(34,211,238,0.18)",
          description: "Everything on or inside the PPC can be produced with current resources and technology.",
          math: "Any point below the frontier is feasible, but only points on the frontier are productively efficient.",
          intuition: "The shaded space is everything the economy can actually make right now.",
          pointIds: ["point-a", "point-b", "inside"],
          polygon: [{ x: 0, y: 0 }, { x: 0, y: state.maxY }, ...curve, { x: state.maxX, y: 0 }],
        },
      ]}
      legend={[
        { label: "PPC frontier", color: "#22d3ee" },
        { label: "Efficient points", color: "#f8fafc" },
        { label: "Attainable region", color: "#94a3b8" },
      ]}
      sliders={[
        { id: "startX", label: "Starting X output", min: 5, max: 42, step: 1, value: state.startX },
        { id: "deltaX", label: "Extra X units", min: 2, max: 18, step: 1, value: state.deltaX },
        { id: "maxX", label: "X intercept", min: 35, max: 66, step: 1, value: state.maxX },
        { id: "bow", label: "Curve bow", min: 1.1, max: 2.2, step: 0.05, value: state.bow },
      ]}
      onSliderChange={(id, value) => setState((current) => ({ ...current, [id]: value }))}
      onAnchorDrag={(_, anchorId, nextCoordinate) => {
        setState((current) => {
          if (anchorId === "x-max") {
            return { ...current, maxX: Math.max(nextCoordinate.x, 25) };
          }

          return { ...current, maxY: Math.max(nextCoordinate.y, 25) };
        });
      }}
      metrics={[
        { label: "Y given up", value: formatNumber(lostY), note: "Total Y lost when moving from A to B." },
        { label: "Opp cost of X", value: formatNumber(perUnitCost), note: "Y forgone per extra unit of X." },
        { label: "Point A", value: `${formatNumber(state.startX)}, ${formatNumber(pointAY)}`, note: "Starting efficient bundle." },
        { label: "Point B", value: `${formatNumber(pointBX)}, ${formatNumber(pointBY)}`, note: "New efficient bundle after shifting output." },
      ]}
      trapWarnings={[
        "AP often asks for opportunity cost in the reverse direction. Check which good is being sacrificed.",
        "Inside the PPC is attainable but inefficient; outside the PPC is unattainable with current resources.",
      ]}
      tenSecondMeaning="A PPC shows the most you can make and what you give up when you make more of something else."
      whyItMatters="PPC logic powers Unit 1 questions on scarcity, efficiency, comparative advantage, and growth."
      intuition="Because resources are specialized, each extra unit of Good X usually costs more and more Good Y as you move along the curve."
      mathSteps={[
        `1. Read point A on the frontier: (${formatNumber(state.startX)}, ${formatNumber(pointAY)}).`,
        `2. Increase X by ${formatNumber(pointBX - state.startX)} to reach point B: (${formatNumber(pointBX)}, ${formatNumber(pointBY)}).`,
        `3. Opportunity cost in total Y = ${formatNumber(pointAY)} - ${formatNumber(pointBY)} = ${formatNumber(lostY)}.`,
        `4. Per-unit opportunity cost of X = ${formatNumber(lostY)} / ${formatNumber(pointBX - state.startX)} = ${formatNumber(perUnitCost)}.`,
      ]}
      explainLike12="If you use more ovens to bake cookies, you have fewer ovens left to bake muffins. The PPC is the picture of that tradeoff."
      examWording="The opportunity cost of producing one additional unit of Good X is the amount of Good Y that must be forgone."
      focusIdeas={[
        { title: "One move, one tradeoff", body: "Every step right on the PPC means giving up some of the other good.", tag: "10-second meaning" },
        { title: "On vs inside", body: "On the curve is efficient. Inside the curve means you are wasting resources.", tag: "why this matters" },
        { title: "Read direction carefully", body: "If AP asks for the cost of Y in terms of X, flip the ratio.", tag: "AP trap" },
      ]}
      graphTutor={{
        starterPrompts: [
          { label: "More bowed out", prompt: "Increase opportunity cost." },
          { label: "Show growth", prompt: "Show economic growth." },
          { label: "Bigger tradeoff", prompt: "Show a bigger tradeoff from A to B." },
          { label: "Reset", prompt: "Reset the graph." },
        ],
        onCommand: handleTutorCommand,
      }}
      practiceInteraction={practiceInteraction}
    />
  );
}
