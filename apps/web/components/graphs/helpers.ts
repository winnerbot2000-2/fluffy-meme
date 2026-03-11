import { formatCurrency, formatNumber, sampleLine, samplePositiveSlopeLine, triangleArea } from "@apmicro/graph-engine";

export const marketDomain = {
  xMin: 0,
  xMax: 60,
  yMin: 0,
  yMax: 24,
};

export function demandPrice(intercept: number, slope: number, quantity: number) {
  return intercept - slope * quantity;
}

export function supplyPrice(intercept: number, slope: number, quantity: number) {
  return intercept + slope * quantity;
}

export function getCompetitiveEquilibrium(params: {
  demandIntercept: number;
  demandSlope: number;
  supplyIntercept: number;
  supplySlope: number;
}) {
  const { demandIntercept, demandSlope, supplyIntercept, supplySlope } = params;
  const quantity = (demandIntercept - supplyIntercept) / (demandSlope + supplySlope);
  const price = demandPrice(demandIntercept, demandSlope, quantity);
  return { x: quantity, y: price };
}

export function buildDemandCurve(demandIntercept: number, demandSlope: number) {
  return sampleLine({
    intercept: demandIntercept,
    slope: demandSlope,
    domain: marketDomain,
  });
}

export function buildSupplyCurve(supplyIntercept: number, supplySlope: number) {
  return samplePositiveSlopeLine({
    intercept: supplyIntercept,
    slope: supplySlope,
    domain: marketDomain,
  });
}

export function getTaxOutcome(params: {
  demandIntercept: number;
  demandSlope: number;
  supplyIntercept: number;
  supplySlope: number;
  tax: number;
}) {
  const { demandIntercept, demandSlope, supplyIntercept, supplySlope, tax } = params;
  const quantity = (demandIntercept - supplyIntercept - tax) / (demandSlope + supplySlope);
  const buyerPrice = demandPrice(demandIntercept, demandSlope, quantity);
  const sellerPrice = supplyPrice(supplyIntercept, supplySlope, quantity);
  return {
    quantity,
    buyerPrice,
    sellerPrice,
    taxRevenue: tax * quantity,
  };
}

export function getSubsidyOutcome(params: {
  demandIntercept: number;
  demandSlope: number;
  supplyIntercept: number;
  supplySlope: number;
  subsidy: number;
}) {
  const { demandIntercept, demandSlope, supplyIntercept, supplySlope, subsidy } = params;
  const quantity = (demandIntercept - supplyIntercept + subsidy) / (demandSlope + supplySlope);
  const buyerPrice = demandPrice(demandIntercept, demandSlope, quantity);
  const sellerPrice = buyerPrice + subsidy;
  return {
    quantity,
    buyerPrice,
    sellerPrice,
    subsidyCost: subsidy * quantity,
  };
}

export function buildMarketAnchors({
  demandIntercept,
  demandSlope,
  supplyIntercept,
  supplySlope,
}: {
  demandIntercept: number;
  demandSlope: number;
  supplyIntercept: number;
  supplySlope: number;
}) {
  return {
    demand: [
      { id: "intercept", label: "D0", x: 0, y: demandIntercept },
      { id: "slope", label: "D1", x: 40, y: demandPrice(demandIntercept, demandSlope, 40) },
    ],
    supply: [
      { id: "intercept", label: "S0", x: 0, y: supplyIntercept },
      { id: "slope", label: "S1", x: 40, y: supplyPrice(supplyIntercept, supplySlope, 40) },
    ],
  };
}

export function getIncidenceShare(totalWedge: number, partial: number) {
  return `${formatNumber((partial / totalWedge) * 100, 1)}%`;
}

export function marketSummaryMath(params: {
  equilibriumQuantity: number;
  equilibriumPrice: number;
  demandIntercept: number;
  supplyIntercept: number;
}) {
  const { equilibriumQuantity, equilibriumPrice, demandIntercept, supplyIntercept } = params;
  const consumerSurplus = triangleArea(equilibriumQuantity, demandIntercept - equilibriumPrice);
  const producerSurplus = triangleArea(equilibriumQuantity, equilibriumPrice - supplyIntercept);
  return {
    consumerSurplus,
    producerSurplus,
    totalSurplus: consumerSurplus + producerSurplus,
    prettyConsumerSurplus: formatCurrency(consumerSurplus),
    prettyProducerSurplus: formatCurrency(producerSurplus),
    prettyTotalSurplus: formatCurrency(consumerSurplus + producerSurplus),
  };
}
