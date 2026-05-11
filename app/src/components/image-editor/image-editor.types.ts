export type Point = {
  x: number;
  y: number;
};

export type ImageEditorTool =
  | "select"
  | "arrow"
  | "rectangle"
  | "ellipse"
  | "pen"
  | "highlighter"
  | "text"
  | "step"
  | "pixelate"
  | "crop";

export type ImageEditorZoom = "fit" | number;

export type ResizeHandle = "nw" | "ne" | "sw" | "se";

export const toolLabels: Record<ImageEditorTool, string> = {
  select: "Select",
  arrow: "Arrow",
  rectangle: "Rectangle",
  ellipse: "Ellipse",
  pen: "Pen",
  highlighter: "Highlight",
  text: "Text",
  step: "Step",
  pixelate: "Pixelate",
  crop: "Crop",
};

export type EditorSettings = {
  color: string;
  fillColor: string;
  strokeWidth: number;
  fontSize: number;
  opacity: number;
};

export type BaseAnnotation = {
  id: string;
  createdAt: number;
  opacity: number;
};

export type ArrowAnnotation = BaseAnnotation & {
  type: "arrow";
  start: Point;
  end: Point;
  color: string;
  strokeWidth: number;
};

export type BoxAnnotation = BaseAnnotation & {
  type: "rectangle" | "ellipse" | "pixelate";
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
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
};

export type StepAnnotation = BaseAnnotation & {
  type: "step";
  x: number;
  y: number;
  label: string;
  color: string;
  size: number;
};

export type ImageAnnotation =
  | ArrowAnnotation
  | BoxAnnotation
  | PathAnnotation
  | TextAnnotation
  | StepAnnotation;

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
};

export type ImageEditorProject = {
  version: 1;
  id: string;
  name: string;
  width: number;
  height: number;
  baseImage: BaseImageData;
  annotations: ImageAnnotation[];
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
};

export const createEditorId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const cloneProject = (project: ImageEditorProject): ImageEditorProject =>
  structuredClone(project);
