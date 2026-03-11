import type { Coordinate, CoordinateDomain } from "./types";

export function sampleLine({
  intercept,
  slope,
  domain,
  steps = 2,
}: {
  intercept: number;
  slope: number;
  domain: CoordinateDomain;
  steps?: number;
}) {
  const points: Coordinate[] = [];

  for (let index = 0; index < steps; index += 1) {
    const ratio = steps === 1 ? 0 : index / (steps - 1);
    const x = domain.xMin + (domain.xMax - domain.xMin) * ratio;
    const y = intercept - slope * x;
    points.push({ x, y });
  }

  return points;
}

export function samplePositiveSlopeLine({
  intercept,
  slope,
  domain,
  steps = 2,
}: {
  intercept: number;
  slope: number;
  domain: CoordinateDomain;
  steps?: number;
}) {
  const points: Coordinate[] = [];

  for (let index = 0; index < steps; index += 1) {
    const ratio = steps === 1 ? 0 : index / (steps - 1);
    const x = domain.xMin + (domain.xMax - domain.xMin) * ratio;
    const y = intercept + slope * x;
    points.push({ x, y });
  }

  return points;
}

export function samplePPC({
  maxX,
  maxY,
  bow,
  steps = 30,
}: {
  maxX: number;
  maxY: number;
  bow: number;
  steps?: number;
}) {
  const points: Coordinate[] = [];

  for (let index = 0; index < steps; index += 1) {
    const ratio = index / (steps - 1);
    const x = maxX * ratio;
    const y = maxY * Math.pow(1 - ratio, bow);
    points.push({ x, y });
  }

  return points;
}

export function rectanglePolygon(x1: number, y1: number, x2: number, y2: number): Coordinate[] {
  return [
    { x: x1, y: y1 },
    { x: x2, y: y1 },
    { x: x2, y: y2 },
    { x: x1, y: y2 },
  ];
}

export function trianglePolygon(a: Coordinate, b: Coordinate, c: Coordinate): Coordinate[] {
  return [a, b, c];
}
