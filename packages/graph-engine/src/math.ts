import type { Coordinate } from "./types";

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function solveLineIntersection(
  a: { intercept: number; slope: number },
  b: { intercept: number; slope: number },
) {
  const x = (b.intercept - a.intercept) / (a.slope - b.slope);
  const y = a.intercept - a.slope * x;
  return { x, y };
}

export function triangleArea(base: number, height: number) {
  return 0.5 * base * height;
}

export function polygonArea(points: Coordinate[]) {
  if (points.length < 3) {
    return 0;
  }

  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }

  return Math.abs(area / 2);
}

export function formatNumber(value: number, digits = 2) {
  return Number.isInteger(value) ? String(value) : value.toFixed(digits);
}

export function formatCurrency(value: number) {
  return `$${formatNumber(value)}`;
}
