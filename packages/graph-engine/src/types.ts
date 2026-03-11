import type { GraphPoint, ShadedArea } from "@apmicro/shared-types";

export type CoordinateDomain = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

export type Coordinate = {
  x: number;
  y: number;
};

export type CurveAnchor = {
  id: string;
  label: string;
  x: number;
  y: number;
};

export type CurveDefinition = {
  id: string;
  label: string;
  color: string;
  points: Coordinate[];
  strokeWidth?: number;
  dashed?: boolean;
  draggable?: boolean;
  anchors?: CurveAnchor[];
  labelAt?: Coordinate;
};

export type RenderablePoint = GraphPoint & {
  radius?: number;
  fill?: string;
};

export type RenderableArea = ShadedArea & {
  polygon: Coordinate[];
  stroke?: string;
  opacity?: number;
};
