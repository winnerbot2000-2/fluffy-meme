"use client";

import { formatCurrency, formatNumber, rectanglePolygon, samplePositiveSlopeLine, triangleArea, trianglePolygon } from "@apmicro/graph-engine";
import { useState } from "react";

import { GraphModuleShell, type GraphPracticeInteraction } from "./module-shell";
import {
  buildDemandCurve,
  buildMarketAnchors,
  buildSupplyCurve,
  demandPrice,
  getCompetitiveEquilibrium,
  getSubsidyOutcome,
  marketDomain,
  supplyPrice,
} from "./helpers";

const defaultState = {
  demandIntercept: 20,
  demandSlope: 0.24,
  supplyIntercept: 3,
  supplySlope: 0.14,
  subsidy: 4,
};

export function SubsidyMarketModule({ practiceInteraction }: { practiceInteraction?: GraphPracticeInteraction } = {}) {
  const [state, setState] = useState(defaultState);
  const [overlays, setOverlays] = useState({
    consumerSurplus: false,
    producerSurplus: false,
  });

  const initial = getCompetitiveEquilibrium(state);
  const afterSubsidy = getSubsidyOutcome(state);
  const subsidyCost = afterSubsidy.subsidyCost;
  const dwl = triangleArea(afterSubsidy.quantity - initial.x, state.subsidy);
  const anchors = buildMarketAnchors(state);
  const consumerSurplus = triangleArea(afterSubsidy.quantity, state.demandIntercept - afterSubsidy.buyerPrice);
  const producerSurplus = triangleArea(afterSubsidy.quantity, afterSubsidy.sellerPrice - state.supplyIntercept);

  function handleTutorCommand(prompt: string) {
    const lower = prompt.toLowerCase();

    if (lower.includes("reset")) {
      setState(defaultState);
      return { response: "I reset the subsidy graph to the baseline state." };
    }
    if (lower.includes("raise subsidy") || lower.includes("bigger subsidy")) {
      setState((current) => ({ ...current, subsidy: Math.min(current.subsidy + 1, 8) }));
      return { response: "I increased the subsidy, so the quantity should move further past the efficient point." };
    }
    if (lower.includes("lower subsidy") || lower.includes("smaller subsidy")) {
      setState((current) => ({ ...current, subsidy: Math.max(current.subsidy - 1, 1) }));
      return { response: "I lowered the subsidy so the market moves closer to the efficient quantity." };
    }
    if (lower.includes("more overproduction") || lower.includes("bigger dwl")) {
      setState((current) => ({ ...current, subsidy: Math.min(current.subsidy + 1.5, 8), supplySlope: Math.max(current.supplySlope - 0.03, 0.08) }));
      return { response: "I increased the subsidy and flattened supply so the overproduction story is more visible." };
    }
    if (lower.includes("help buyers") || lower.includes("lower buyer price")) {
      setState((current) => ({ ...current, demandIntercept: Math.min(current.demandIntercept + 1.5, 24), subsidy: Math.min(current.subsidy + 0.5, 8) }));
      return { response: "I pushed the setup toward a larger buyer-price drop by increasing demand and the subsidy slightly." };
    }

    return { response: "Try asking me to raise the subsidy, lower it, show more overproduction, lower the buyer price, or reset the graph." };
  }

  return (
    <GraphModuleShell
      title="Subsidy on a Competitive Market"
      eyebrow="Policy Wedge"
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
          labelAt: { x: 44, y: demandPrice(state.demandIntercept, state.demandSlope, 44) + 0.8 },
        },
        {
          id: "supply",
          label: "Supply",
          color: "#f59e0b",
          points: buildSupplyCurve(state.supplyIntercept, state.supplySlope),
          draggable: true,
          anchors: anchors.supply,
          labelAt: { x: 43, y: supplyPrice(state.supplyIntercept, state.supplySlope, 43) + 1 },
        },
        {
          id: "supply-subsidy",
          label: "Supply - Subsidy",
          color: "#22c55e",
          points: samplePositiveSlopeLine({
            intercept: state.supplyIntercept - state.subsidy,
            slope: state.supplySlope,
            domain: marketDomain,
          }),
          dashed: true,
          labelAt: { x: 36, y: state.supplyIntercept - state.subsidy + state.supplySlope * 36 + 0.6 },
        },
      ]}
      points={[
        {
          id: "initial-equilibrium",
          label: "E0",
          x: initial.x,
          y: initial.y,
          description: "Original competitive equilibrium before the subsidy.",
          math: `Q0 = ${formatNumber(initial.x)}, P0 = ${formatNumber(initial.y)}`,
          intuition: "This is the efficient market output before government support expands sales.",
          color: "#cbd5e1",
        },
        {
          id: "buyer-price",
          label: "Pb",
          x: afterSubsidy.quantity,
          y: afterSubsidy.buyerPrice,
          description: "Price buyers now pay after the subsidy lowers their effective market price.",
          math: `Pb = ${formatNumber(afterSubsidy.buyerPrice)}`,
          intuition: "Buyers pay less because the subsidy makes it easier for sellers to supply units.",
          color: "#38bdf8",
        },
        {
          id: "seller-price",
          label: "Ps",
          x: afterSubsidy.quantity,
          y: afterSubsidy.sellerPrice,
          description: "Price sellers receive after adding the subsidy wedge to the buyer price.",
          math: `Ps = ${formatNumber(afterSubsidy.sellerPrice)}`,
          intuition: "Sellers receive more than buyers pay because the government makes up the difference.",
          color: "#f59e0b",
        },
      ]}
      areas={[
        {
          id: "subsidy-cost",
          label: "Government Cost",
          fill: "rgba(34,197,94,0.24)",
          description: "The subsidy cost is a rectangle equal to the subsidy per unit times the subsidized quantity.",
          math: `${formatNumber(state.subsidy)} x ${formatNumber(afterSubsidy.quantity)} = ${formatCurrency(subsidyCost)}`,
          intuition: "The government pays the subsidy amount on every unit sold after the policy.",
          pointIds: ["buyer-price", "seller-price"],
          polygon: rectanglePolygon(0, afterSubsidy.sellerPrice, afterSubsidy.quantity, afterSubsidy.buyerPrice),
        },
        {
          id: "subsidy-dwl",
          label: "Deadweight Loss",
          fill: "rgba(244,114,182,0.24)",
          description: "The subsidy pushes quantity beyond the efficient point, creating extra trades whose cost exceeds benefit.",
          math: `0.5 x (${formatNumber(afterSubsidy.quantity)} - ${formatNumber(initial.x)}) x ${formatNumber(state.subsidy)} = ${formatCurrency(dwl)}`,
          intuition: "This triangle captures the overproduction caused by the subsidy.",
          pointIds: ["initial-equilibrium", "buyer-price", "seller-price"],
          polygon: trianglePolygon(
            { x: initial.x, y: initial.y },
            { x: afterSubsidy.quantity, y: afterSubsidy.buyerPrice },
            { x: afterSubsidy.quantity, y: afterSubsidy.sellerPrice },
          ),
        },
        ...(overlays.consumerSurplus
          ? [
              {
                id: "subsidy-consumer-surplus",
                label: "Consumer Surplus After Subsidy",
                fill: "rgba(56,189,248,0.22)",
                description: "Buyer surplus after the subsidy lowers the buyer-facing price and expands quantity.",
                math: `0.5 x ${formatNumber(afterSubsidy.quantity)} x (${formatNumber(state.demandIntercept)} - ${formatNumber(afterSubsidy.buyerPrice)}) = ${formatCurrency(consumerSurplus)}`,
                intuition: "This blue triangle shows the buyer gains that exist after the subsidy.",
                pointIds: ["buyer-price"],
                polygon: trianglePolygon(
                  { x: 0, y: state.demandIntercept },
                  { x: afterSubsidy.quantity, y: afterSubsidy.buyerPrice },
                  { x: 0, y: afterSubsidy.buyerPrice },
                ),
              },
            ]
          : []),
        ...(overlays.producerSurplus
          ? [
              {
                id: "subsidy-producer-surplus",
                label: "Producer Surplus After Subsidy",
                fill: "rgba(245,158,11,0.2)",
                description: "Seller surplus after the subsidy increases the seller-facing price and expands quantity.",
                math: `0.5 x ${formatNumber(afterSubsidy.quantity)} x (${formatNumber(afterSubsidy.sellerPrice)} - ${formatNumber(state.supplyIntercept)}) = ${formatCurrency(producerSurplus)}`,
                intuition: "This orange triangle shows the producer gains after the subsidy.",
                pointIds: ["seller-price"],
                polygon: trianglePolygon(
                  { x: 0, y: state.supplyIntercept },
                  { x: afterSubsidy.quantity, y: afterSubsidy.sellerPrice },
                  { x: 0, y: afterSubsidy.sellerPrice },
                ),
              },
            ]
          : []),
      ]}
      legend={[
        { label: "Demand", color: "#38bdf8" },
        { label: "Supply", color: "#f59e0b" },
        { label: "Supply - subsidy", color: "#22c55e" },
      ]}
      sliders={[
        { id: "subsidy", label: "Per-unit subsidy", min: 1, max: 8, step: 0.5, value: state.subsidy },
        { id: "demandIntercept", label: "Demand intercept", min: 12, max: 24, step: 0.5, value: state.demandIntercept },
        { id: "supplyIntercept", label: "Supply intercept", min: 0, max: 10, step: 0.5, value: state.supplyIntercept },
        { id: "supplySlope", label: "Supply slope", min: 0.08, max: 0.32, step: 0.01, value: state.supplySlope },
      ]}
      onSliderChange={(id, value) => setState((current) => ({ ...current, [id]: value }))}
      onAnchorDrag={(curveId, anchorId, nextCoordinate) => {
        setState((current) => {
          if (curveId === "demand") {
            if (anchorId === "intercept") {
              return { ...current, demandIntercept: Math.max(nextCoordinate.y, 8) };
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
        { label: "Buyer price", value: formatCurrency(afterSubsidy.buyerPrice), note: "Lower price seen by consumers." },
        { label: "Seller price", value: formatCurrency(afterSubsidy.sellerPrice), note: "Higher effective price received by producers." },
        { label: "Gov cost", value: formatCurrency(subsidyCost), note: "Subsidy x quantity sold after subsidy." },
        { label: "DWL", value: formatCurrency(dwl), note: "Overproduction past the efficient quantity." },
      ]}
      trapWarnings={[
        "A subsidy expands quantity beyond the efficient point, so the DWL triangle sits to the right of the original equilibrium.",
        "The government cost is a rectangle, not the triangle of deadweight loss.",
      ]}
      tenSecondMeaning="A subsidy lowers the buyer price, raises the seller price, increases output, and creates overproduction."
      whyItMatters="This is the mirror image of a tax graph and shows how policy can push output above the efficient quantity."
      intuition="The subsidy acts like a boost for every sale. More trades happen, but some of those extra trades are not worth their resource cost."
      mathSteps={[
        `1. Shift supply down by the subsidy: P = ${formatNumber(state.supplyIntercept - state.subsidy)} + ${formatNumber(state.supplySlope)}Q.`,
        `2. Solve for the new quantity: Q_sub = (${formatNumber(state.demandIntercept)} - ${formatNumber(state.supplyIntercept)} + ${formatNumber(state.subsidy)}) / (${formatNumber(state.demandSlope)} + ${formatNumber(state.supplySlope)}) = ${formatNumber(afterSubsidy.quantity)}.`,
        `3. Buyer price is ${formatNumber(afterSubsidy.buyerPrice)} and seller price is ${formatNumber(afterSubsidy.sellerPrice)}.`,
        `4. Subsidy cost = ${formatCurrency(subsidyCost)} and DWL = ${formatCurrency(dwl)}.`,
      ]}
      explainLike12="It is like the government chips in money for every trade, so more trades happen than would happen on their own."
      examWording="A per-unit subsidy decreases the buyers' price, increases the sellers' price, and increases the equilibrium quantity."
      focusIdeas={[
        { title: "See the wedge", body: "The vertical gap between what buyers pay and sellers receive is the subsidy.", tag: "10-second meaning" },
        { title: "Quantity rises", body: "Subsidies push the market to the right of the efficient quantity.", tag: "why this matters" },
        { title: "Watch the rectangle", body: "Government spending is the green rectangle, not the DWL triangle.", tag: "AP trap" },
      ]}
      graphTutor={{
        starterPrompts: [
          { label: "Raise subsidy", prompt: "Raise the subsidy." },
          { label: "More overproduction", prompt: "Show more overproduction." },
          { label: "Lower buyer price", prompt: "Help buyers more." },
          { label: "Reset", prompt: "Reset the graph." },
        ],
        onCommand: handleTutorCommand,
      }}
      overlayOptions={[
        {
          id: "subsidy-consumer-surplus",
          label: "Add consumer surplus",
          active: overlays.consumerSurplus,
          accent: "#38bdf8",
          onToggle: () => setOverlays((current) => ({ ...current, consumerSurplus: !current.consumerSurplus })),
        },
        {
          id: "subsidy-producer-surplus",
          label: "Add producer surplus",
          active: overlays.producerSurplus,
          accent: "#f59e0b",
          onToggle: () => setOverlays((current) => ({ ...current, producerSurplus: !current.producerSurplus })),
        },
      ]}
      practiceInteraction={practiceInteraction}
    />
  );
}
