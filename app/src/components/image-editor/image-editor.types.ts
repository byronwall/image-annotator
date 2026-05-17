export type Point = {
  x: number;
  y: number;
};

export type ImageEditorTool =
  | "select"
  | "line"
  | "arrow"
  | "rectangle"
  | "ellipse"
  | "pen"
  | "highlighter"
  | "text"
  | "step"
  | "measure"
  | "erase"
  | "pixelate"
  | "crop";

export type ImageEditorZoom = "fit" | number;

export type ResizeHandle = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

export type MeasureMode = "edge" | "point";

export type MeasureAxis = "horizontal" | "vertical" | "point";

export type MeasureEdge = "vertical-edge" | "horizontal-edge";

export type MeasureEndpointSnap = {
  edge: MeasureEdge;
  confidence: number;
};

export type MeasureEdgeCandidate = MeasureEndpointSnap & {
  point: Point;
  distance: number;
};

export type MeasureSnap = MeasureEndpointSnap & {
  point: Point;
};

export type MeasurePointerInfo = {
  mode: MeasureMode;
  rawPoint: Point;
  point: Point;
  axis?: MeasureAxis;
  snapped?: MeasureSnap;
  candidates: MeasureEdgeCandidate[];
};

export const toolLabels: Record<ImageEditorTool, string> = {
  select: "Select",
  line: "Line",
  arrow: "Arrow",
  rectangle: "Rectangle",
  ellipse: "Ellipse",
  pen: "Pen",
  highlighter: "Highlight",
  text: "Text",
  step: "Step",
  measure: "Measure",
  erase: "Delete pixels",
  pixelate: "Pixelate",
  crop: "Crop",
};

export type StylableImageEditorTool = Exclude<ImageEditorTool, "select" | "crop">;

export type ArrowStyle =
  | "straight"
  | "elbow"
  | "curved"
  | "double-ended"
  | "line-only"
  | "soft-shadow"
  | "hand-drawn";

export type RectangleStyle =
  | "square"
  | "rounded"
  | "filled"
  | "outline-only"
  | "translucent"
  | "label-badge";

export type TextAnnotationStyle =
  | "none"
  | "pill"
  | "dark-label"
  | "light-label"
  | "warning-label"
  | "code-label"
  | "numbered-callout";

export type TextHorizontalAlign = "left" | "center" | "right";

export type TextVerticalAlign = "top" | "middle" | "bottom";

export type StepMarkerStyle =
  | "circle"
  | "square"
  | "pill"
  | "small-badge"
  | "large-tutorial";

export type StylePresetId =
  | "product-callout"
  | "bug-highlight"
  | "docs-style"
  | "hand-drawn-review"
  | "subtle-qa";

export type BrandPalette = {
  id: string;
  name: string;
  colors: string[];
  fillColors?: string[];
};

export type EditorSettings = {
  color: string;
  fillColor: string;
  strokeWidth: number;
  fontSize: number;
  opacity: number;
  arrowStyle: ArrowStyle;
  rectangleStyle: RectangleStyle;
  textStyle: TextAnnotationStyle;
  stepStyle: StepMarkerStyle;
};

export type BaseAnnotation = {
  id: string;
  createdAt: number;
  opacity: number;
  hidden?: boolean;
};

export type AttachedText = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  backgroundColor: string;
  fontSize: number;
  textStyle?: TextAnnotationStyle;
  textAlign?: TextHorizontalAlign;
  verticalAlign?: TextVerticalAlign;
};

export type ArrowAnnotation = BaseAnnotation & {
  type: "arrow";
  start: Point;
  end: Point;
  color: string;
  strokeWidth: number;
  arrowStyle?: ArrowStyle;
  text?: AttachedText;
};

export type BoxAnnotation = BaseAnnotation & {
  type: "rectangle" | "ellipse" | "pixelate" | "erase";
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  rectangleStyle?: RectangleStyle;
  text?: AttachedText;
};

export type PathAnnotation = BaseAnnotation & {
  type: "pen" | "highlighter";
  points: Point[];
  color: string;
  strokeWidth: number;
};

export type TextAnnotation = BaseAnnotation & {
  type: "text";
  x: number;
  y: number;
  text: string;
  color: string;
  backgroundColor: string;
  fontSize: number;
  textStyle?: TextAnnotationStyle;
  textAlign?: TextHorizontalAlign;
  verticalAlign?: TextVerticalAlign;
  width?: number;
  height?: number;
};

export type StepAnnotation = BaseAnnotation & {
  type: "step";
  x: number;
  y: number;
  label: string;
  color: string;
  size: number;
  stepStyle?: StepMarkerStyle;
};

export type MeasureAnnotation = BaseAnnotation & {
  type: "measure";
  start: Point;
  end: Point;
  color: string;
  strokeWidth: number;
  mode?: MeasureMode;
  axis?: MeasureAxis;
  startSnap?: MeasureEndpointSnap;
  endSnap?: MeasureEndpointSnap;
};

export type ImageLayerAnnotation = BaseAnnotation & {
  type: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
  naturalWidth: number;
  naturalHeight: number;
};

export type ImageAnnotation =
  | ArrowAnnotation
  | BoxAnnotation
  | PathAnnotation
  | TextAnnotation
  | StepAnnotation
  | MeasureAnnotation
  | ImageLayerAnnotation;

export type CropDraft = {
  id: string;
  type: "crop";
  x: number;
  y: number;
  width: number;
  height: number;
};

export type EditorDraft = ImageAnnotation | CropDraft;

export type BaseImageData = {
  dataUrl: string;
  mimeType: string;
  width: number;
  height: number;
  offsetX?: number;
  offsetY?: number;
};

export type ImageEditorProject = {
  version: 1;
  id: string;
  name: string;
  width: number;
  height: number;
  baseImage: BaseImageData;
  annotations: ImageAnnotation[];
  stylePalettes?: BrandPalette[];
  styleDefaults?: Partial<Record<StylableImageEditorTool, EditorSettings>>;
  createdAt: number;
  updatedAt: number;
};

export type HistoryLogEntry = {
  id: string;
  label: string;
  timestamp: number;
};

export type HistoryEntry = HistoryLogEntry & {
  project: ImageEditorProject;
};

export type ImageEditorPngPayload = {
  kind: "image-annotator.project";
  version: 1;
  exportedAt: number;
  project: ImageEditorProject;
  historyLog: HistoryLogEntry[];
  history?: HistoryEntry[];
};

export const defaultEditorSettings: EditorSettings = {
  color: "#2563eb",
  fillColor: "rgba(37, 99, 235, 0.12)",
  strokeWidth: 4,
  fontSize: 28,
  opacity: 1,
  arrowStyle: "straight",
  rectangleStyle: "square",
  textStyle: "pill",
  stepStyle: "circle",
};

export const createEditorId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const cloneProject = (project: ImageEditorProject): ImageEditorProject =>
  structuredClone(project);

export const toolMatchesAnnotation = (
  tool: ImageEditorTool,
  annotation: ImageAnnotation,
) => {
  switch (tool) {
    case "line":
      return annotation.type === "arrow" && annotation.arrowStyle === "line-only";
    case "arrow":
      return annotation.type === "arrow" && annotation.arrowStyle !== "line-only";
    case "rectangle":
      return annotation.type === "rectangle";
    case "ellipse":
      return annotation.type === "ellipse";
    case "pen":
      return annotation.type === "pen";
    case "highlighter":
      return annotation.type === "highlighter";
    case "text":
      return annotation.type === "text";
    case "step":
      return annotation.type === "step";
    case "measure":
      return annotation.type === "measure";
    case "erase":
      return annotation.type === "erase";
    case "pixelate":
      return annotation.type === "pixelate";
    case "select":
    case "crop":
      return false;
  }
};
