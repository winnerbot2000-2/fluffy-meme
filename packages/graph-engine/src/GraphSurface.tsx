"use client";

import { motion } from "framer-motion";
import { scaleLinear } from "d3-scale";
import { line as d3Line } from "d3-shape";
import { useMemo, useRef, useState } from "react";

import { clamp } from "./math";
import type { Coordinate, CoordinateDomain, CurveDefinition, RenderableArea, RenderablePoint } from "./types";

const WIDTH = 720;
const HEIGHT = 440;
const MARGIN = { top: 26, right: 28, bottom: 58, left: 64 };

type DragState = {
  curveId: string;
  anchorId: string;
} | null;

type AnnotationBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  textX: number;
  textY: number;
};

type AnnotationCandidate = {
  id: string;
  text: string;
  anchorX: number;
  anchorY: number;
  fontSize: number;
  stroke: string;
  textClassName: string;
};

function estimateTextWidth(text: string, fontSize: number) {
  return Math.max(text.length * fontSize * 0.58 + 18, 38);
}

function boxesOverlap(a: AnnotationBox, b: AnnotationBox) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function createAnnotationBox(anchorX: number, anchorY: number, width: number, height: number) {
  const prefersLeft = anchorX > WIDTH - MARGIN.right - 152;
  const prefersBottom = anchorY < MARGIN.top + 34;
  const idealX = prefersLeft ? anchorX - width - 12 : anchorX + 12;
  const idealY = prefersBottom ? anchorY + 10 : anchorY - height - 10;

  const x = clamp(idealX, MARGIN.left + 6, WIDTH - MARGIN.right - width - 6);
  const y = clamp(idealY, MARGIN.top + 6, HEIGHT - MARGIN.bottom - height - 6);

  return {
    x,
    y,
    width,
    height,
    textX: x + 10,
    textY: y + height / 2,
  };
}

function placeAnnotation(candidate: AnnotationCandidate, occupied: AnnotationBox[]) {
  const width = estimateTextWidth(candidate.text, candidate.fontSize);
  const height = candidate.fontSize >= 12 ? 24 : 22;
  const base = createAnnotationBox(candidate.anchorX, candidate.anchorY, width, height);
  const offsetSequence = [0, 28, -28, 52, -52, 76, -76];

  for (const offset of offsetSequence) {
    const box = {
      ...base,
      y: clamp(base.y + offset, MARGIN.top + 6, HEIGHT - MARGIN.bottom - height - 6),
    };

    if (!occupied.some((existing) => boxesOverlap(existing, box))) {
      return box;
    }
  }

  return base;
}

export function GraphSurface({
  domain,
  xAxisLabel,
  yAxisLabel,
  curves,
  points,
  areas,
  selectedPointId,
  selectedAreaId,
  onPointSelect,
  onAreaSelect,
  onAnchorDrag,
}: {
  domain: CoordinateDomain;
  xAxisLabel: string;
  yAxisLabel: string;
  curves: CurveDefinition[];
  points: RenderablePoint[];
  areas: RenderableArea[];
  selectedPointId?: string | null;
  selectedAreaId?: string | null;
  onPointSelect?: (pointId: string) => void;
  onAreaSelect?: (areaId: string) => void;
  onAnchorDrag?: (curveId: string, anchorId: string, nextCoordinate: Coordinate) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragState, setDragState] = useState<DragState>(null);
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);

  const xScale = useMemo(
    () =>
      scaleLinear()
        .domain([domain.xMin, domain.xMax])
        .range([MARGIN.left, WIDTH - MARGIN.right]),
    [domain],
  );

  const yScale = useMemo(
    () =>
      scaleLinear()
        .domain([domain.yMin, domain.yMax])
        .range([HEIGHT - MARGIN.bottom, MARGIN.top]),
    [domain],
  );

  const lineBuilder = useMemo(
    () =>
      d3Line<Coordinate>()
        .x((point: Coordinate) => xScale(point.x))
        .y((point: Coordinate) => yScale(point.y)),
    [xScale, yScale],
  );

  const xTicks = xScale.ticks(6);
  const yTicks = yScale.ticks(6);

  const annotations = useMemo(() => {
    const occupied: AnnotationBox[] = [];
    const candidates: AnnotationCandidate[] = curves.flatMap((curve) => {
      const curveItems: AnnotationCandidate[] = [];

      if (curve.labelAt) {
        curveItems.push({
          id: `curve-${curve.id}`,
          text: curve.label,
          anchorX: xScale(curve.labelAt.x),
          anchorY: yScale(curve.labelAt.y),
          fontSize: 12,
          stroke: curve.color,
          textClassName: "fill-zinc-100 text-[12px] font-medium",
        });
      }

      if (curve.draggable && curve.anchors) {
        curveItems.push(
          ...curve.anchors.map((anchor) => ({
            id: `anchor-${curve.id}-${anchor.id}`,
            text: anchor.label,
            anchorX: xScale(anchor.x),
            anchorY: yScale(anchor.y),
            fontSize: 11,
            stroke: curve.color,
            textClassName: "fill-zinc-200 text-[11px]",
          })),
        );
      }

      return curveItems;
    });

    return candidates.map((candidate) => {
      const box = placeAnnotation(candidate, occupied);
      occupied.push(box);
      return {
        ...candidate,
        ...box,
      };
    });
  }, [curves, xScale, yScale]);

  function toDomain(clientX: number, clientY: number) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) {
      return null;
    }

    const px = clamp(clientX - rect.left, MARGIN.left, WIDTH - MARGIN.right);
    const py = clamp(clientY - rect.top, MARGIN.top, HEIGHT - MARGIN.bottom);

    return {
      x: xScale.invert(px),
      y: yScale.invert(py),
    };
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full overflow-visible rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]"
      onPointerMove={(event) => {
        if (!dragState || !onAnchorDrag) {
          return;
        }

        const nextCoordinate = toDomain(event.clientX, event.clientY);
        if (!nextCoordinate) {
          return;
        }

        onAnchorDrag(dragState.curveId, dragState.anchorId, nextCoordinate);
      }}
      onPointerUp={() => setDragState(null)}
      onPointerLeave={() => setDragState(null)}
    >
      <defs>
        <linearGradient id="gridFade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
        </linearGradient>
      </defs>

      {xTicks.map((tick: number) => (
        <g key={`x-${tick}`}>
          <line
            x1={xScale(tick)}
            x2={xScale(tick)}
            y1={MARGIN.top}
            y2={HEIGHT - MARGIN.bottom}
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="4 8"
          />
          <text x={xScale(tick)} y={HEIGHT - MARGIN.bottom + 22} textAnchor="middle" className="fill-zinc-500 text-[11px]">
            {tick}
          </text>
        </g>
      ))}

      {yTicks.map((tick: number) => (
        <g key={`y-${tick}`}>
          <line
            x1={MARGIN.left}
            x2={WIDTH - MARGIN.right}
            y1={yScale(tick)}
            y2={yScale(tick)}
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="4 8"
          />
          <text x={MARGIN.left - 14} y={yScale(tick) + 4} textAnchor="end" className="fill-zinc-500 text-[11px]">
            {tick}
          </text>
        </g>
      ))}

      <line
        x1={MARGIN.left}
        x2={WIDTH - MARGIN.right}
        y1={HEIGHT - MARGIN.bottom}
        y2={HEIGHT - MARGIN.bottom}
        stroke="rgba(255,255,255,0.4)"
      />
      <line
        x1={MARGIN.left}
        x2={MARGIN.left}
        y1={MARGIN.top}
        y2={HEIGHT - MARGIN.bottom}
        stroke="rgba(255,255,255,0.4)"
      />

      <text x={(MARGIN.left + WIDTH - MARGIN.right) / 2} y={HEIGHT - 12} textAnchor="middle" className="fill-zinc-400 text-[13px]">
        {xAxisLabel}
      </text>
      <text
        x={18}
        y={(MARGIN.top + HEIGHT - MARGIN.bottom) / 2}
        transform={`rotate(-90 18 ${(MARGIN.top + HEIGHT - MARGIN.bottom) / 2})`}
        textAnchor="middle"
        className="fill-zinc-400 text-[13px]"
      >
        {yAxisLabel}
      </text>

      {areas.map((area) => (
        <motion.polygon
          key={area.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: area.opacity ?? 0.26 }}
          transition={{ duration: 0.36 }}
          points={area.polygon.map((point) => `${xScale(point.x)},${yScale(point.y)}`).join(" ")}
          fill={area.fill}
          stroke={area.stroke ?? area.fill}
          strokeWidth={selectedAreaId === area.id ? 2 : 1}
          className="cursor-pointer"
          onClick={() => onAreaSelect?.(area.id)}
        />
      ))}

      {curves.map((curve) => (
        <g key={curve.id}>
          <motion.path
            initial={{ pathLength: 0.85, opacity: 0.65 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.45 }}
            d={lineBuilder(curve.points) ?? ""}
            fill="none"
            stroke={curve.color}
            strokeWidth={curve.strokeWidth ?? 3.5}
            strokeDasharray={curve.dashed ? "8 8" : undefined}
            strokeLinecap="round"
          />

          {curve.draggable && curve.anchors?.map((anchor) => (
            <g key={anchor.id}>
              <circle
                cx={xScale(anchor.x)}
                cy={yScale(anchor.y)}
                r={7}
                fill={curve.color}
                className="cursor-grab"
                onPointerDown={(event) => {
                  event.preventDefault();
                  setDragState({ curveId: curve.id, anchorId: anchor.id });
                }}
              />
            </g>
          ))}
        </g>
      ))}

      {annotations.map((annotation) => (
        <g key={annotation.id} pointerEvents="none">
          <rect
            x={annotation.x}
            y={annotation.y}
            width={annotation.width}
            height={annotation.height}
            rx={11}
            fill="rgba(2,6,23,0.84)"
            stroke={annotation.stroke}
            strokeOpacity={0.28}
          />
          <text
            x={annotation.textX}
            y={annotation.textY}
            dominantBaseline="middle"
            className={annotation.textClassName}
          >
            {annotation.text}
          </text>
        </g>
      ))}

      {points.map((point) => (
        <g
          key={point.id}
          className="cursor-pointer"
          onClick={() => onPointSelect?.(point.id)}
          onPointerEnter={() => setHoveredPointId(point.id)}
          onPointerLeave={() => setHoveredPointId((current) => (current === point.id ? null : current))}
        >
          <motion.circle
            initial={{ scale: 0.92 }}
            animate={{ scale: selectedPointId === point.id ? 1.15 : 1 }}
            cx={xScale(point.x)}
            cy={yScale(point.y)}
            r={point.radius ?? 6}
            fill={point.fill ?? point.color ?? "#f8fafc"}
            stroke={selectedPointId === point.id ? "rgba(255,255,255,0.95)" : "rgba(15,23,42,0.7)"}
            strokeWidth={selectedPointId === point.id ? 3 : 2}
          />
          {hoveredPointId === point.id ? (
            <g pointerEvents="none">
              {(() => {
                const width = estimateTextWidth(point.label, 12);
                const height = 22;
                const box = createAnnotationBox(xScale(point.x), yScale(point.y), width, height);

                return (
                  <>
                    <rect
                      x={box.x}
                      y={box.y}
                      width={box.width}
                      height={box.height}
                      rx={11}
                      fill="rgba(2,6,23,0.92)"
                      stroke="rgba(255,255,255,0.14)"
                    />
                    <text x={box.textX} y={box.textY} dominantBaseline="middle" className="fill-zinc-100 text-[12px]">
                      {point.label}
                    </text>
                  </>
                );
              })()}
            </g>
          ) : null}
        </g>
      ))}
    </svg>
  );
}
