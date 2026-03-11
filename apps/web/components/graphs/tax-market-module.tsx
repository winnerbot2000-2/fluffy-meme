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
  getIncidenceShare,
  getTaxOutcome,
  marketDomain,
  supplyPrice,
} from "./helpers";

const defaultState = {
  demandIntercept: 20,
  demandSlope: 0.24,
  supplyIntercept: 3,
  supplySlope: 0.14,
  tax: 4,
};

export function TaxMarketModule({ practiceInteraction }: { practiceInteraction?: GraphPracticeInteraction } = {}) {
  const [state, setState] = useState(defaultState);
  const [overlays, setOverlays] = useState({
    consumerSurplus: false,
    producerSurplus: false,
  });

  const initial = getCompetitiveEquilibrium(state);
  const afterTax = getTaxOutcome(state);
  const revenue = afterTax.taxRevenue;
  const dwl = triangleArea(initial.x - afterTax.quantity, state.tax);
  const anchors = buildMarketAnchors(state);
  const buyerBurden = afterTax.buyerPrice - initial.y;
  const sellerBurden = initial.y - afterTax.sellerPrice;
  const consumerSurplus = triangleArea(afterTax.quantity, state.demandIntercept - afterTax.buyerPrice);
  const producerSurplus = triangleArea(afterTax.quantity, afterTax.sellerPrice - state.supplyIntercept);

  function handleTutorCommand(prompt: string) {
    const lower = prompt.toLowerCase();

    if (lower.includes("reset")) {
      setState(defaultState);
      return { response: "I reset the tax graph to the baseline setup." };
    }
    if (lower.includes("raise tax") || lower.includes("higher tax") || lower.includes("bigger tax")) {
      setState((current) => ({ ...current, tax: Math.min(current.tax + 1, 8) }));
      return { response: "I increased the per-unit tax. Watch quantity fall and the wedge widen." };
    }
    if (lower.includes("lower tax") || lower.includes("smaller tax")) {
      setState((current) => ({ ...current, tax: Math.max(current.tax - 1, 1) }));
      return { response: "I lowered the tax. The wedge shrinks and the market moves back toward the efficient quantity." };
    }
    if (lower.includes("bigger dwl") || lower.includes("more deadweight loss")) {
      setState((current) => ({ ...current, tax: Math.min(current.tax + 1.5, 8), demandSlope: Math.max(current.demandSlope - 0.03, 0.1) }));
      return { response: "I increased the tax and made demand more elastic so the deadweight loss becomes easier to see." };
    }
    if (lower.includes("buyers bear") || lower.includes("consumer burden")) {
      setState((current) => ({ ...current, demandSlope: Math.min(current.demandSlope + 0.05, 0.5), supplySlope: Math.max(current.supplySlope - 0.03, 0.08) }));
      return { response: "I made demand less elastic and supply more elastic so buyers bear more of the tax." };
    }

    return { response: "Try asking me to raise the tax, lower the tax, show bigger DWL, make buyers bear more, or reset the graph." };
  }

  return (
    <GraphModuleShell
      title="Tax on a Competitive Market"
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
          id: "supply-tax",
          label: "Supply + Tax",
          color: "#fb7185",
          points: samplePositiveSlopeLine({
            intercept: state.supplyIntercept + state.tax,
            slope: state.supplySlope,
            domain: marketDomain,
          }),
          dashed: true,
          labelAt: { x: 38, y: state.supplyIntercept + state.tax + state.supplySlope * 38 + 1 },
        },
      ]}
      points={[
        {
          id: "initial-equilibrium",
          label: "E0",
          x: initial.x,
          y: initial.y,
          description: "Original competitive equilibrium before the tax.",
          math: `Q0 = ${formatNumber(initial.x)}, P0 = ${formatNumber(initial.y)}`,
          intuition: "This is where the market would settle without government intervention.",
          color: "#cbd5e1",
        },
        {
          id: "buyer-price",
          label: "Pb",
          x: afterTax.quantity,
          y: afterTax.buyerPrice,
          description: "Price buyers now pay after the tax shifts the effective supply curve upward.",
          math: `Pb = ${formatNumber(afterTax.buyerPrice)}`,
          intuition: "Buyers see a higher market price because the tax pushes the supply side upward.",
          color: "#38bdf8",
        },
        {
          id: "seller-price",
          label: "Ps",
          x: afterTax.quantity,
          y: afterTax.sellerPrice,
          description: "Price sellers keep after paying the tax wedge.",
          math: `Ps = ${formatNumber(afterTax.sellerPrice)}`,
          intuition: "Sellers end up with less per unit than buyers pay.",
          color: "#f59e0b",
        },
      ]}
      areas={[
        {
          id: "tax-revenue",
          label: "Tax Revenue",
          fill: "rgba(250,204,21,0.28)",
          description: "The government collects a rectangle equal to the tax wedge times the after-tax quantity.",
          math: `${formatNumber(state.tax)} x ${formatNumber(afterTax.quantity)} = ${formatCurrency(revenue)}`,
          intuition: "Every unit sold brings in the tax amount, and the government gets that for every post-tax unit.",
          pointIds: ["buyer-price", "seller-price"],
          polygon: rectanglePolygon(0, afterTax.buyerPrice, afterTax.quantity, afterTax.sellerPrice),
        },
        {
          id: "tax-dwl",
          label: "Deadweight Loss",
          fill: "rgba(244,114,182,0.28)",
          description: "The lost gains from trade for units that no longer occur after the tax reduces quantity.",
          math: `0.5 x (${formatNumber(initial.x)} - ${formatNumber(afterTax.quantity)}) x ${formatNumber(state.tax)} = ${formatCurrency(dwl)}`,
          intuition: "This triangle is the value of the trades that disappear when the tax pushes quantity below the efficient level.",
          pointIds: ["initial-equilibrium", "buyer-price", "seller-price"],
          polygon: trianglePolygon(
            { x: initial.x, y: initial.y },
            { x: afterTax.quantity, y: afterTax.buyerPrice },
            { x: afterTax.quantity, y: afterTax.sellerPrice },
          ),
        },
        ...(overlays.consumerSurplus
          ? [
              {
                id: "tax-consumer-surplus",
                label: "Consumer Surplus After Tax",
                fill: "rgba(56,189,248,0.22)",
                description: "Buyer surplus after the tax raises the consumer-facing price and reduces quantity.",
                math: `0.5 x ${formatNumber(afterTax.quantity)} x (${formatNumber(state.demandIntercept)} - ${formatNumber(afterTax.buyerPrice)}) = ${formatCurrency(consumerSurplus)}`,
                intuition: "This smaller blue triangle shows how much buyer surplus remains after the tax.",
                pointIds: ["buyer-price"],
                polygon: trianglePolygon(
                  { x: 0, y: state.demandIntercept },
                  { x: afterTax.quantity, y: afterTax.buyerPrice },
                  { x: 0, y: afterTax.buyerPrice },
                ),
              },
            ]
          : []),
        ...(overlays.producerSurplus
          ? [
              {
                id: "tax-producer-surplus",
                label: "Producer Surplus After Tax",
                fill: "rgba(245,158,11,0.2)",
                description: "Seller surplus after the tax lowers the seller-facing price and reduces quantity.",
                math: `0.5 x ${formatNumber(afterTax.quantity)} x (${formatNumber(afterTax.sellerPrice)} - ${formatNumber(state.supplyIntercept)}) = ${formatCurrency(producerSurplus)}`,
                intuition: "This orange triangle shows the producer surplus left after the tax.",
                pointIds: ["seller-price"],
                polygon: trianglePolygon(
                  { x: 0, y: state.supplyIntercept },
                  { x: afterTax.quantity, y: afterTax.sellerPrice },
                  { x: 0, y: afterTax.sellerPrice },
                ),
              },
            ]
          : []),
      ]}
      legend={[
        { label: "Demand", color: "#38bdf8" },
        { label: "Supply", color: "#f59e0b" },
        { label: "Supply + tax", color: "#fb7185" },
      ]}
      sliders={[
        { id: "tax", label: "Per-unit tax", min: 1, max: 8, step: 0.5, value: state.tax },
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
        { label: "Buyer price", value: formatCurrency(afterTax.buyerPrice), note: "Price consumers pay after the tax." },
        { label: "Seller price", value: formatCurrency(afterTax.sellerPrice), note: "Price producers keep after tax." },
        { label: "Tax revenue", value: formatCurrency(revenue), note: "Tax wedge x post-tax quantity." },
        { label: "DWL", value: formatCurrency(dwl), note: "Lost gains from trade from lower output." },
      ]}
      trapWarnings={[
        "Tax burden depends on elasticity, not on which side legally sends the payment.",
        "Tax revenue uses the after-tax quantity, not the original equilibrium quantity.",
      ]}
      tenSecondMeaning="A tax creates a wedge, shrinks quantity, raises the buyer price, lowers the seller price, and creates deadweight loss."
      whyItMatters="Tax graphs combine wedge logic, area math, and incidence analysis in one of the most testable AP Micro templates."
      intuition="The tax makes each sale harder to pull off. Some trades still happen, but fewer of them, and buyers and sellers split the pain."
      mathSteps={[
        `1. Start with the shifted supply curve: P = ${formatNumber(state.supplyIntercept + state.tax)} + ${formatNumber(state.supplySlope)}Q.`,
        `2. Solve for the new quantity: Q_tax = (${formatNumber(state.demandIntercept)} - ${formatNumber(state.supplyIntercept)} - ${formatNumber(state.tax)}) / (${formatNumber(state.demandSlope)} + ${formatNumber(state.supplySlope)}) = ${formatNumber(afterTax.quantity)}.`,
        `3. Buyer price is ${formatNumber(afterTax.buyerPrice)} and seller price is ${formatNumber(afterTax.sellerPrice)}.`,
        `4. Revenue = ${formatNumber(state.tax)} x ${formatNumber(afterTax.quantity)} = ${formatCurrency(revenue)}. DWL = ${formatCurrency(dwl)}.`,
      ]}
      explainLike12="The government adds a toll booth between buyers and sellers. Buyers pay more, sellers keep less, and some trades stop happening."
      examWording="A per-unit tax on producers shifts supply vertically upward by the amount of the tax and reduces the equilibrium quantity."
      focusIdeas={[
        { title: "See the wedge", body: "The vertical gap between buyer price and seller price is the tax.", tag: "10-second meaning" },
        { title: "Quantity falls", body: "Taxes push the market away from the efficient quantity, so output drops.", tag: "why this matters" },
        { title: "Incidence split", body: `In this setup buyers bear ${getIncidenceShare(state.tax, buyerBurden)} and sellers bear ${getIncidenceShare(state.tax, sellerBurden)} of the tax.`, tag: "AP trap" },
      ]}
      graphTutor={{
        starterPrompts: [
          { label: "Raise tax", prompt: "Raise the tax." },
          { label: "Bigger DWL", prompt: "Show bigger deadweight loss." },
          { label: "Buyers pay more", prompt: "Make buyers bear more of the tax." },
          { label: "Reset", prompt: "Reset the graph." },
        ],
        onCommand: handleTutorCommand,
      }}
      overlayOptions={[
        {
          id: "tax-consumer-surplus",
          label: "Add consumer surplus",
          active: overlays.consumerSurplus,
          accent: "#38bdf8",
          onToggle: () => setOverlays((current) => ({ ...current, consumerSurplus: !current.consumerSurplus })),
        },
        {
          id: "tax-producer-surplus",
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
