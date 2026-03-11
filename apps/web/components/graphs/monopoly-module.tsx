"use client";

import { formatCurrency, formatNumber, rectanglePolygon, trianglePolygon } from "@apmicro/graph-engine";
import { useMemo, useState } from "react";

import { GraphModuleShell, type GraphPracticeInteraction } from "./module-shell";

const monopolyDomain = {
  xMin: 0,
  xMax: 60,
  yMin: 0,
  yMax: 32,
};

function demandPrice(intercept: number, slope: number, quantity: number) {
  return intercept - slope * quantity;
}

function mrPrice(intercept: number, slope: number, quantity: number) {
  return intercept - 2 * slope * quantity;
}

function mcPrice(intercept: number, slope: number, quantity: number) {
  return intercept + slope * quantity;
}

function atcPrice(floor: number, curvature: number, quantity: number) {
  return floor + curvature * Math.pow(quantity - 28, 2) / 110;
}

function sampleCurve(domain: typeof monopolyDomain, fn: (quantity: number) => number, steps = 40) {
  return Array.from({ length: steps }, (_, index) => {
    const quantity = domain.xMin + ((domain.xMax - domain.xMin) * index) / (steps - 1);
    return { x: quantity, y: fn(quantity) };
  });
}

const defaultState = {
  demandIntercept: 28,
  demandSlope: 0.24,
  mcIntercept: 4,
  mcSlope: 0.16,
  atcFloor: 10,
  atcCurvature: 0.6,
};

export function MonopolyModule({ practiceInteraction }: { practiceInteraction?: GraphPracticeInteraction } = {}) {
  const [state, setState] = useState(defaultState);
  const [overlays, setOverlays] = useState({
    consumerSurplus: false,
  });

  const monopolyQuantity = (state.demandIntercept - state.mcIntercept) / (2 * state.demandSlope + state.mcSlope);
  const monopolyPrice = demandPrice(state.demandIntercept, state.demandSlope, monopolyQuantity);
  const efficientQuantity = (state.demandIntercept - state.mcIntercept) / (state.demandSlope + state.mcSlope);
  const efficientPrice = demandPrice(state.demandIntercept, state.demandSlope, efficientQuantity);
  const atcAtMonopoly = atcPrice(state.atcFloor, state.atcCurvature, monopolyQuantity);
  const profit = Math.max(monopolyPrice - atcAtMonopoly, 0) * monopolyQuantity;
  const profitPerUnit = monopolyPrice - atcAtMonopoly;
  const dwl = 0.5 * (efficientQuantity - monopolyQuantity) * (monopolyPrice - mcPrice(state.mcIntercept, state.mcSlope, monopolyQuantity));
  const consumerSurplus = 0.5 * monopolyQuantity * (state.demandIntercept - monopolyPrice);

  function handleTutorCommand(prompt: string) {
    const lower = prompt.toLowerCase();

    if (lower.includes("reset")) {
      setState(defaultState);
      return { response: "I reset the monopoly graph to the baseline setup." };
    }
    if (lower.includes("bigger dwl") || lower.includes("less efficient monopoly")) {
      setState((current) => ({
        ...current,
        demandIntercept: Math.min(current.demandIntercept + 2, 32),
        mcIntercept: Math.max(current.mcIntercept - 1, 2),
      }));
      return { response: "I widened the monopoly distortion so the deadweight-loss triangle gets larger." };
    }
    if (lower.includes("higher cost") || lower.includes("raise mc") || lower.includes("raise cost")) {
      setState((current) => ({ ...current, mcIntercept: Math.min(current.mcIntercept + 1.5, 10), atcFloor: Math.min(current.atcFloor + 1, 14) }));
      return { response: "I increased marginal and average costs. Check what happens to the profit rectangle." };
    }
    if (lower.includes("more profit") || lower.includes("lower cost")) {
      setState((current) => ({ ...current, mcIntercept: Math.max(current.mcIntercept - 1, 2), atcFloor: Math.max(current.atcFloor - 1, 6) }));
      return { response: "I lowered costs so monopoly profit should expand if price stays above ATC." };
    }
    if (lower.includes("steepen demand") || lower.includes("less elastic demand")) {
      setState((current) => ({ ...current, demandSlope: Math.min(current.demandSlope + 0.04, 0.4) }));
      return { response: "I made demand steeper so the monopolist faces a less elastic market." };
    }

    return { response: "Try asking me to show bigger DWL, raise costs, lower costs, steepen demand, or reset the graph." };
  }

  const curves = useMemo(
    () => [
      {
        id: "demand",
        label: "Demand",
        color: "#38bdf8",
        points: sampleCurve(monopolyDomain, (q) => demandPrice(state.demandIntercept, state.demandSlope, q)),
        draggable: true,
        anchors: [
          { id: "intercept", label: "D0", x: 0, y: state.demandIntercept },
          { id: "slope", label: "D1", x: 36, y: demandPrice(state.demandIntercept, state.demandSlope, 36) },
        ],
        labelAt: { x: 40, y: demandPrice(state.demandIntercept, state.demandSlope, 40) + 1 },
      },
      {
        id: "mr",
        label: "MR",
        color: "#0ea5e9",
        points: sampleCurve(monopolyDomain, (q) => mrPrice(state.demandIntercept, state.demandSlope, q)),
        dashed: true,
        labelAt: { x: 20, y: mrPrice(state.demandIntercept, state.demandSlope, 20) - 1 },
      },
      {
        id: "mc",
        label: "MC",
        color: "#f59e0b",
        points: sampleCurve(monopolyDomain, (q) => mcPrice(state.mcIntercept, state.mcSlope, q)),
        draggable: true,
        anchors: [
          { id: "intercept", label: "MC0", x: 0, y: state.mcIntercept },
          { id: "slope", label: "MC1", x: 36, y: mcPrice(state.mcIntercept, state.mcSlope, 36) },
        ],
        labelAt: { x: 44, y: mcPrice(state.mcIntercept, state.mcSlope, 44) + 1 },
      },
      {
        id: "atc",
        label: "ATC",
        color: "#a78bfa",
        points: sampleCurve(monopolyDomain, (q) => atcPrice(state.atcFloor, state.atcCurvature, q)),
        labelAt: { x: 39, y: atcPrice(state.atcFloor, state.atcCurvature, 39) + 1.2 },
      },
    ],
    [state],
  );

  return (
    <GraphModuleShell
      title="Monopoly Profit and Deadweight Loss"
      eyebrow="Imperfect Competition"
      domain={monopolyDomain}
      xAxisLabel="Quantity"
      yAxisLabel="Price / Cost / Revenue"
      curves={curves}
      points={[
        {
          id: "monopoly-point",
          label: "Qm, Pm",
          x: monopolyQuantity,
          y: monopolyPrice,
          description: "Profit-maximizing monopoly outcome. Quantity comes from MR = MC and price comes from demand.",
          math: `Qm = ${formatNumber(monopolyQuantity)}, Pm = ${formatNumber(monopolyPrice)}`,
          intuition: "The monopolist first chooses the output where selling one more unit stops helping profit, then reads price from demand.",
          color: "#f8fafc",
        },
        {
          id: "efficient-point",
          label: "Qe",
          x: efficientQuantity,
          y: efficientPrice,
          description: "Allocatively efficient outcome where price equals marginal cost.",
          math: `Qe = ${formatNumber(efficientQuantity)}, Pe = ${formatNumber(efficientPrice)}`,
          intuition: "This is the socially efficient quantity that a monopoly does not reach.",
          color: "#34d399",
        },
        {
          id: "atc-point",
          label: "ATC@Qm",
          x: monopolyQuantity,
          y: atcAtMonopoly,
          description: "Average total cost at the monopoly quantity, used to compute profit.",
          math: `ATC(Qm) = ${formatNumber(atcAtMonopoly)}`,
          intuition: "This is the firm's cost per unit at the chosen output.",
          color: "#a78bfa",
        },
      ]}
      areas={[
        {
          id: "profit-rectangle",
          label: "Profit",
          fill: "rgba(34,197,94,0.26)",
          description: "Profit equals the difference between price and ATC times quantity.",
          math: `(${formatNumber(monopolyPrice)} - ${formatNumber(atcAtMonopoly)}) x ${formatNumber(monopolyQuantity)} = ${formatCurrency(profit)}`,
          intuition: "The green rectangle is how much profit the monopolist earns after covering total cost.",
          pointIds: ["monopoly-point", "atc-point"],
          polygon: rectanglePolygon(0, monopolyPrice, monopolyQuantity, atcAtMonopoly),
        },
        {
          id: "monopoly-dwl",
          label: "Deadweight Loss",
          fill: "rgba(244,114,182,0.26)",
          description: "The monopoly produces too little, so some valuable trades never happen.",
          math: `0.5 x (${formatNumber(efficientQuantity)} - ${formatNumber(monopolyQuantity)}) x (${formatNumber(monopolyPrice)} - ${formatNumber(mcPrice(state.mcIntercept, state.mcSlope, monopolyQuantity))}) = ${formatCurrency(dwl)}`,
          intuition: "This pink triangle is the value of trades lost because the monopolist restricts output.",
          pointIds: ["monopoly-point", "efficient-point"],
          polygon: trianglePolygon(
            { x: monopolyQuantity, y: monopolyPrice },
            { x: monopolyQuantity, y: mcPrice(state.mcIntercept, state.mcSlope, monopolyQuantity) },
            { x: efficientQuantity, y: efficientPrice },
          ),
        },
        ...(overlays.consumerSurplus
          ? [
              {
                id: "monopoly-consumer-surplus",
                label: "Consumer Surplus Under Monopoly",
                fill: "rgba(56,189,248,0.2)",
                description: "Buyer surplus that remains when the monopolist charges Pm and only sells Qm.",
                math: `0.5 x ${formatNumber(monopolyQuantity)} x (${formatNumber(state.demandIntercept)} - ${formatNumber(monopolyPrice)}) = ${formatCurrency(consumerSurplus)}`,
                intuition: "This blue triangle is the consumer surplus left after the monopolist raises price and restricts output.",
                pointIds: ["monopoly-point"],
                polygon: trianglePolygon(
                  { x: 0, y: state.demandIntercept },
                  { x: monopolyQuantity, y: monopolyPrice },
                  { x: 0, y: monopolyPrice },
                ),
              },
            ]
          : []),
      ]}
      legend={[
        { label: "Demand", color: "#38bdf8" },
        { label: "MR", color: "#0ea5e9" },
        { label: "MC", color: "#f59e0b" },
        { label: "ATC", color: "#a78bfa" },
      ]}
      sliders={[
        { id: "demandIntercept", label: "Demand intercept", min: 20, max: 32, step: 0.5, value: state.demandIntercept },
        { id: "mcIntercept", label: "MC intercept", min: 2, max: 10, step: 0.5, value: state.mcIntercept },
        { id: "mcSlope", label: "MC slope", min: 0.08, max: 0.26, step: 0.01, value: state.mcSlope },
        { id: "atcFloor", label: "ATC floor", min: 6, max: 14, step: 0.5, value: state.atcFloor },
      ]}
      onSliderChange={(id, value) => setState((current) => ({ ...current, [id]: value }))}
      onAnchorDrag={(curveId, anchorId, nextCoordinate) => {
        setState((current) => {
          if (curveId === "demand") {
            if (anchorId === "intercept") {
              return { ...current, demandIntercept: Math.max(nextCoordinate.y, 16) };
            }

            return {
              ...current,
              demandSlope: Math.max((current.demandIntercept - nextCoordinate.y) / Math.max(nextCoordinate.x, 4), 0.06),
            };
          }

          if (anchorId === "intercept") {
            return { ...current, mcIntercept: Math.max(nextCoordinate.y, 0) };
          }

          return {
            ...current,
            mcSlope: Math.max((nextCoordinate.y - current.mcIntercept) / Math.max(nextCoordinate.x, 4), 0.04),
          };
        });
      }}
      metrics={[
        { label: "Monopoly quantity", value: formatNumber(monopolyQuantity), note: "Find where MR = MC." },
        { label: "Monopoly price", value: formatCurrency(monopolyPrice), note: "Go up to demand from Qm." },
        { label: "Profit", value: formatCurrency(profit), note: `(${formatNumber(profitPerUnit)} per unit) x Qm.` },
        { label: "DWL", value: formatCurrency(dwl), note: "Efficiency loss from restricted output." },
      ]}
      trapWarnings={[
        "MR = MC gives the monopoly quantity, not the monopoly price.",
        "Profit uses ATC, not MC. Efficient output occurs where demand intersects MC.",
      ]}
      tenSecondMeaning="A monopolist restricts output below the efficient level, charges a higher price, and creates deadweight loss."
      whyItMatters="This graph is one of the highest-frequency AP Micro Unit 4 targets because it combines quantity choice, price reading, profit, and efficiency."
      intuition="The monopolist knows selling more units forces price down, so it stops earlier than a competitive market would."
      mathSteps={[
        `1. Solve MR = MC: ${formatNumber(state.demandIntercept)} - ${formatNumber(2 * state.demandSlope)}Q = ${formatNumber(state.mcIntercept)} + ${formatNumber(state.mcSlope)}Q.`,
        `2. Qm = ${formatNumber(monopolyQuantity)}. Then read price from demand: Pm = ${formatNumber(monopolyPrice)}.`,
        `3. Read ATC at Qm: ${formatNumber(atcAtMonopoly)}. Profit = (${formatNumber(monopolyPrice)} - ${formatNumber(atcAtMonopoly)}) x ${formatNumber(monopolyQuantity)} = ${formatCurrency(profit)}.`,
        `4. Efficient output is where demand = MC, at Qe = ${formatNumber(efficientQuantity)}. DWL = ${formatCurrency(dwl)}.`,
      ]}
      explainLike12="A monopolist is the only seller, so it can hold back some units to keep the price higher."
      examWording="A monopolist maximizes profit by producing the quantity at which marginal revenue equals marginal cost and charging the price on the demand curve at that quantity."
      focusIdeas={[
        { title: "MR = MC first", body: "That equation gives the quantity. Do not stop there.", tag: "10-second meaning" },
        { title: "Then go to demand", body: "The demand curve tells you the monopoly price at that quantity.", tag: "why this matters" },
        { title: "ATC for profit", body: "Use ATC, not MC, when the question asks for profit.", tag: "AP trap" },
      ]}
      graphTutor={{
        starterPrompts: [
          { label: "Bigger DWL", prompt: "Show bigger deadweight loss." },
          { label: "Raise costs", prompt: "Raise costs." },
          { label: "Lower costs", prompt: "Lower costs for more profit." },
          { label: "Reset", prompt: "Reset the graph." },
        ],
        onCommand: handleTutorCommand,
      }}
      overlayOptions={[
        {
          id: "monopoly-consumer-surplus",
          label: "Add consumer surplus",
          active: overlays.consumerSurplus,
          accent: "#38bdf8",
          onToggle: () => setOverlays((current) => ({ ...current, consumerSurplus: !current.consumerSurplus })),
        },
      ]}
      practiceInteraction={practiceInteraction}
    />
  );
}
