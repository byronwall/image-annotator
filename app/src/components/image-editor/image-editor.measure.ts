import {
  type MeasureAxis,
  type MeasureEdge,
  type MeasureEdgeCandidate,
  type MeasureEndpointSnap,
  type MeasureMode,
  type MeasurePointerInfo,
  type MeasureSnap,
  type Point,
} from "./image-editor.types";

type MeasurePointerOptions = {
  mode: MeasureMode;
  start?: Point;
  axis?: MeasureAxis;
  startSnap?: MeasureEndpointSnap;
  disableSnap?: boolean;
};

type Pixel = [number, number, number];

const edgeSearchRadius = 32;
const edgeBandRadius = 7;
const edgeThreshold = 42;

export const inferMeasureAxis = (
  start: Point,
  point: Point,
  fallback: MeasureAxis = "horizontal",
): MeasureAxis => {
  const deltaX = point.x - start.x;
  const deltaY = point.y - start.y;

  if (Math.hypot(deltaX, deltaY) < 3) {
    return fallback === "point" ? "horizontal" : fallback;
  }

  return Math.abs(deltaX) >= Math.abs(deltaY) ? "horizontal" : "vertical";
};

export const constrainMeasurePointToAxis = (
  start: Point,
  point: Point,
  axis: MeasureAxis,
): Point => {
  switch (axis) {
    case "horizontal":
      return { x: point.x, y: start.y };
    case "vertical":
      return { x: start.x, y: point.y };
    case "point":
      return point;
  }
};

export const measureAxisFromSnap = (
  snap: MeasureEndpointSnap | undefined,
): MeasureAxis | undefined => {
  if (!snap) {
    return undefined;
  }

  return snap.edge === "vertical-edge" ? "horizontal" : "vertical";
};

export const measureEndpointSnapFromInfo = (
  info: MeasurePointerInfo | undefined,
): MeasureEndpointSnap | undefined =>
  info?.snapped
    ? {
        edge: info.snapped.edge,
        confidence: info.snapped.confidence,
      }
    : undefined;

export const createMeasurePointerInfo = (
  context: CanvasRenderingContext2D | undefined,
  rawPoint: Point,
  options: MeasurePointerOptions,
): MeasurePointerInfo => {
  if (options.mode === "point") {
    return {
      mode: "point",
      rawPoint,
      point: rawPoint,
      axis: "point",
      candidates: [],
    };
  }

  const fallbackAxis = options.axis ?? measureAxisFromSnap(options.startSnap) ?? "horizontal";
  const axis = options.start
    ? inferMeasureAxis(options.start, rawPoint, fallbackAxis)
    : undefined;
  const constrainedPoint =
    options.start && axis
      ? constrainMeasurePointToAxis(options.start, rawPoint, axis)
      : rawPoint;
  const candidates = context
    ? findMeasureEdgeCandidates(context, constrainedPoint, axis)
    : [];
  const snapped = options.disableSnap ? undefined : chooseMeasureSnap(candidates, axis);

  return {
    mode: "edge",
    rawPoint,
    point: snapped ? snapped.point : constrainedPoint,
    axis,
    snapped,
    candidates,
  };
};

const chooseMeasureSnap = (
  candidates: MeasureEdgeCandidate[],
  axis: MeasureAxis | undefined,
): MeasureSnap | undefined => {
  const candidate = candidates.find((item) =>
    axis === "horizontal"
      ? item.edge === "vertical-edge"
      : axis === "vertical"
        ? item.edge === "horizontal-edge"
        : true,
  );

  if (!candidate) {
    return undefined;
  }

  return {
    edge: candidate.edge,
    confidence: candidate.confidence,
    point: candidate.point,
  };
};

const findMeasureEdgeCandidates = (
  context: CanvasRenderingContext2D,
  point: Point,
  axis: MeasureAxis | undefined,
): MeasureEdgeCandidate[] => {
  const candidates: MeasureEdgeCandidate[] = [];

  if (axis !== "vertical") {
    const vertical = findBestEdgeCandidate(context, point, "vertical-edge");

    if (vertical) {
      candidates.push(vertical);
    }
  }

  if (axis !== "horizontal") {
    const horizontal = findBestEdgeCandidate(context, point, "horizontal-edge");

    if (horizontal) {
      candidates.push(horizontal);
    }
  }

  return candidates.sort((first, second) => {
    const firstScore = first.confidence - first.distance * 1.5;
    const secondScore = second.confidence - second.distance * 1.5;

    return secondScore - firstScore;
  });
};

const findBestEdgeCandidate = (
  context: CanvasRenderingContext2D,
  point: Point,
  edge: MeasureEdge,
): MeasureEdgeCandidate | undefined => {
  let best:
    | {
        point: Point;
        confidence: number;
        distance: number;
      }
    | undefined;

  for (let offset = -edgeSearchRadius; offset <= edgeSearchRadius; offset += 1) {
    const candidatePoint =
      edge === "vertical-edge"
        ? { x: Math.round(point.x + offset), y: Math.round(point.y) }
        : { x: Math.round(point.x), y: Math.round(point.y + offset) };
    const confidence =
      edge === "vertical-edge"
        ? sampleVerticalEdgeConfidence(context, candidatePoint)
        : sampleHorizontalEdgeConfidence(context, candidatePoint);
    const distance = Math.abs(offset);
    const score = confidence - distance * 1.5;
    const bestScore = best ? best.confidence - best.distance * 1.5 : -Infinity;

    if (confidence >= edgeThreshold && score > bestScore) {
      best = {
        point:
          edge === "vertical-edge"
            ? { x: candidatePoint.x, y: point.y }
            : { x: point.x, y: candidatePoint.y },
        confidence,
        distance,
      };
    }
  }

  return best
    ? {
        edge,
        point: best.point,
        confidence: Math.round(best.confidence),
        distance: best.distance,
      }
    : undefined;
};

const sampleVerticalEdgeConfidence = (
  context: CanvasRenderingContext2D,
  point: Point,
) => {
  let total = 0;
  let count = 0;

  for (let offset = -edgeBandRadius; offset <= edgeBandRadius; offset += 2) {
    const left = samplePixel(context, point.x - 1, point.y + offset);
    const right = samplePixel(context, point.x + 1, point.y + offset);

    if (left && right) {
      total += colorDistance(left, right);
      count += 1;
    }
  }

  return count > 0 ? total / count : 0;
};

const sampleHorizontalEdgeConfidence = (
  context: CanvasRenderingContext2D,
  point: Point,
) => {
  let total = 0;
  let count = 0;

  for (let offset = -edgeBandRadius; offset <= edgeBandRadius; offset += 2) {
    const top = samplePixel(context, point.x + offset, point.y - 1);
    const bottom = samplePixel(context, point.x + offset, point.y + 1);

    if (top && bottom) {
      total += colorDistance(top, bottom);
      count += 1;
    }
  }

  return count > 0 ? total / count : 0;
};

const samplePixel = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
): Pixel | undefined => {
  const sampleX = Math.round(x);
  const sampleY = Math.round(y);

  if (
    sampleX < 0 ||
    sampleY < 0 ||
    sampleX >= context.canvas.width ||
    sampleY >= context.canvas.height
  ) {
    return undefined;
  }

  let pixel: Uint8ClampedArray;

  try {
    pixel = context.getImageData(sampleX, sampleY, 1, 1).data;
  } catch {
    return undefined;
  }

  return [pixel[0] ?? 0, pixel[1] ?? 0, pixel[2] ?? 0];
};

const colorDistance = (first: Pixel, second: Pixel) =>
  Math.hypot(
    first[0] - second[0],
    first[1] - second[1],
    first[2] - second[2],
  );
