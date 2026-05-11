import {
  type ArrowAnnotation,
  type BoxAnnotation,
  type CropDraft,
  type EditorDraft,
  type ImageAnnotation,
  type ImageLayerAnnotation,
  type ImageEditorProject,
  type PathAnnotation,
  type Point,
  type ResizeHandle,
  type StepAnnotation,
  type TextAnnotation,
} from "./image-editor.types";

export type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const selectionColor = "#0ea5e9";
const resizeHandleSize = 12;
const imageLayerCache = new Map<string, HTMLImageElement>();
const textAnnotationFontFamily =
  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const textAnnotationFontWeight = 700;
let textMeasurementContext: CanvasRenderingContext2D | undefined;

export const normalizeRect = (
  x: number,
  y: number,
  width: number,
  height: number,
): Bounds => ({
  x: width < 0 ? x + width : x,
  y: height < 0 ? y + height : y,
  width: Math.abs(width),
  height: Math.abs(height),
});

export const clampBoundsToProject = (
  bounds: Bounds,
  project: Pick<ImageEditorProject, "width" | "height">,
): Bounds => {
  const x = Math.max(0, Math.min(bounds.x, project.width));
  const y = Math.max(0, Math.min(bounds.y, project.height));
  const maxX = Math.max(x, Math.min(bounds.x + bounds.width, project.width));
  const maxY = Math.max(y, Math.min(bounds.y + bounds.height, project.height));

  return {
    x,
    y,
    width: maxX - x,
    height: maxY - y,
  };
};

export const loadImageElement = (dataUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image."));
    image.src = dataUrl;
  });

export const renderImageEditorCanvas = (
  canvas: HTMLCanvasElement,
  baseImage: HTMLImageElement,
  annotations: ImageAnnotation[],
  draft: EditorDraft | undefined,
  selectedId: string | undefined,
  baseImageOffset: Point = { x: 0, y: 0 },
  hoveredId: string | undefined = undefined,
) => {
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.imageSmoothingEnabled = true;
  context.drawImage(
    baseImage,
    baseImageOffset.x,
    baseImageOffset.y,
    baseImage.naturalWidth,
    baseImage.naturalHeight,
  );
  context.restore();

  for (const annotation of annotations) {
    if (annotation.hidden) {
      continue;
    }

    drawAnnotation(context, annotation);
  }

  if (draft) {
    if (draft.type === "crop") {
      drawCropDraft(context, draft);
    } else {
      drawAnnotation(context, draft);
    }
  }

  if (hoveredId && hoveredId !== selectedId) {
    const hovered = annotations.find((annotation) => annotation.id === hoveredId);
    if (hovered && !hovered.hidden) {
      drawHover(context, getAnnotationBounds(hovered));
    }
  }

  if (selectedId) {
    const selected = annotations.find((annotation) => annotation.id === selectedId);
    if (selected && !selected.hidden) {
      drawSelection(context, getAnnotationBounds(selected), canResizeAnnotation(selected));
    }
  }
};

export const renderProjectToPngBlob = async (
  project: ImageEditorProject,
): Promise<Blob> => {
  const image = await loadImageElement(project.baseImage.dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = project.width;
  canvas.height = project.height;
  renderImageEditorCanvas(
    canvas,
    image,
    project.annotations,
    undefined,
    undefined,
    getBaseImageOffset(project),
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Unable to render image."));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
};

export const getBaseImageOffset = (
  project: Pick<ImageEditorProject, "baseImage">,
): Point => ({
  x: project.baseImage.offsetX ?? 0,
  y: project.baseImage.offsetY ?? 0,
});

export const getTextRenderMetrics = (
  annotation: Pick<TextAnnotation, "fontSize">,
) => ({
  paddingX: Math.max(8, annotation.fontSize * 0.32),
  paddingY: Math.max(5, annotation.fontSize * 0.22),
  lineHeight: annotation.fontSize * 1.28,
  fontFamily: textAnnotationFontFamily,
  fontWeight: textAnnotationFontWeight,
  borderRadius: 8,
});

export const getAnnotationBounds = (annotation: ImageAnnotation): Bounds => {
  switch (annotation.type) {
    case "arrow":
      return getArrowBounds(annotation);
    case "rectangle":
    case "ellipse":
    case "pixelate":
      return expandBounds(
        normalizeRect(annotation.x, annotation.y, annotation.width, annotation.height),
        annotation.strokeWidth,
      );
    case "pen":
    case "highlighter":
      return getPathBounds(annotation);
    case "text":
      return getTextBounds(annotation);
    case "step":
      return getStepBounds(annotation);
    case "image":
      return normalizeRect(annotation.x, annotation.y, annotation.width, annotation.height);
  }
};

export const hitTestAnnotation = (
  annotation: ImageAnnotation,
  point: Point,
): boolean => {
  if (annotation.hidden) {
    return false;
  }

  const bounds = getAnnotationBounds(annotation);
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
};

export const moveAnnotation = (
  annotation: ImageAnnotation,
  deltaX: number,
  deltaY: number,
): ImageAnnotation => {
  switch (annotation.type) {
    case "arrow":
      return {
        ...annotation,
        start: movePoint(annotation.start, deltaX, deltaY),
        end: movePoint(annotation.end, deltaX, deltaY),
      };
    case "rectangle":
    case "ellipse":
    case "pixelate":
      return {
        ...annotation,
        x: annotation.x + deltaX,
        y: annotation.y + deltaY,
      };
    case "pen":
    case "highlighter":
      return {
        ...annotation,
        points: annotation.points.map((point) => movePoint(point, deltaX, deltaY)),
      };
    case "text":
    case "step":
      return {
        ...annotation,
        x: annotation.x + deltaX,
        y: annotation.y + deltaY,
      };
    case "image":
      return {
        ...annotation,
        x: annotation.x + deltaX,
        y: annotation.y + deltaY,
      };
  }
};

export const canResizeAnnotation = (annotation: ImageAnnotation): boolean =>
  annotation.type === "rectangle" ||
  annotation.type === "ellipse" ||
  annotation.type === "pixelate" ||
  annotation.type === "image";

export const getResizeHandleAt = (
  annotation: ImageAnnotation,
  point: Point,
): ResizeHandle | undefined => {
  if (!canResizeAnnotation(annotation)) {
    return undefined;
  }

  return getBoundsResizeHandleAt(getAnnotationBounds(annotation), point);
};

export const getBoundsResizeHandleAt = (
  bounds: Bounds,
  point: Point,
): ResizeHandle | undefined => {
  const handles = getResizeHandles(bounds);

  for (const handle of handles) {
    if (
      point.x >= handle.hitBounds.x &&
      point.x <= handle.hitBounds.x + handle.hitBounds.width &&
      point.y >= handle.hitBounds.y &&
      point.y <= handle.hitBounds.y + handle.hitBounds.height
    ) {
      return handle.handle;
    }
  }

  return undefined;
};

export const resizeAnnotation = (
  annotation: ImageAnnotation,
  initialBounds: Bounds,
  handle: ResizeHandle,
  point: Point,
): ImageAnnotation => {
  if (
    annotation.type !== "rectangle" &&
    annotation.type !== "ellipse" &&
    annotation.type !== "pixelate" &&
    annotation.type !== "image"
  ) {
    return annotation;
  }

  const nextBounds = resizeBounds(initialBounds, handle, point);

  return {
    ...annotation,
    x: nextBounds.x,
    y: nextBounds.y,
    width: Math.max(4, nextBounds.width),
    height: Math.max(4, nextBounds.height),
  };
};

export const resizeBounds = (
  bounds: Bounds,
  handle: ResizeHandle,
  point: Point,
): Bounds => getResizedBounds(bounds, handle, point);

const drawAnnotation = (
  context: CanvasRenderingContext2D,
  annotation: ImageAnnotation,
) => {
  switch (annotation.type) {
    case "arrow":
      drawArrow(context, annotation);
      break;
    case "rectangle":
      drawBox(context, annotation);
      break;
    case "ellipse":
      drawEllipse(context, annotation);
      break;
    case "pixelate":
      drawPixelate(context, annotation);
      break;
    case "pen":
    case "highlighter":
      drawPath(context, annotation);
      break;
    case "text":
      drawText(context, annotation);
      break;
    case "step":
      drawStep(context, annotation);
      break;
    case "image":
      drawImageLayer(context, annotation);
      break;
  }
};

const drawImageLayer = (
  context: CanvasRenderingContext2D,
  annotation: ImageLayerAnnotation,
) => {
  let image = imageLayerCache.get(annotation.dataUrl);

  if (!image) {
    image = new Image();
    image.onload = () => {
      context.canvas.dispatchEvent(new CustomEvent("image-layer-load"));
    };
    image.src = annotation.dataUrl;
    imageLayerCache.set(annotation.dataUrl, image);
  }

  if (!image.complete) {
    return;
  }

  const bounds = normalizeRect(annotation.x, annotation.y, annotation.width, annotation.height);

  context.save();
  context.globalAlpha = annotation.opacity;
  context.imageSmoothingEnabled = true;
  context.drawImage(image, bounds.x, bounds.y, bounds.width, bounds.height);
  context.restore();
};

const drawArrow = (
  context: CanvasRenderingContext2D,
  annotation: ArrowAnnotation,
) => {
  const headLength = Math.max(14, annotation.strokeWidth * 4);
  const headWidth = Math.max(10, annotation.strokeWidth * 3.1);
  const angle = Math.atan2(
    annotation.end.y - annotation.start.y,
    annotation.end.x - annotation.start.x,
  );
  const shaftEnd = {
    x: annotation.end.x - Math.cos(angle) * headLength * 0.72,
    y: annotation.end.y - Math.sin(angle) * headLength * 0.72,
  };
  const baseCenter = {
    x: annotation.end.x - Math.cos(angle) * headLength,
    y: annotation.end.y - Math.sin(angle) * headLength,
  };
  const normal = {
    x: Math.cos(angle + Math.PI / 2),
    y: Math.sin(angle + Math.PI / 2),
  };

  context.save();
  context.globalAlpha = annotation.opacity;
  context.strokeStyle = annotation.color;
  context.fillStyle = annotation.color;
  context.lineWidth = annotation.strokeWidth;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(annotation.start.x, annotation.start.y);
  context.lineTo(shaftEnd.x, shaftEnd.y);
  context.stroke();

  context.beginPath();
  context.moveTo(annotation.end.x, annotation.end.y);
  context.lineTo(baseCenter.x + normal.x * headWidth * 0.5, baseCenter.y + normal.y * headWidth * 0.5);
  context.lineTo(baseCenter.x - normal.x * headWidth * 0.5, baseCenter.y - normal.y * headWidth * 0.5);
  context.closePath();
  context.fill();
  context.restore();
};

const drawBox = (
  context: CanvasRenderingContext2D,
  annotation: BoxAnnotation,
) => {
  const bounds = normalizeRect(
    annotation.x,
    annotation.y,
    annotation.width,
    annotation.height,
  );

  context.save();
  context.globalAlpha = annotation.opacity;
  context.lineWidth = annotation.strokeWidth;
  context.strokeStyle = annotation.strokeColor;
  context.fillStyle = annotation.fillColor;
  context.beginPath();
  context.rect(bounds.x, bounds.y, bounds.width, bounds.height);
  context.fill();
  context.stroke();
  context.restore();
};

const drawEllipse = (
  context: CanvasRenderingContext2D,
  annotation: BoxAnnotation,
) => {
  const bounds = normalizeRect(
    annotation.x,
    annotation.y,
    annotation.width,
    annotation.height,
  );

  context.save();
  context.globalAlpha = annotation.opacity;
  context.lineWidth = annotation.strokeWidth;
  context.strokeStyle = annotation.strokeColor;
  context.fillStyle = annotation.fillColor;
  context.beginPath();
  context.ellipse(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
    bounds.width / 2,
    bounds.height / 2,
    0,
    0,
    Math.PI * 2,
  );
  context.fill();
  context.stroke();
  context.restore();
};

const drawPixelate = (
  context: CanvasRenderingContext2D,
  annotation: BoxAnnotation,
) => {
  const bounds = normalizeRect(
    annotation.x,
    annotation.y,
    annotation.width,
    annotation.height,
  );

  if (bounds.width < 2 || bounds.height < 2) {
    return;
  }

  const pixelSize = Math.max(8, annotation.strokeWidth * 4);
  const tinyWidth = Math.max(1, Math.ceil(bounds.width / pixelSize));
  const tinyHeight = Math.max(1, Math.ceil(bounds.height / pixelSize));
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = tinyWidth;
  tempCanvas.height = tinyHeight;
  const tempContext = tempCanvas.getContext("2d");

  if (!tempContext) {
    return;
  }

  tempContext.imageSmoothingEnabled = true;
  tempContext.drawImage(
    context.canvas,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    0,
    0,
    tinyWidth,
    tinyHeight,
  );

  context.save();
  context.imageSmoothingEnabled = false;
  context.drawImage(
    tempCanvas,
    0,
    0,
    tinyWidth,
    tinyHeight,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
  );
  context.globalAlpha = 0.82;
  context.lineWidth = Math.max(2, annotation.strokeWidth / 2);
  context.strokeStyle = annotation.strokeColor;
  context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  context.restore();
};

const drawPath = (
  context: CanvasRenderingContext2D,
  annotation: PathAnnotation,
) => {
  if (annotation.points.length < 2) {
    return;
  }

  context.save();
  context.globalAlpha =
    annotation.type === "highlighter" ? Math.min(annotation.opacity, 0.42) : annotation.opacity;
  context.globalCompositeOperation =
    annotation.type === "highlighter" ? "multiply" : "source-over";
  context.strokeStyle = annotation.color;
  context.lineWidth = annotation.strokeWidth;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(annotation.points[0]?.x ?? 0, annotation.points[0]?.y ?? 0);

  for (const point of annotation.points.slice(1)) {
    context.lineTo(point.x, point.y);
  }

  context.stroke();
  context.restore();
};

const drawText = (
  context: CanvasRenderingContext2D,
  annotation: TextAnnotation,
) => {
  const metrics = getTextRenderMetrics(annotation);
  const lines = getTextLines(annotation.text);

  context.save();
  context.globalAlpha = annotation.opacity;
  context.font = getTextAnnotationFont(annotation);
  context.textBaseline = "top";
  const width =
    Math.max(...lines.map((line) => context.measureText(line).width)) +
    metrics.paddingX * 2;
  const height = metrics.lineHeight * lines.length + metrics.paddingY * 2;

  context.fillStyle = annotation.backgroundColor;
  drawRoundRect(context, annotation.x, annotation.y, width, height, metrics.borderRadius);
  context.fill();
  context.fillStyle = annotation.color;

  for (let index = 0; index < lines.length; index += 1) {
    context.fillText(
      lines[index] ?? "",
      annotation.x + metrics.paddingX,
      annotation.y + metrics.paddingY + index * metrics.lineHeight,
    );
  }

  context.restore();
};

const drawStep = (
  context: CanvasRenderingContext2D,
  annotation: StepAnnotation,
) => {
  const radius = annotation.size / 2;

  context.save();
  context.globalAlpha = annotation.opacity;
  context.fillStyle = annotation.color;
  context.strokeStyle = "rgba(255, 255, 255, 0.92)";
  context.lineWidth = Math.max(2, annotation.size * 0.08);
  context.beginPath();
  context.arc(annotation.x, annotation.y, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = "#ffffff";
  context.font = `800 ${Math.round(annotation.size * 0.46)}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(annotation.label, annotation.x, annotation.y + 1);
  context.restore();
};

const drawCropDraft = (
  context: CanvasRenderingContext2D,
  draft: CropDraft,
) => {
  const bounds = normalizeRect(draft.x, draft.y, draft.width, draft.height);

  context.save();
  context.strokeStyle = selectionColor;
  context.lineWidth = 2;
  context.setLineDash([8, 8]);
  context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  context.setLineDash([]);
  context.fillStyle = "#ffffff";

  for (const handle of getResizeHandles(bounds)) {
    context.beginPath();
    context.rect(
      handle.drawBounds.x,
      handle.drawBounds.y,
      handle.drawBounds.width,
      handle.drawBounds.height,
    );
    context.fill();
    context.stroke();
  }

  context.restore();
};

const drawSelection = (
  context: CanvasRenderingContext2D,
  bounds: Bounds,
  showHandles: boolean,
) => {
  context.save();
  context.strokeStyle = selectionColor;
  context.lineWidth = 2;
  context.setLineDash([6, 4]);
  context.strokeRect(bounds.x - 4, bounds.y - 4, bounds.width + 8, bounds.height + 8);

  if (showHandles) {
    context.setLineDash([]);
    context.fillStyle = "#ffffff";
    context.strokeStyle = selectionColor;
    context.lineWidth = 2;

    for (const handle of getResizeHandles(bounds)) {
      context.beginPath();
      context.rect(
        handle.drawBounds.x,
        handle.drawBounds.y,
        handle.drawBounds.width,
        handle.drawBounds.height,
      );
      context.fill();
      context.stroke();
    }
  }

  context.restore();
};

const drawHover = (context: CanvasRenderingContext2D, bounds: Bounds) => {
  context.save();
  context.shadowColor = "rgba(14, 165, 233, 0.45)";
  context.shadowBlur = 18;
  context.strokeStyle = "rgba(14, 165, 233, 0.95)";
  context.lineWidth = 3;
  context.setLineDash([]);
  context.strokeRect(bounds.x - 6, bounds.y - 6, bounds.width + 12, bounds.height + 12);
  context.restore();
};

const getResizeHandles = (bounds: Bounds) => {
  const size = resizeHandleSize;
  const half = size / 2;
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  return [
    {
      handle: "nw" as const,
      hitBounds: { x: bounds.x - half, y: bounds.y - half, width: size, height: size },
      drawBounds: { x: bounds.x - half, y: bounds.y - half, width: size, height: size },
    },
    {
      handle: "ne" as const,
      hitBounds: {
        x: bounds.x + bounds.width - half,
        y: bounds.y - half,
        width: size,
        height: size,
      },
      drawBounds: {
        x: bounds.x + bounds.width - half,
        y: bounds.y - half,
        width: size,
        height: size,
      },
    },
    {
      handle: "sw" as const,
      hitBounds: {
        x: bounds.x - half,
        y: bounds.y + bounds.height - half,
        width: size,
        height: size,
      },
      drawBounds: {
        x: bounds.x - half,
        y: bounds.y + bounds.height - half,
        width: size,
        height: size,
      },
    },
    {
      handle: "se" as const,
      hitBounds: {
        x: bounds.x + bounds.width - half,
        y: bounds.y + bounds.height - half,
        width: size,
        height: size,
      },
      drawBounds: {
        x: bounds.x + bounds.width - half,
        y: bounds.y + bounds.height - half,
        width: size,
        height: size,
      },
    },
    {
      handle: "n" as const,
      hitBounds: {
        x: bounds.x,
        y: bounds.y - half,
        width: bounds.width,
        height: size,
      },
      drawBounds: {
        x: centerX - half,
        y: bounds.y - half,
        width: size,
        height: size,
      },
    },
    {
      handle: "e" as const,
      hitBounds: {
        x: bounds.x + bounds.width - half,
        y: bounds.y,
        width: size,
        height: bounds.height,
      },
      drawBounds: {
        x: bounds.x + bounds.width - half,
        y: centerY - half,
        width: size,
        height: size,
      },
    },
    {
      handle: "s" as const,
      hitBounds: {
        x: bounds.x,
        y: bounds.y + bounds.height - half,
        width: bounds.width,
        height: size,
      },
      drawBounds: {
        x: centerX - half,
        y: bounds.y + bounds.height - half,
        width: size,
        height: size,
      },
    },
    {
      handle: "w" as const,
      hitBounds: {
        x: bounds.x - half,
        y: bounds.y,
        width: size,
        height: bounds.height,
      },
      drawBounds: {
        x: bounds.x - half,
        y: centerY - half,
        width: size,
        height: size,
      },
    },
  ];
};

const getResizedBounds = (
  bounds: Bounds,
  handle: ResizeHandle,
  point: Point,
): Bounds => {
  const minSize = 4;

  switch (handle) {
    case "n": {
      const bottom = bounds.y + bounds.height;
      const y = Math.min(point.y, bottom - minSize);

      return { ...bounds, y, height: bottom - y };
    }
    case "nw":
      return getCornerResizedBounds(bounds, handle, point);
    case "ne":
      return getCornerResizedBounds(bounds, handle, point);
    case "e":
      return { ...bounds, width: Math.max(minSize, point.x - bounds.x) };
    case "se":
      return getCornerResizedBounds(bounds, handle, point);
    case "s":
      return { ...bounds, height: Math.max(minSize, point.y - bounds.y) };
    case "sw":
      return getCornerResizedBounds(bounds, handle, point);
    case "w": {
      const right = bounds.x + bounds.width;
      const x = Math.min(point.x, right - minSize);

      return { ...bounds, x, width: right - x };
    }
  }
};

const getCornerResizedBounds = (
  bounds: Bounds,
  handle: Extract<ResizeHandle, "nw" | "ne" | "sw" | "se">,
  point: Point,
): Bounds => {
  const fixed = getFixedResizeCorner(bounds, handle);

  return normalizeRect(fixed.x, fixed.y, point.x - fixed.x, point.y - fixed.y);
};

const getFixedResizeCorner = (
  bounds: Bounds,
  handle: Extract<ResizeHandle, "nw" | "ne" | "sw" | "se">,
): Point => {
  switch (handle) {
    case "nw":
      return { x: bounds.x + bounds.width, y: bounds.y + bounds.height };
    case "ne":
      return { x: bounds.x, y: bounds.y + bounds.height };
    case "sw":
      return { x: bounds.x + bounds.width, y: bounds.y };
    case "se":
      return { x: bounds.x, y: bounds.y };
  }
};

const drawRoundRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
};

const getArrowBounds = (annotation: ArrowAnnotation): Bounds => {
  const padding = Math.max(24, annotation.strokeWidth * 6);
  const minX = Math.min(annotation.start.x, annotation.end.x) - padding;
  const minY = Math.min(annotation.start.y, annotation.end.y) - padding;
  const maxX = Math.max(annotation.start.x, annotation.end.x) + padding;
  const maxY = Math.max(annotation.start.y, annotation.end.y) + padding;

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

const getPathBounds = (annotation: PathAnnotation): Bounds => {
  const first = annotation.points[0] ?? { x: 0, y: 0 };
  let minX = first.x;
  let minY = first.y;
  let maxX = first.x;
  let maxY = first.y;

  for (const point of annotation.points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  return expandBounds(
    {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    },
    annotation.strokeWidth + 8,
  );
};

const getTextBounds = (annotation: TextAnnotation): Bounds => {
  const metrics = getTextRenderMetrics(annotation);
  const lines = getTextLines(annotation.text);
  const width =
    Math.max(...lines.map((line) => measureTextLine(annotation, line))) +
    metrics.paddingX * 2;
  const height = metrics.lineHeight * lines.length + metrics.paddingY * 2;

  return {
    x: annotation.x,
    y: annotation.y,
    width,
    height,
  };
};

const getStepBounds = (annotation: StepAnnotation): Bounds => ({
  x: annotation.x - annotation.size / 2,
  y: annotation.y - annotation.size / 2,
  width: annotation.size,
  height: annotation.size,
});

const expandBounds = (bounds: Bounds, amount: number): Bounds => ({
  x: bounds.x - amount,
  y: bounds.y - amount,
  width: bounds.width + amount * 2,
  height: bounds.height + amount * 2,
});

const movePoint = (point: Point, deltaX: number, deltaY: number): Point => ({
  x: point.x + deltaX,
  y: point.y + deltaY,
});

const getTextLines = (text: string) => {
  const lines = text.split(/\r?\n/);
  return lines.length > 0 ? lines : [""];
};

const getTextAnnotationFont = (annotation: Pick<TextAnnotation, "fontSize">) => {
  const metrics = getTextRenderMetrics(annotation);

  return `${metrics.fontWeight} ${annotation.fontSize}px ${metrics.fontFamily}`;
};

const measureTextLine = (
  annotation: Pick<TextAnnotation, "fontSize">,
  line: string,
) => {
  if (typeof document === "undefined") {
    return line.length * annotation.fontSize * 0.62;
  }

  if (!textMeasurementContext) {
    textMeasurementContext = document.createElement("canvas").getContext("2d") ?? undefined;
  }

  if (!textMeasurementContext) {
    return line.length * annotation.fontSize * 0.62;
  }

  textMeasurementContext.font = getTextAnnotationFont(annotation);

  return textMeasurementContext.measureText(line).width;
};
