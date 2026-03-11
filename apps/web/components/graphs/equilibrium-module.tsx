"use client";

import { formatCurrency, formatNumber, triangleArea, trianglePolygon } from "@apmicro/graph-engine";
import { useState } from "react";

import { GraphModuleShell, type GraphPracticeInteraction } from "./module-shell";
import {
  buildDemandCurve,
  buildMarketAnchors,
  buildSupplyCurve,
  demandPrice,
  getCompetitiveEquilibrium,
  marketDomain,
  marketSummaryMath,
} from "./helpers";

const defaultState = {
  demandIntercept: 20,
  demandSlope: 0.24,
  supplyIntercept: 3,
  supplySlope: 0.14,
};

export function EquilibriumModule({ practiceInteraction }: { practiceInteraction?: GraphPracticeInteraction } = {}) {
  const [state, setState] = useState(defaultState);
  const [overlays, setOverlays] = useState({
    consumerSurplus: true,
    producerSurplus: true,
  });

  const equilibrium = getCompetitiveEquilibrium(state);
  const consumerSurplus = triangleArea(equilibrium.x, state.demandIntercept - equilibrium.y);
  const producerSurplus = triangleArea(equilibrium.x, equilibrium.y - state.supplyIntercept);
  const anchors = buildMarketAnchors(state);
  const summary = marketSummaryMath({
    equilibriumQuantity: equilibrium.x,
    equilibriumPrice: equilibrium.y,
    demandIntercept: state.demandIntercept,
    supplyIntercept: state.supplyIntercept,
  });

  function handleTutorCommand(prompt: string) {
    const lower = prompt.toLowerCase();

    if (lower.includes("reset")) {
      setState(defaultState);
      return { response: "I reset the market to the baseline competitive equilibrium setup." };
    }
    if (lower.includes("increase demand") || lower.includes("shift demand right")) {
      setState((current) => ({ ...current, demandIntercept: Math.min(current.demandIntercept + 2, 24) }));
      return { response: "I shifted demand right by raising the demand intercept. Watch both equilibrium price and quantity move up." };
    }
    if (lower.includes("decrease demand") || lower.includes("shift demand left")) {
      setState((current) => ({ ...current, demandIntercept: Math.max(current.demandIntercept - 2, 10) }));
      return { response: "I shifted demand left. The new intersection should lower both equilibrium price and quantity." };
    }
    if (lower.includes("increase supply") || lower.includes("shift supply right")) {
      setState((current) => ({ ...current, supplyIntercept: Math.max(current.supplyIntercept - 1.5, 0) }));
      return { response: "I shifted supply right by lowering the supply intercept. Quantity rises while price falls." };
    }
    if (lower.includes("decrease supply") || lower.includes("shift supply left")) {
      setState((current) => ({ ...current, supplyIntercept: Math.min(current.supplyIntercept + 1.5, 12) }));
      return { response: "I shifted supply left. That should push price up and quantity down." };
    }
    if (lower.includes("less elastic demand") || lower.includes("steepen demand")) {
      setState((current) => ({ ...current, demandSlope: Math.min(current.demandSlope + 0.05, 0.5) }));
      return { response: "I made demand steeper, which means demand is less elastic around the equilibrium." };
    }
    if (lower.includes("more elastic supply") || lower.includes("flatten supply")) {
      setState((current) => ({ ...current, supplySlope: Math.max(current.supplySlope - 0.03, 0.08) }));
      return { response: "I flattened supply to make it more elastic. Compare how the intersection shifts visually." };
    }

    return { response: "Try asking me to increase demand, decrease supply, steepen demand, flatten supply, or reset the graph." };
  }

  return (
    <GraphModuleShell
      title="Supply and Demand Equilibrium"
      eyebrow="Competitive Market Core"
      domain={marketDomain}
      xAxisLabel="Quantity"
      yAxisLabel="Price"
      curves={[
        {
          id: "demand",
          label: "Demand",
          color: "#38bdf8",
          points: buildDemandCurve(state.demandIntercept, state.demandSlope),
          draggable: true,
          anchors: anchors.demand,
          labelAt: { x: 46, y: demandPrice(state.demandIntercept, state.demandSlope, 46) + 0.5 },
        },
        {
          id: "supply",
          label: "Supply",
          color: "#f59e0b",
          points: buildSupplyCurve(state.supplyIntercept, state.supplySlope),
          draggable: true,
          anchors: anchors.supply,
          labelAt: { x: 46, y: state.supplyIntercept + state.supplySlope * 46 + 0.9 },
        },
      ]}
      points={[
        {
          id: "equilibrium",
          label: "E",
          x: equilibrium.x,
          y: equilibrium.y,
          description: "The market-clearing point where quantity demanded equals quantity supplied.",
          math: `Q* = ${formatNumber(equilibrium.x)}, P* = ${formatNumber(equilibrium.y)}`,
          intuition: "This is the price where buyers and sellers agree on the same quantity.",
          color: "#f8fafc",
        },
        {
          id: "demand-intercept",
          label: "D-int",
          x: 0,
          y: state.demandIntercept,
          description: "Maximum willingness to pay at zero quantity.",
          math: `Price intercept = ${formatNumber(state.demandIntercept)}`,
          intuition: "It shows how high demand starts before quantity increases.",
          color: "#38bdf8",
        },
        {
          id: "supply-intercept",
          label: "S-int",
          x: 0,
          y: state.supplyIntercept,
          description: "Starting price needed to begin supplying the good.",
          math: `Price intercept = ${formatNumber(state.supplyIntercept)}`,
          intuition: "It shows the producer side starting point before more units are supplied.",
          color: "#f59e0b",
        },
      ]}
      areas={[
        ...(overlays.consumerSurplus
          ? [
              {
                id: "consumer-surplus",
                label: "Consumer Surplus",
                fill: "rgba(56,189,248,0.3)",
                description: "Extra benefit buyers receive because many were willing to pay more than equilibrium price.",
                math: `0.5 x ${formatNumber(equilibrium.x)} x (${formatNumber(state.demandIntercept)} - ${formatNumber(equilibrium.y)}) = ${formatCurrency(consumerSurplus)}`,
                intuition: "This is the blue triangle of good deals buyers got.",
                pointIds: ["demand-intercept", "equilibrium"],
                polygon: trianglePolygon(
                  { x: 0, y: state.demandIntercept },
                  { x: equilibrium.x, y: equilibrium.y },
                  { x: 0, y: equilibrium.y },
                ),
              },
            ]
          : []),
        ...(overlays.producerSurplus
          ? [
              {
                id: "producer-surplus",
                label: "Producer Surplus",
                fill: "rgba(245,158,11,0.28)",
                description: "Extra benefit sellers receive because many units were sold above the minimum acceptable price.",
                math: `0.5 x ${formatNumber(equilibrium.x)} x (${formatNumber(equilibrium.y)} - ${formatNumber(state.supplyIntercept)}) = ${formatCurrency(producerSurplus)}`,
                intuition: "This is the orange triangle of gains sellers keep above their minimum.",
                pointIds: ["supply-intercept", "equilibrium"],
                polygon: trianglePolygon(
                  { x: 0, y: state.supplyIntercept },
                  { x: equilibrium.x, y: equilibrium.y },
                  { x: 0, y: equilibrium.y },
                ),
              },
            ]
          : []),
      ]}
      legend={[
        { label: "Demand", color: "#38bdf8" },
        { label: "Supply", color: "#f59e0b" },
        { label: "Surplus regions", color: "#cbd5e1" },
      ]}
      sliders={[
        { id: "demandIntercept", label: "Demand intercept", min: 10, max: 24, step: 0.5, value: state.demandIntercept },
        { id: "demandSlope", label: "Demand slope", min: 0.1, max: 0.5, step: 0.01, value: state.demandSlope },
        { id: "supplyIntercept", label: "Supply intercept", min: 0, max: 12, step: 0.5, value: state.supplyIntercept },
        { id: "supplySlope", label: "Supply slope", min: 0.08, max: 0.32, step: 0.01, value: state.supplySlope },
      ]}
      onSliderChange={(id, value) => setState((current) => ({ ...current, [id]: value }))}
      onAnchorDrag={(curveId, anchorId, nextCoordinate) => {
        setState((current) => {
          if (curveId === "demand") {
            if (anchorId === "intercept") {
              return { ...current, demandIntercept: Math.max(nextCoordinate.y, 6) };
            }

            return {
              ...current,
              demandSlope: Math.max((current.demandIntercept - nextCoordinate.y) / Math.max(nextCoordinate.x, 4), 0.04),
            };
          }

          if (anchorId === "intercept") {
            return { ...current, supplyIntercept: Math.max(nextCoordinate.y, 0) };
          }

          return {
            ...current,
            supplySlope: Math.max((nextCoordinate.y - current.supplyIntercept) / Math.max(nextCoordinate.x, 4), 0.04),
          };
        });
      }}
      metrics={[
        { label: "Equilibrium price", value: formatCurrency(equilibrium.y), note: "Solve by setting demand equal to supply." },
        { label: "Equilibrium quantity", value: formatNumber(equilibrium.x), note: "This is the market-clearing output." },
        { label: "Consumer surplus", value: summary.prettyConsumerSurplus, note: "Blue triangle above price and below demand." },
        { label: "Producer surplus", value: summary.prettyProducerSurplus, note: "Orange triangle below price and above supply." },
      ]}
      trapWarnings={[
        "Do not confuse a shift in demand with a movement along the demand curve.",
        "Equilibrium is where Qd = Qs, not where one curve touches an axis.",
      ]}
      tenSecondMeaning="Equilibrium is the one price where buyers want exactly what sellers want to sell."
      whyItMatters="This is the base graph for nearly every AP Micro policy intervention and surplus question."
      intuition="If price is above equilibrium, too much is supplied. If price is below equilibrium, too much is demanded. The market pressure pushes back toward the intersection."
      mathSteps={[
        `1. Set demand equal to supply: ${formatNumber(state.demandIntercept)} - ${formatNumber(state.demandSlope)}Q = ${formatNumber(state.supplyIntercept)} + ${formatNumber(state.supplySlope)}Q.`,
        `2. Solve for quantity: Q* = (${formatNumber(state.demandIntercept)} - ${formatNumber(state.supplyIntercept)}) / (${formatNumber(state.demandSlope)} + ${formatNumber(state.supplySlope)}) = ${formatNumber(equilibrium.x)}.`,
        `3. Plug ${formatNumber(equilibrium.x)} into either curve to get P* = ${formatNumber(equilibrium.y)}.`,
        `4. Consumer surplus = ${summary.prettyConsumerSurplus}, producer surplus = ${summary.prettyProducerSurplus}, total surplus = ${summary.prettyTotalSurplus}.`,
      ]}
      explainLike12="Think of a buyer line and a seller line arguing over price. The crossing point is the one number both sides can live with."
      examWording="In a competitive market, the equilibrium price and quantity occur where quantity demanded equals quantity supplied."
      focusIdeas={[
        { title: "Start at the intersection", body: "The crossing point is always your first stop on a market graph.", tag: "10-second meaning" },
        { title: "Above equilibrium", body: "Sellers bring more than buyers want. That is a surplus, so price falls.", tag: "why price changes" },
        { title: "Below equilibrium", body: "Buyers want more than sellers offer. That is a shortage, so price rises.", tag: "why price changes" },
      ]}
      graphTutor={{
        starterPrompts: [
          { label: "Increase demand", prompt: "Increase demand." },
          { label: "Decrease supply", prompt: "Decrease supply." },
          { label: "Steepen demand", prompt: "Make demand less elastic." },
          { label: "Reset", prompt: "Reset the graph." },
        ],
        onCommand: handleTutorCommand,
      }}
      overlayOptions={[
        {
          id: "consumer-surplus",
          label: "Show consumer surplus",
          active: overlays.consumerSurplus,
          accent: "#38bdf8",
          onToggle: () => setOverlays((current) => ({ ...current, consumerSurplus: !current.consumerSurplus })),
        },
        {
          id: "producer-surplus",
          label: "Show producer surplus",
          active: overlays.producerSurplus,
          accent: "#f59e0b",
          onToggle: () => setOverlays((current) => ({ ...current, producerSurplus: !current.producerSurplus })),
        },
      ]}
      practiceInteraction={practiceInteraction}
    />
  );
}
