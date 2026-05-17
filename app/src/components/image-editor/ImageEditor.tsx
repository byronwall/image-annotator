import {
  batch,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  Show,
  untrack,
} from "solid-js";
import { Box, Flex, HStack } from "styled-system/jsx";
import { Badge } from "~/components/ui/badge";
import {
  clampBoundsToProject,
  getAnnotationBounds,
  getAnnotationTextBounds,
  getAnnotationUnionBounds,
  getBaseImageOffset,
  getBoundsResizeHandleAt,
  getResizeHandleAt,
  hitTestAnnotation,
  loadImageElement,
  moveAnnotation,
  normalizeRect,
  resizeBounds,
  renderProjectToPngBlob,
  transformAnnotationToBounds,
  type Bounds,
  type SnapGuide,
} from "./image-editor.render";
import {
  constrainMeasurePointToAxis,
  inferMeasureAxis,
  measureAxisFromSnap,
  measureEndpointSnapFromInfo,
} from "./image-editor.measure";
import { ImageEditorCanvas, type SelectionViewAction } from "./ImageEditorCanvas";
import { ImageEditorSidebar, type SavedImageSummary } from "./ImageEditorSidebar";
import { ImageEditorToolbar } from "./ImageEditorToolbar";
import {
  appendPngDataToBlob,
  createPngDataPayload,
  extractPngDataFromFile,
  extractPngDataFromText,
  readFileAsDataUrl,
  serializePngDataPayload,
} from "./image-editor.png-data";
import {
  cloneProject,
  createEditorId,
  defaultEditorSettings,
  toolLabels,
  toolMatchesAnnotation,
  type AttachedText,
  type ArrowAnnotation,
  type BoxAnnotation,
  type CropDraft,
  type EditorDraft,
  type EditorSettings,
  type HistoryEntry,
  type ImageAnnotation,
  type ImageEditorProject,
  type ImageEditorPngPayload,
  type ImageEditorTool,
  type ImageEditorZoom,
  type MeasureAxis,
  type MeasureAnnotation,
  type MeasureEndpointSnap,
  type MeasureMode,
  type MeasurePointerInfo,
  type Point,
  type ResizeHandle,
  type StylePresetId,
  type StylableImageEditorTool,
} from "./image-editor.types";
import {
  defaultStylePreferences,
  hexToFillColor,
  isStylableTool,
  loadStylePreferences,
  mergeBrandPalettes,
  saveStylePreferences,
  settingsForStylePreset,
  toolDefaultSettings,
  withCustomColor,
  withRecentColor,
  type ImageEditorStylePreferences,
} from "./image-editor.styles";

type DrawingInteraction = {
  type: "draw";
  tool: ImageEditorTool;
  start: Point;
};

type MoveInteraction = {
  type: "move";
  annotationIds: string[];
  start: Point;
  originalAnnotations: ImageAnnotation[];
  commitLabel?: string;
};

type ResizeInteraction = {
  type: "resize";
  annotationIds: string[];
  handle: ResizeHandle;
  start: Point;
  initialBounds: Bounds;
  originalAnnotations: ImageAnnotation[];
};

type MarqueeInteraction = {
  type: "marquee";
  start: Point;
  additive: boolean;
  baseSelectionIds: string[];
};

type MeasureEndpointHandle = "start" | "end";

type MeasureEndpointInteraction = {
  type: "measure-endpoint";
  annotationId: string;
  endpoint: MeasureEndpointHandle;
  start: Point;
  anchor: Point;
  axis: MeasureAxis;
  originalAnnotations: ImageAnnotation[];
};

type MeasureAnchorInteraction = {
  type: "measure-anchor";
  start: Point;
  startSnap?: MeasureEndpointSnap;
  axis?: MeasureAxis;
};

type CropMoveInteraction = {
  type: "crop-move";
  start: Point;
  initialBounds: Bounds;
};

type CropResizeInteraction = {
  type: "crop-resize";
  handle: ResizeHandle;
  start: Point;
  initialBounds: Bounds;
};

type EditorInteraction =
  | DrawingInteraction
  | MoveInteraction
  | ResizeInteraction
  | MarqueeInteraction
  | MeasureEndpointInteraction
  | MeasureAnchorInteraction
  | CropMoveInteraction
  | CropResizeInteraction;

type PngExport = {
  blob: Blob;
  payload: ImageEditorPngPayload;
};

type CommitProjectOptions = {
  fitToContent?: boolean;
  preserveCanvas?: boolean;
};

type SnapMode = "off" | "both" | "horizontal" | "vertical";

type AlignmentCommand = "left" | "center" | "right" | "top" | "middle" | "bottom";

type DistributionAxis = "horizontal" | "vertical";

type SelectionBoundsCommand =
  | { type: "resize"; edge: "right" | "bottom"; delta: number }
  | { type: "edge"; edge: "left" | "right" | "top" | "bottom"; delta: number }
  | { type: "all"; delta: number };

type SnapAxis = "x" | "y";

type SnapTarget = {
  axis: SnapAxis;
  position: number;
  min: number;
  max: number;
};

type SnapResult = {
  bounds: Bounds;
  guides: SnapGuide[];
};

type ImageEditorHmrSession = {
  project: ImageEditorProject | undefined;
  history: HistoryEntry[];
  historyIndex: number;
  activeTool: ImageEditorTool;
  measureMode: MeasureMode;
  snapMode: SnapMode;
  settings: EditorSettings;
  stylePreferences: ImageEditorStylePreferences;
  styleClipboard: EditorSettings | undefined;
  draft: EditorDraft | undefined;
  selectedIds: string[];
  snapGuides: SnapGuide[];
  selectionMarquee: Bounds | undefined;
  hasLiveExpandedCanvas: boolean;
  isHistoryOpen: boolean;
  status: string;
  zoom: ImageEditorZoom;
  annotationClipboard: ImageAnnotation[];
  inlineEditingId: string | undefined;
  inlineEditOriginalAnnotations: ImageAnnotation[] | undefined;
  hasPendingInlineEdit: boolean;
  isShortcutsOpen: boolean;
  isBeforeAfterMode: boolean;
};

const imageEditorHmrSessionKey = "image-annotator.editor-hmr-session.v1";

const cloneHmrValue = <T,>(value: T | undefined): T | undefined =>
  value === undefined ? undefined : structuredClone(value);

const cloneHmrHistory = (entries: HistoryEntry[]) =>
  entries.map((entry) => ({
    ...entry,
    project: cloneProject(entry.project),
  }));

const cloneImageEditorHmrSession = (
  session: ImageEditorHmrSession,
): ImageEditorHmrSession => ({
  project: cloneHmrValue(session.project),
  history: cloneHmrHistory(session.history),
  historyIndex: session.historyIndex,
  activeTool: session.activeTool,
  measureMode: session.measureMode,
  snapMode: session.snapMode,
  settings: { ...session.settings },
  stylePreferences: structuredClone(session.stylePreferences),
  styleClipboard: cloneHmrValue(session.styleClipboard),
  draft: cloneHmrValue(session.draft),
  selectedIds: [...session.selectedIds],
  snapGuides: cloneHmrValue(session.snapGuides) ?? [],
  selectionMarquee: cloneHmrValue(session.selectionMarquee),
  hasLiveExpandedCanvas: session.hasLiveExpandedCanvas,
  isHistoryOpen: session.isHistoryOpen,
  status: session.status,
  zoom: session.zoom,
  annotationClipboard: cloneHmrValue(session.annotationClipboard) ?? [],
  inlineEditingId: session.inlineEditingId,
  inlineEditOriginalAnnotations: cloneHmrValue(session.inlineEditOriginalAnnotations),
  hasPendingInlineEdit: session.hasPendingInlineEdit,
  isShortcutsOpen: session.isShortcutsOpen,
  isBeforeAfterMode: session.isBeforeAfterMode,
});

const takeImageEditorHmrSession = () => {
  const hot = import.meta.hot;

  if (!hot) {
    return undefined;
  }

  const session = hot.data[imageEditorHmrSessionKey] as
    | ImageEditorHmrSession
    | undefined;
  delete hot.data[imageEditorHmrSessionKey];

  return session ? cloneImageEditorHmrSession(session) : undefined;
};

const readPersistedImageEditorHmrSession = () => {
  if (typeof sessionStorage === "undefined") {
    return undefined;
  }

  const raw = sessionStorage.getItem(imageEditorHmrSessionKey);

  if (!raw) {
    return undefined;
  }

  sessionStorage.removeItem(imageEditorHmrSessionKey);

  try {
    return cloneImageEditorHmrSession(JSON.parse(raw) as ImageEditorHmrSession);
  } catch {
    return undefined;
  }
};

const persistImageEditorHmrSession = (session: ImageEditorHmrSession) => {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  try {
    sessionStorage.setItem(imageEditorHmrSessionKey, JSON.stringify(session));
  } catch {
    return;
  }
};

let restoredHmrSession = takeImageEditorHmrSession();

const takeRestoredImageEditorHmrSession = () => {
  const session = restoredHmrSession;
  restoredHmrSession = undefined;
  return session;
};

export const ImageEditor = () => {
  let fileInputRef: HTMLInputElement | undefined;
  let shellRef: HTMLDivElement | undefined;
  const initialHmrSession = takeRestoredImageEditorHmrSession();
  const [project, setProject] = createSignal<ImageEditorProject | undefined>(
    initialHmrSession?.project,
  );
  const [history, setHistory] = createSignal<HistoryEntry[]>(
    initialHmrSession?.history ?? [],
  );
  const [historyIndex, setHistoryIndex] = createSignal(
    initialHmrSession?.historyIndex ?? -1,
  );
  const [activeTool, setActiveTool] = createSignal<ImageEditorTool>(
    initialHmrSession?.activeTool ?? "select",
  );
  const [measureMode, setMeasureMode] = createSignal<MeasureMode>(
    initialHmrSession?.measureMode ?? "edge",
  );
  const [snapMode, setSnapMode] = createSignal<SnapMode>(
    initialHmrSession?.snapMode ?? "both",
  );
  const [settings, setSettings] = createSignal<EditorSettings>({
    ...(initialHmrSession?.settings ?? defaultEditorSettings),
  });
  const [stylePreferences, setStylePreferences] =
    createSignal<ImageEditorStylePreferences>(
      initialHmrSession?.stylePreferences ?? defaultStylePreferences(),
    );
  const [styleClipboard, setStyleClipboard] = createSignal<EditorSettings | undefined>(
    initialHmrSession?.styleClipboard,
  );
  const [draft, setDraft] = createSignal<EditorDraft | undefined>(
    initialHmrSession?.draft,
  );
  const [selectedIds, setSelectedIds] = createSignal<string[]>(
    initialHmrSession?.selectedIds ?? [],
  );
  const [interaction, setInteraction] = createSignal<EditorInteraction>();
  const [snapGuides, setSnapGuides] = createSignal<SnapGuide[]>(
    initialHmrSession?.snapGuides ?? [],
  );
  const [selectionMarquee, setSelectionMarquee] = createSignal<Bounds | undefined>(
    initialHmrSession?.selectionMarquee,
  );
  const [selectionViewAction, setSelectionViewAction] =
    createSignal<SelectionViewAction>();
  const [hasLiveExpandedCanvas, setHasLiveExpandedCanvas] = createSignal(
    initialHmrSession?.hasLiveExpandedCanvas ?? false,
  );
  const [isExporting, setIsExporting] = createSignal(false);
  const [isCopying, setIsCopying] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const [isHistoryOpen, setIsHistoryOpen] = createSignal(
    initialHmrSession?.isHistoryOpen ?? true,
  );
  const [status, setStatus] = createSignal(
    initialHmrSession?.status ?? "Ready for paste, drop, or import.",
  );
  const [zoom, setZoom] = createSignal<ImageEditorZoom>(
    initialHmrSession?.zoom ?? "fit",
  );
  const [annotationClipboard, setAnnotationClipboard] =
    createSignal<ImageAnnotation[]>(initialHmrSession?.annotationClipboard ?? []);
  const [inlineEditingId, setInlineEditingId] = createSignal<string | undefined>(
    initialHmrSession?.inlineEditingId,
  );
  const [inlineEditOriginalAnnotations, setInlineEditOriginalAnnotations] =
    createSignal<ImageAnnotation[] | undefined>(
      initialHmrSession?.inlineEditOriginalAnnotations,
    );
  const [hasPendingInlineEdit, setHasPendingInlineEdit] = createSignal(
    initialHmrSession?.hasPendingInlineEdit ?? false,
  );
  const [isShortcutsOpen, setIsShortcutsOpen] = createSignal(
    initialHmrSession?.isShortcutsOpen ?? false,
  );
  const [isBeforeAfterMode, setIsBeforeAfterMode] = createSignal(
    initialHmrSession?.isBeforeAfterMode ?? false,
  );
  const [savedImages, setSavedImages] = createSignal<SavedImageSummary[]>([]);
  let keyboardNudgeTimer: number | undefined;
  let isMounted = true;

  const createHmrSession = (): ImageEditorHmrSession =>
    cloneImageEditorHmrSession({
      project: project(),
      history: history(),
      historyIndex: historyIndex(),
      activeTool: activeTool(),
      measureMode: measureMode(),
      snapMode: snapMode(),
      settings: settings(),
      stylePreferences: stylePreferences(),
      styleClipboard: styleClipboard(),
      draft: draft(),
      selectedIds: selectedIds(),
      snapGuides: snapGuides(),
      selectionMarquee: selectionMarquee(),
      hasLiveExpandedCanvas: hasLiveExpandedCanvas(),
      isHistoryOpen: isHistoryOpen(),
      status: status(),
      zoom: zoom(),
      annotationClipboard: annotationClipboard(),
      inlineEditingId: inlineEditingId(),
      inlineEditOriginalAnnotations: inlineEditOriginalAnnotations(),
      hasPendingInlineEdit: hasPendingInlineEdit(),
      isShortcutsOpen: isShortcutsOpen(),
      isBeforeAfterMode: isBeforeAfterMode(),
    });

  const restoreImageEditorSession = (session: ImageEditorHmrSession) => {
    const restoredSession = cloneImageEditorHmrSession(session);

    batch(() => {
      setProject(restoredSession.project);
      setHistory(restoredSession.history);
      setHistoryIndex(restoredSession.historyIndex);
      setActiveTool(restoredSession.activeTool);
      setMeasureMode(restoredSession.measureMode);
      setSnapMode(restoredSession.snapMode);
      setSettings(restoredSession.settings);
      setStylePreferences(restoredSession.stylePreferences);
      setStyleClipboard(restoredSession.styleClipboard);
      setDraft(restoredSession.draft);
      setSelectedIds(restoredSession.selectedIds);
      setInteraction(undefined);
      setSnapGuides(restoredSession.snapGuides);
      setSelectionMarquee(restoredSession.selectionMarquee);
      setSelectionViewAction(undefined);
      setHasLiveExpandedCanvas(restoredSession.hasLiveExpandedCanvas);
      setIsExporting(false);
      setIsCopying(false);
      setIsSaving(false);
      setIsHistoryOpen(restoredSession.isHistoryOpen);
      setStatus(restoredSession.status);
      setZoom(restoredSession.zoom);
      setAnnotationClipboard(restoredSession.annotationClipboard);
      setInlineEditingId(restoredSession.inlineEditingId);
      setInlineEditOriginalAnnotations(restoredSession.inlineEditOriginalAnnotations);
      setHasPendingInlineEdit(restoredSession.hasPendingInlineEdit);
      setIsShortcutsOpen(restoredSession.isShortcutsOpen);
      setIsBeforeAfterMode(restoredSession.isBeforeAfterMode);
    });
  };

  const hot = import.meta.hot;

  if (hot) {
    const handleBeforeFullReload = () => {
      if (isMounted) {
        persistImageEditorHmrSession(createHmrSession());
      }
    };

    hot.dispose((data) => {
      if (isMounted) {
        data[imageEditorHmrSessionKey] = createHmrSession();
      }
    });
    hot.on("vite:beforeFullReload", handleBeforeFullReload);

    onCleanup(() => {
      isMounted = false;
      hot.off("vite:beforeFullReload", handleBeforeFullReload);
    });
  }

  const selectedId = () => {
    const ids = selectedIds();

    return ids[ids.length - 1];
  };
  const setSelectedId = (id: string | undefined) => setSelectedIds(id ? [id] : []);
  const selectedAnnotations = createMemo(() => {
    const currentProject = project();

    if (!currentProject) {
      return [];
    }

    return selectedIds()
      .map((id) => currentProject.annotations.find((annotation) => annotation.id === id))
      .filter(
        (annotation): annotation is ImageAnnotation =>
          annotation !== undefined && !annotation.hidden,
      );
  });
  const selectedAnnotation = createMemo(() =>
    project()?.annotations.find((annotation) => annotation.id === selectedId()),
  );
  const activeStyleTool = createMemo<StylableImageEditorTool | undefined>(() => {
    const annotation = selectedAnnotation();

    if (annotation && annotation.type !== "image") {
      return annotation.type;
    }

    const tool = activeTool();
    return isStylableTool(tool) ? tool : undefined;
  });
  const activeBrandPalettes = createMemo(() =>
    mergeBrandPalettes(stylePreferences(), project()),
  );
  const selectionBounds = createMemo(() => getAnnotationUnionBounds(selectedAnnotations()));
  const inlineEditingAnnotation = createMemo(() => {
    const annotation = project()?.annotations.find(
      (candidate) => candidate.id === inlineEditingId(),
    );

    if (
      annotation?.type === "text" ||
      annotation?.type === "step" ||
      annotation?.type === "arrow" ||
      annotation?.type === "rectangle" ||
      annotation?.type === "ellipse" ||
      annotation?.type === "pixelate" ||
      annotation?.type === "erase"
    ) {
      return annotation;
    }

    return undefined;
  });
  const visibleInlineEditingAnnotation = createMemo(() => {
    const annotation = inlineEditingAnnotation();
    const tool = activeTool();

    if (!annotation || annotation.hidden || (tool !== "select" && !toolMatchesAnnotation(tool, annotation))) {
      return undefined;
    }

    return annotation;
  });
  const canUndo = createMemo(() => historyIndex() > 0);
  const canRedo = createMemo(() => historyIndex() < history().length - 1);
  const activeMeasureContext = createMemo(() => {
    const currentDraft = draft();
    const currentInteraction = interaction();

    if (currentInteraction?.type === "measure-endpoint") {
      return {
        anchor: currentInteraction.anchor,
        axis: currentInteraction.axis,
        startSnap: undefined,
      };
    }

    if (currentDraft?.type === "measure") {
      return {
        anchor: currentDraft.start,
        axis: currentDraft.axis,
        startSnap: currentDraft.startSnap,
      };
    }

    if (currentInteraction?.type === "measure-anchor") {
      return {
        anchor: currentInteraction.start,
        axis: currentInteraction.axis,
        startSnap: currentInteraction.startSnap,
      };
    }

    return {
      anchor: undefined,
      axis: undefined,
      startSnap: undefined,
    };
  });

  createEffect(() => {
    const currentProject = project();
    const ids = selectedIds();

    if (!currentProject || ids.length === 0) {
      return;
    }

    const availableIds = new Set(currentProject.annotations.map((annotation) => annotation.id));
    const nextIds = ids.filter((id) => availableIds.has(id));

    if (nextIds.length !== ids.length) {
      setSelectedIds(nextIds);
    }
  });

  createEffect(() => {
    const annotation = selectedAnnotation();

    if (annotation) {
      const nextSettings = settingsFromAnnotation(annotation, untrack(settings));

      if (!sameSettings(nextSettings, untrack(settings))) {
        setSettings(nextSettings);
      }
    }
  });

  onMount(() => {
    const persistedSession =
      initialHmrSession || project()
        ? undefined
        : readPersistedImageEditorHmrSession();

    if (persistedSession) {
      restoreImageEditorSession(persistedSession);
    } else if (!initialHmrSession) {
      setStylePreferences(loadStylePreferences(project()));
    }

    shellRef?.focus();
    void loadSavedImages();

    const handlePaste = (event: ClipboardEvent) => {
      void handleClipboardPaste(event);
    };

    window.addEventListener("paste", handlePaste);
    window.addEventListener("keydown", handleKeyboardShortcut);

    onCleanup(() => {
      clearKeyboardNudgeTimer();
      window.removeEventListener("paste", handlePaste);
      window.removeEventListener("keydown", handleKeyboardShortcut);
    });
  });

  const handleClipboardPaste = async (event: ClipboardEvent) => {
    if (isEditableTarget(event.target)) {
      return;
    }

    const clipboardData = event.clipboardData;

    if (!clipboardData) {
      return;
    }

    const pngDataFallback = extractPngDataFromText(
      clipboardData.getData("text/plain"),
    );
    const files = getClipboardImageFiles(clipboardData);

    if (files.length === 0) {
      if (pngDataFallback) {
        event.preventDefault();
        restorePngDataProject(
          pngDataFallback.project,
          pngDataFallback.historyLog,
          pngDataFallback.history,
        );
        setStatus("Opened editable PNGDATA project.");
      }

      return;
    }

    event.preventDefault();
    await handlePastedImage(files[0], pngDataFallback);
  };

  const clearKeyboardNudgeTimer = () => {
    if (keyboardNudgeTimer === undefined) {
      return;
    }

    window.clearTimeout(keyboardNudgeTimer);
    keyboardNudgeTimer = undefined;
  };

  const commitPendingKeyboardNudge = () => {
    if (keyboardNudgeTimer === undefined) {
      return;
    }

    clearKeyboardNudgeTimer();
    commitCurrentProject("Nudged layer", { fitToContent: true });
  };

  const scheduleKeyboardNudgeCommit = () => {
    clearKeyboardNudgeTimer();
    keyboardNudgeTimer = window.setTimeout(() => {
      keyboardNudgeTimer = undefined;
      commitCurrentProject("Nudged layer", { fitToContent: true });
    }, 350);
  };

  const clearInteractionGuides = () => {
    setSnapGuides([]);
    setSelectionMarquee(undefined);
  };

  const noteLiveExpansion = (
    beforeProject: ImageEditorProject,
    afterProject: ImageEditorProject,
  ) => {
    if (
      beforeProject.width !== afterProject.width ||
      beforeProject.height !== afterProject.height ||
      getBaseImageOffset(beforeProject).x !== getBaseImageOffset(afterProject).x ||
      getBaseImageOffset(beforeProject).y !== getBaseImageOffset(afterProject).y
    ) {
      setHasLiveExpandedCanvas(true);
    }
  };

  const setSelection = (ids: string[], primaryId?: string) => {
    const currentProject = project();

    if (!currentProject) {
      setSelectedIds([]);
      return;
    }

    const availableIds = new Set(currentProject.annotations.map((annotation) => annotation.id));
    const nextIds = ids.filter((id, index) => availableIds.has(id) && ids.indexOf(id) === index);
    const primary =
      primaryId && nextIds.includes(primaryId)
        ? primaryId
        : nextIds[nextIds.length - 1];
    const orderedIds =
      primary === undefined
        ? nextIds
        : [...nextIds.filter((id) => id !== primary), primary];

    setSelectedIds(orderedIds);
  };

  const toggleSelection = (id: string) => {
    const currentIds = selectedIds();

    if (currentIds.includes(id)) {
      setSelection(currentIds.filter((candidate) => candidate !== id));
      return;
    }

    setSelection([...currentIds, id], id);
  };

  const selectedLayerIdsForMutation = (fallbackId?: string) => {
    const ids = selectedIds();

    if (fallbackId && ids.includes(fallbackId)) {
      return ids;
    }

    return fallbackId ? [fallbackId] : ids;
  };

  const commitProject = (
    nextProject: ImageEditorProject,
    label: string,
    options: CommitProjectOptions = {},
  ) => {
    clearKeyboardNudgeTimer();
    const timestamp = Date.now();
    const expandedProject = options.preserveCanvas
      ? nextProject
      : options.fitToContent
        ? fitProjectToContent(nextProject)
        : expandProjectToAnnotations(nextProject);
    const snapshot = cloneProject({
      ...expandedProject,
      updatedAt: timestamp,
    });
    const currentIndex = historyIndex();
    const nextHistory = [
      ...history().slice(0, currentIndex + 1),
      {
        id: createEditorId("history"),
        label,
        timestamp,
        project: cloneProject(snapshot),
      },
    ];

    batch(() => {
      setProject(snapshot);
      setStylePreferences(loadStylePreferences(snapshot));
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
      setStatus(label);
      clearInteractionGuides();
      setHasLiveExpandedCanvas(false);
    });
  };

  const commitCurrentProject = (
    label: string,
    options: CommitProjectOptions = {},
  ) => {
    const currentProject = project();

    if (!currentProject) {
      return;
    }

    commitProject(currentProject, label, options);
  };

  const restoreHistoryEntry = (index: number) => {
    const entry = history()[index];

    if (!entry) {
      return;
    }

    clearKeyboardNudgeTimer();
    batch(() => {
      setDraft(undefined);
      setInteraction(undefined);
      setSelectedId(undefined);
      setInlineEditingId(undefined);
      clearInteractionGuides();
      setProject(cloneProject(entry.project));
      setHistoryIndex(index);
      setStatus(`Restored: ${entry.label}`);
    });
  };

  const importFiles = async (
    files: File[],
    label: string,
    pngDataFallback?: ImageEditorPngPayload,
  ) => {
    const file = files.find((candidate) => candidate.type.startsWith("image/"));

    if (!file) {
      setStatus("No image file found.");
      return;
    }

    try {
      const embeddedPayload = await extractPngDataFromFile(file);
      const restoredPayload = embeddedPayload ?? pngDataFallback;

      if (restoredPayload) {
        restorePngDataProject(
          restoredPayload.project,
          restoredPayload.historyLog,
          restoredPayload.history,
        );
        setStatus("Opened editable PNGDATA project.");
        return;
      }

      const dataUrl = await readFileAsDataUrl(file);
      const image = await loadImageElement(dataUrl);
      const now = Date.now();
      const nextProject: ImageEditorProject = {
        version: 1,
        id: createEditorId("project"),
        name: file.name || "Pasted image",
        width: image.naturalWidth,
        height: image.naturalHeight,
        baseImage: {
          dataUrl,
          mimeType: file.type || "image/png",
          width: image.naturalWidth,
          height: image.naturalHeight,
        },
        annotations: [],
        createdAt: now,
        updatedAt: now,
      };

      batch(() => {
        setSelectedId(undefined);
        setDraft(undefined);
        setInteraction(undefined);
        setInlineEditingId(undefined);
        setActiveTool("select");
        setZoom("fit");
      });
      commitProject(nextProject, label);
      setStatus(`${label}: ${image.naturalWidth} x ${image.naturalHeight}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to import image.");
    }
  };

  const pasteMeasureTestImage = () => {
    const nextProject = createMeasureTestProject();

    batch(() => {
      setSelectedId(undefined);
      setDraft(undefined);
      setInteraction(undefined);
      setInlineEditingId(undefined);
      setActiveTool("measure");
      setMeasureMode("edge");
      setZoom("fit");
    });
    commitProject(nextProject, "Created measure test image", { preserveCanvas: true });
    setStatus("Measure test image: line gaps are labeled in image pixels.");
  };

  const restorePngDataProject = (
    restoredProject: ImageEditorProject,
    restoredLog: Array<{ id: string; label: string; timestamp: number }>,
    restoredHistory?: HistoryEntry[],
  ) => {
    const snapshot = cloneProject({
      ...restoredProject,
      updatedAt: Date.now(),
    });
    const logEntries =
      restoredHistory?.map((entry) => ({
        ...entry,
        project: cloneProject(entry.project),
      })) ??
      restoredLog.map((entry) => ({
        ...entry,
        project: cloneProject(snapshot),
      }));
    const openedEntry: HistoryEntry = {
      id: createEditorId("history"),
      label: "Opened PNGDATA project",
      timestamp: snapshot.updatedAt,
      project: cloneProject(snapshot),
    };
    const nextHistory = [...logEntries, openedEntry];

    batch(() => {
      setProject(snapshot);
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
      setSelectedId(undefined);
      setDraft(undefined);
      setInteraction(undefined);
      setInlineEditingId(undefined);
      setActiveTool("select");
      setZoom("fit");
    });
  };

  const chooseFile = () => {
    fileInputRef?.click();
  };

  const handleToolChange = (tool: ImageEditorTool) => {
    if (inlineEditingId()) {
      commitPendingInlineEdit();
    }

    batch(() => {
      if (tool !== "select") {
        setSelectedId(undefined);
      }

      if (tool !== "crop" && draft()?.type === "crop") {
        setDraft(undefined);
        setInteraction(undefined);
      }

      clearInteractionGuides();
      setActiveTool(tool);

      if (isStylableTool(tool)) {
        setSettings(toolDefaultSettings(tool, stylePreferences()));
      }
    });
    setStatus(
      tool === "measure"
        ? `Measure tool: ${measureMode() === "edge" ? "edge snap" : "point to point"}.`
        : `${toolLabels[tool]} tool`,
    );
  };

  const handleMeasureModeChange = (mode: MeasureMode) => {
    if (mode === measureMode()) {
      return;
    }

    const selected = selectedAnnotation();
    const currentProject = project();

    setMeasureMode(mode);
    batch(() => {
      setDraft(undefined);
      if (interaction()?.type === "measure-anchor") {
        setInteraction(undefined);
      }
    });

    if (selected?.type === "measure" && currentProject) {
      const nextAnnotation = normalizeMeasureMode(selected, mode);

      commitProject(
        {
          ...currentProject,
          annotations: currentProject.annotations.map((annotation) =>
            annotation.id === selected.id ? nextAnnotation : annotation,
          ),
        },
        "Changed measurement mode",
      );
      return;
    }

    setStatus(
      mode === "edge"
        ? "Measure mode: edge snap."
        : "Measure mode: point to point.",
    );
  };

  const handleSnapModeChange = (mode: SnapMode) => {
    setSnapMode(mode);
    setSnapGuides([]);
    setStatus(
      mode === "off"
        ? "Object snapping off."
        : mode === "both"
          ? "Object snapping on for X and Y."
          : mode === "horizontal"
            ? "Object snapping on for X positions."
            : "Object snapping on for Y positions.",
    );
  };

  const handleFileInput = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = "";
    void importFiles(files, "Imported image");
  };

  const handlePointerDown = (
    point: Point,
    event: PointerEvent,
    measureInfo: MeasurePointerInfo | undefined,
  ) => {
    event.preventDefault();

    if (inlineEditingId()) {
      commitPendingInlineEdit();
      batch(() => {
        setInlineEditingId(undefined);
        setInlineEditOriginalAnnotations(undefined);
        setHasPendingInlineEdit(false);
      });
    }

    const currentProject = project();

    if (!currentProject) {
      return;
    }

    const tool = activeTool();
    const currentDraft = draft();
    const currentInteraction = interaction();

    if (tool === "measure" && currentInteraction?.type === "measure-anchor") {
      const completedDraft = updateAnchoredMeasureDraft(
        currentDraft,
        currentInteraction,
        point,
        measureInfo,
        settings(),
      );

      batch(() => {
        setInteraction(undefined);
        setDraft(undefined);
      });

      if (!isUsableDraft(completedDraft)) {
        setStatus("Measurement is too short.");
        return;
      }

      commitProject(
        {
          ...currentProject,
          annotations: [...currentProject.annotations, completedDraft],
        },
        "Added Measure",
      );
      setSelectedId(completedDraft.id);
      return;
    }

    if (tool === "crop" && currentDraft?.type === "crop") {
      const cropBounds = normalizeRect(
        currentDraft.x,
        currentDraft.y,
        currentDraft.width,
        currentDraft.height,
      );
      const cropResizeHandle = getBoundsResizeHandleAt(cropBounds, point);

      if (cropResizeHandle) {
        setInteraction({
          type: "crop-resize",
          handle: cropResizeHandle,
          start: point,
          initialBounds: cropBounds,
        });
        return;
      }

      if (isPointInBounds(point, cropBounds)) {
        setInteraction({
          type: "crop-move",
          start: point,
          initialBounds: cropBounds,
        });
        return;
      }
    }

    const selected = selectedAnnotation();
    const measureEndpointHandle =
      selected?.type === "measure"
        ? getMeasureEndpointHandleAt(selected, point)
        : undefined;

    if (selected?.type === "measure" && measureEndpointHandle) {
      const anchor =
        measureEndpointHandle === "start" ? selected.end : selected.start;

      setInteraction({
        type: "measure-endpoint",
        annotationId: selected.id,
        endpoint: measureEndpointHandle,
        start: point,
        anchor,
        axis:
          selected.axis ??
          inferMeasureAxis(
            anchor,
            measureEndpointHandle === "start" ? selected.start : selected.end,
            "horizontal",
          ),
        originalAnnotations: structuredClone(currentProject.annotations),
      });
      setActiveTool("select");
      return;
    }

    const currentSelectionIds = selectedIds();
    const currentSelectionBounds = selectionBounds();
    const groupResizeHandle =
      currentSelectionIds.length > 1 && currentSelectionBounds
        ? getBoundsResizeHandleAt(currentSelectionBounds, point)
        : undefined;

    if (groupResizeHandle && currentSelectionBounds) {
      setInteraction({
        type: "resize",
        annotationIds: currentSelectionIds,
        handle: groupResizeHandle,
        start: point,
        initialBounds: currentSelectionBounds,
        originalAnnotations: structuredClone(currentProject.annotations),
      });
      setActiveTool("select");
      return;
    }

    const resizeHandle = selected ? getResizeHandleAt(selected, point) : undefined;

    if (selected && resizeHandle) {
      setInteraction({
        type: "resize",
        annotationIds: [selected.id],
        handle: resizeHandle,
        start: point,
        initialBounds: getAnnotationBounds(selected),
        originalAnnotations: structuredClone(currentProject.annotations),
      });
      setActiveTool("select");
      return;
    }

    if (tool === "select") {
      const hit = findHitAnnotation(currentProject.annotations, point);
      setInlineEditingId(undefined);
      const isAdditiveSelection = event.shiftKey || event.metaKey || event.ctrlKey;

      if (hit) {
        if (isAdditiveSelection) {
          toggleSelection(hit.id);
          setStatus("Updated selection.");
          return;
        }

        const hitSelectionIds = selectedIds().includes(hit.id)
          ? selectedIds()
          : [hit.id];

        setSelection(hitSelectionIds, hit.id);

        if (event.altKey) {
          const duplicates = hitSelectionIds
            .map((id) =>
              currentProject.annotations.find((annotation) => annotation.id === id),
            )
            .filter((annotation): annotation is ImageAnnotation => annotation !== undefined)
            .map((annotation) => ({
              ...structuredClone(annotation),
              id: createEditorId("layer"),
              createdAt: Date.now(),
              hidden: false,
            }));
          const duplicateIds = duplicates.map((annotation) => annotation.id);
          const nextAnnotations = [...currentProject.annotations, ...duplicates];

          batch(() => {
            setProject({
              ...currentProject,
              annotations: nextAnnotations,
              updatedAt: Date.now(),
            });
            setSelectedIds(duplicateIds);
            setInteraction({
              type: "move",
              annotationIds: duplicateIds,
              start: point,
              originalAnnotations: structuredClone(nextAnnotations),
              commitLabel: duplicateIds.length > 1 ? "Duplicated layers" : "Duplicated layer",
            });
          });
          return;
        }

        setInteraction({
          type: "move",
          annotationIds: hitSelectionIds,
          start: point,
          originalAnnotations: structuredClone(currentProject.annotations),
        });
        return;
      }

      setInteraction({
        type: "marquee",
        start: point,
        additive: isAdditiveSelection,
        baseSelectionIds: selectedIds(),
      });
      setSelectionMarquee(normalizeRect(point.x, point.y, 0, 0));
      if (!isAdditiveSelection) {
        setSelectedId(undefined);
      }
      return;
    }

    const sameToolHit = findHitAnnotation(
      currentProject.annotations,
      point,
      (annotation) => toolMatchesAnnotation(tool, annotation),
    );

    if (sameToolHit) {
      batch(() => {
        setSelectedId(sameToolHit.id);
        setInlineEditingId(undefined);
        setInteraction({
          type: "move",
          annotationIds: [sameToolHit.id],
          start: point,
          originalAnnotations: structuredClone(currentProject.annotations),
        });
      });
      setStatus(`Selected ${annotationTypeLabel(sameToolHit)} layer.`);
      return;
    }

    if (tool === "text") {
      const annotation = createTextAnnotation(point, settings());
      commitProject(
        {
          ...currentProject,
          annotations: [...currentProject.annotations, annotation],
        },
        "Added text",
      );
      setSelectedId(annotation.id);
      startInlineEditFor(annotation.id, currentProject.annotations);
      return;
    }

    if (tool === "step") {
      const annotation = createStepAnnotation(
        point,
        settings(),
        currentProject.annotations,
      );
      commitProject(
        {
          ...currentProject,
          annotations: [...currentProject.annotations, annotation],
        },
        "Added step marker",
      );
      setSelectedId(annotation.id);
      return;
    }

    const nextDraft = createDraftAnnotation(tool, point, settings(), {
      measureMode: measureMode(),
      measureInfo,
    });

    if (!nextDraft) {
      return;
    }

    batch(() => {
      setSelectedId(undefined);
      setDraft(nextDraft);
      setHasLiveExpandedCanvas(false);
      setInteraction({
        type: "draw",
        tool,
        start: point,
      });
    });
  };

  const handlePointerMove = (
    point: Point,
    event: PointerEvent,
    measureInfo: MeasurePointerInfo | undefined,
  ) => {
    event.preventDefault();
    const currentInteraction = interaction();
    const currentProject = project();

    if (!currentInteraction || !currentProject) {
      return;
    }

    if (currentInteraction.type === "move") {
      const deltaX = point.x - currentInteraction.start.x;
      const deltaY = point.y - currentInteraction.start.y;
      const originalSelectionBounds = getAnnotationUnionBounds(
        currentInteraction.originalAnnotations.filter((annotation) =>
          currentInteraction.annotationIds.includes(annotation.id),
        ),
      );
      const snapResult = originalSelectionBounds
        ? snapBounds(
            currentProject,
            moveBounds(originalSelectionBounds, deltaX, deltaY),
            currentInteraction.annotationIds,
          )
        : undefined;
      const finalDeltaX = originalSelectionBounds && snapResult
        ? snapResult.bounds.x - originalSelectionBounds.x
        : deltaX;
      const finalDeltaY = originalSelectionBounds && snapResult
        ? snapResult.bounds.y - originalSelectionBounds.y
        : deltaY;
      const nextProject = {
        ...currentProject,
        annotations: currentInteraction.originalAnnotations.map((annotation) =>
          currentInteraction.annotationIds.includes(annotation.id)
            ? moveAnnotation(annotation, finalDeltaX, finalDeltaY)
            : annotation,
        ),
        updatedAt: Date.now(),
      };
      const expanded = expandProjectForInteraction(nextProject, currentInteraction);

      batch(() => {
        setProject(expanded.project);
        setInteraction(expanded.interaction);
        setSnapGuides(snapResult?.guides ?? []);
      });
      noteLiveExpansion(currentProject, expanded.project);
      return;
    }

    if (currentInteraction.type === "resize") {
      const resizedBounds = resizeBounds(
        currentInteraction.initialBounds,
        currentInteraction.handle,
        point,
      );
      const snapResult = snapBounds(
        currentProject,
        resizedBounds,
        currentInteraction.annotationIds,
      );
      const nextProject = {
        ...currentProject,
        annotations: currentInteraction.originalAnnotations.map((annotation) =>
          currentInteraction.annotationIds.includes(annotation.id)
            ? transformAnnotationToBounds(
                annotation,
                currentInteraction.initialBounds,
                snapResult.bounds,
              )
            : annotation,
        ),
        updatedAt: Date.now(),
      };
      const expanded = expandProjectForInteraction(nextProject, currentInteraction);

      batch(() => {
        setProject(expanded.project);
        setInteraction(expanded.interaction);
        setSnapGuides(snapResult.guides);
      });
      noteLiveExpansion(currentProject, expanded.project);
      return;
    }

    if (currentInteraction.type === "marquee") {
      const marqueeBounds = normalizeRect(
        currentInteraction.start.x,
        currentInteraction.start.y,
        point.x - currentInteraction.start.x,
        point.y - currentInteraction.start.y,
      );
      const hitIds = currentProject.annotations
        .filter(
          (annotation) =>
            !annotation.hidden && intersects(getAnnotationBounds(annotation), marqueeBounds),
        )
        .map((annotation) => annotation.id);
      const nextIds = currentInteraction.additive
        ? [...currentInteraction.baseSelectionIds, ...hitIds]
        : hitIds;

      batch(() => {
        setSelectionMarquee(marqueeBounds);
        setSelection(
          nextIds,
          hitIds[hitIds.length - 1] ??
            currentInteraction.baseSelectionIds[
              currentInteraction.baseSelectionIds.length - 1
            ],
        );
      });
      return;
    }

    if (currentInteraction.type === "measure-endpoint") {
      const nextProject = {
        ...currentProject,
        annotations: currentInteraction.originalAnnotations.map((annotation) =>
          annotation.id === currentInteraction.annotationId
            ? resizeMeasureEndpoint(annotation, currentInteraction, point, measureInfo)
            : annotation,
        ),
        updatedAt: Date.now(),
      };
      const expanded = expandProjectForInteraction(nextProject, currentInteraction);

      batch(() => {
        setProject(expanded.project);
        setInteraction(expanded.interaction);
      });
      noteLiveExpansion(currentProject, expanded.project);
      return;
    }

    if (currentInteraction.type === "crop-move") {
      const deltaX = point.x - currentInteraction.start.x;
      const deltaY = point.y - currentInteraction.start.y;
      const bounds = clampMovableBoundsToProject(
        moveBounds(currentInteraction.initialBounds, deltaX, deltaY),
        currentProject,
      );

      setDraft(createCropDraftFromBounds(bounds));
      return;
    }

    if (currentInteraction.type === "crop-resize") {
      const bounds = clampBoundsToProject(
        resizeBounds(
          currentInteraction.initialBounds,
          currentInteraction.handle,
          point,
        ),
        currentProject,
      );

      setDraft(createCropDraftFromBounds(bounds));
      return;
    }

    const currentDraft = draft();

    if (!currentDraft) {
      return;
    }

    if (currentInteraction.type === "measure-anchor") {
      const nextDraft = updateAnchoredMeasureDraft(
        currentDraft,
        currentInteraction,
        point,
        measureInfo,
        settings(),
      );
      const expanded = expandProjectForDraft(
        currentProject,
        nextDraft,
        currentInteraction,
      );

      batch(() => {
        setProject(expanded.project);
        setDraft(expanded.draft);
        setInteraction(expanded.interaction);
      });
      return;
    }

    const rawNextDraft = updateDraft(currentDraft, currentInteraction.start, point, {
      centerFromStart: event.altKey,
      constrain: event.shiftKey,
      measureInfo,
    });
    const snapDraftResult =
      rawNextDraft.type === "crop"
        ? { draft: rawNextDraft, guides: [] }
        : snapDraft(currentProject, rawNextDraft);
    const nextDraft = snapDraftResult.draft;

    if (nextDraft.type === "crop") {
      setSnapGuides([]);
      setDraft(nextDraft);
      return;
    }

    const expanded = expandProjectForDraft(
      currentProject,
      nextDraft,
      currentInteraction,
    );

    batch(() => {
      setProject(expanded.project);
      setDraft(expanded.draft);
      setInteraction(expanded.interaction);
      setSnapGuides(snapDraftResult.guides);
    });
    noteLiveExpansion(currentProject, expanded.project);
  };

  const handlePointerUp = (
    point: Point,
    event: PointerEvent,
    measureInfo: MeasurePointerInfo | undefined,
  ) => {
    event.preventDefault();
    const currentInteraction = interaction();

    if (!currentInteraction) {
      return;
    }

    if (
      currentInteraction.type === "crop-move" ||
      currentInteraction.type === "crop-resize"
    ) {
      finishCropAdjustment(currentInteraction, point);
      return;
    }

    if (currentInteraction.type === "move") {
      finishMoveInteraction(currentInteraction, point);
      return;
    }

    if (currentInteraction.type === "resize") {
      finishResizeInteraction(currentInteraction, point);
      return;
    }

    if (currentInteraction.type === "marquee") {
      finishMarqueeInteraction(currentInteraction, point);
      return;
    }

    if (currentInteraction.type === "measure-endpoint") {
      finishMeasureEndpointInteraction(currentInteraction, point);
      return;
    }

    if (currentInteraction.type === "measure-anchor") {
      return;
    }

    const currentDraft = draft();
    const currentProject = project();

    if (
      currentInteraction.type === "draw" &&
      currentInteraction.tool === "measure" &&
      currentDraft?.type === "measure" &&
      (currentDraft.mode ?? measureMode()) === "edge" &&
      distance(currentInteraction.start, point) < 5
    ) {
      const anchorDraft = {
        ...currentDraft,
        end: currentDraft.start,
        endSnap: undefined,
      };

      batch(() => {
        setDraft(anchorDraft);
        setInteraction({
          type: "measure-anchor",
          start: anchorDraft.start,
          startSnap: anchorDraft.startSnap,
          axis: measureInfo?.axis ?? anchorDraft.axis,
        });
      });
      setStatus("First edge locked. Click the opposite edge.");
      return;
    }

    if (currentDraft?.type === "crop" && currentProject) {
      const cropBounds = clampBoundsToProject(
        normalizeRect(
          currentDraft.x,
          currentDraft.y,
          currentDraft.width,
          currentDraft.height,
        ),
        currentProject,
      );

      batch(() => {
        setInteraction(undefined);
        setDraft(
          cropBounds.width >= 8 && cropBounds.height >= 8
            ? createCropDraftFromBounds(cropBounds)
            : undefined,
        );
        setSelectedId(undefined);
        setActiveTool("crop");
      });
      setStatus(
        cropBounds.width >= 8 && cropBounds.height >= 8
          ? `Crop ${Math.round(cropBounds.width)} x ${Math.round(cropBounds.height)} ready.`
          : "Crop area is too small.",
      );
      return;
    }

    batch(() => {
      setInteraction(undefined);
      setDraft(undefined);
      clearInteractionGuides();
    });

    if (
      !currentDraft ||
      !currentProject ||
      currentDraft.type === "crop" ||
      !isUsableDraft(currentDraft)
    ) {
      return;
    }

    commitProject(
      {
        ...currentProject,
        annotations: [...currentProject.annotations, currentDraft],
      },
      `Added ${annotationTypeLabel(currentDraft)}`,
      hasLiveExpandedCanvas() ? { fitToContent: true } : {},
    );
    setHasLiveExpandedCanvas(false);
    setSelectedId(currentDraft.id);
  };

  const finishMoveInteraction = (currentInteraction: MoveInteraction, point: Point) => {
    const currentProject = project();
    const movedDistance = distance(currentInteraction.start, point);

    batch(() => {
      setInteraction(undefined);
      setDraft(undefined);
      clearInteractionGuides();
    });

    if (!currentProject) {
      return;
    }

    if (movedDistance < 1.5) {
      const nextProject = {
        ...currentProject,
        annotations: currentInteraction.originalAnnotations,
      };

      if (currentInteraction.commitLabel) {
        commitProject(nextProject, currentInteraction.commitLabel, {
          fitToContent: true,
        });
      } else {
        setProject(nextProject);
      }
      return;
    }

    commitProject(
      currentProject,
      currentInteraction.commitLabel ??
        (currentInteraction.annotationIds.length > 1 ? "Moved layers" : "Moved layer"),
      { fitToContent: true },
    );
  };

  const finishResizeInteraction = (
    currentInteraction: ResizeInteraction,
    point: Point,
  ) => {
    const currentProject = project();
    const movedDistance = distance(currentInteraction.start, point);

    batch(() => {
      setInteraction(undefined);
      setDraft(undefined);
      clearInteractionGuides();
    });

    if (!currentProject) {
      return;
    }

    if (movedDistance < 1.5) {
      setProject({
        ...currentProject,
        annotations: currentInteraction.originalAnnotations,
      });
      return;
    }

    commitProject(
      currentProject,
      currentInteraction.annotationIds.length > 1 ? "Resized selection" : "Resized layer",
      { fitToContent: true },
    );
  };

  const finishMarqueeInteraction = (
    currentInteraction: MarqueeInteraction,
    point: Point,
  ) => {
    const movedDistance = distance(currentInteraction.start, point);

    batch(() => {
      setInteraction(undefined);
      clearInteractionGuides();
    });

    if (movedDistance < 3) {
      if (!currentInteraction.additive) {
        setSelectedId(undefined);
      }
      setStatus("Selection cleared.");
      return;
    }

    const count = selectedIds().length;
    setStatus(count === 1 ? "Selected 1 layer." : `Selected ${count} layers.`);
  };

  const finishMeasureEndpointInteraction = (
    currentInteraction: MeasureEndpointInteraction,
    point: Point,
  ) => {
    const currentProject = project();
    const movedDistance = distance(currentInteraction.start, point);

    batch(() => {
      setInteraction(undefined);
      setDraft(undefined);
      clearInteractionGuides();
    });

    if (!currentProject) {
      return;
    }

    if (movedDistance < 1.5) {
      setProject({
        ...currentProject,
        annotations: currentInteraction.originalAnnotations,
      });
      return;
    }

    commitProject(currentProject, "Adjusted measurement", { fitToContent: true });
  };

  const finishCropAdjustment = (
    currentInteraction: CropMoveInteraction | CropResizeInteraction,
    point: Point,
  ) => {
    const movedDistance = distance(currentInteraction.start, point);

    setInteraction(undefined);
    clearInteractionGuides();

    if (movedDistance >= 1.5) {
      setStatus("Adjusted crop boundary.");
    }
  };

  const applyCropDraft = () => {
    const currentDraft = draft();
    const currentProject = project();

    if (!currentProject || currentDraft?.type !== "crop") {
      setStatus("Draw a crop boundary first.");
      return;
    }

    void cropProject(currentDraft, currentProject);
  };

  const cancelCropDraft = () => {
    batch(() => {
      setDraft(undefined);
      setInteraction(undefined);
      setActiveTool("select");
    });
    setStatus("Canceled crop.");
  };

  const cropProject = async (
    cropDraft: CropDraft,
    currentProject: ImageEditorProject,
  ) => {
    const rawBounds = normalizeRect(
      cropDraft.x,
      cropDraft.y,
      cropDraft.width,
      cropDraft.height,
    );
    const bounds = clampBoundsToProject(rawBounds, currentProject);

    if (bounds.width < 8 || bounds.height < 8) {
      return;
    }

    try {
      const image = await loadImageElement(currentProject.baseImage.dataUrl);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bounds.width);
      canvas.height = Math.round(bounds.height);
      const context = canvas.getContext("2d");

      if (!context) {
        setStatus("Unable to crop image.");
        return;
      }

      const baseImageOffset = getBaseImageOffset(currentProject);

      context.drawImage(
        image,
        baseImageOffset.x - bounds.x,
        baseImageOffset.y - bounds.y,
        image.naturalWidth,
        image.naturalHeight,
      );

      const croppedBaseImage = canvas.toDataURL("image/png");
      const viewportBounds = { x: 0, y: 0, width: bounds.width, height: bounds.height };
      const adjustedAnnotations = currentProject.annotations
        .map((annotation) => moveAnnotation(annotation, -bounds.x, -bounds.y))
        .filter((annotation) => intersects(getAnnotationBounds(annotation), viewportBounds));

      commitProject(
        {
          ...currentProject,
          width: Math.round(bounds.width),
          height: Math.round(bounds.height),
          baseImage: {
            dataUrl: croppedBaseImage,
            mimeType: "image/png",
            width: Math.round(bounds.width),
            height: Math.round(bounds.height),
            offsetX: 0,
            offsetY: 0,
          },
          annotations: adjustedAnnotations,
        },
        "Cropped canvas",
      );
      batch(() => {
        setDraft(undefined);
        setInteraction(undefined);
        setSelectedId(undefined);
        setActiveTool("select");
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to crop image.");
    }
  };

  const exportPng = async () => {
    const pngExport = await buildPngExport();

    if (!pngExport) {
      return;
    }

    const currentProject = project();

    if (!currentProject) {
      return;
    }

    const { blob } = pngExport;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${downloadBaseName(currentProject.name)}-annotated.png`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 30000);
    setStatus("Exported PNG with PNGDATA.");
  };

  const copyPng = async () => {
    const pngExport = await buildPngExport();

    if (!pngExport) {
      return;
    }

    if (!("ClipboardItem" in window) || !navigator.clipboard?.write) {
      setStatus("Clipboard image writing is not available in this browser.");
      return;
    }

    try {
      const pngDataText = serializePngDataPayload(pngExport.payload);

      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": pngExport.blob,
          "text/plain": new Blob([pngDataText], { type: "text/plain" }),
        }),
      ]);
      setStatus("Copied PNG with PNGDATA.");
    } catch {
      setStatus("Clipboard copy was blocked by the browser.");
    }
  };

  const buildPngExport = async (): Promise<PngExport | undefined> => {
    commitPendingKeyboardNudge();
    const currentProject = project();

    if (!currentProject) {
      return undefined;
    }

    try {
      setIsExporting(true);
      const renderedBlob = await renderProjectToPngBlob(currentProject, {
        backgroundColor: "#ffffff",
      });
      const payload = createPngDataPayload(
        currentProject,
        history().slice(0, historyIndex() + 1),
      );
      const blob = await appendPngDataToBlob(renderedBlob, payload);

      return { blob, payload };
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to export image.");
      return undefined;
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = () => {
    void exportPng();
  };

  const handleCopy = () => {
    setIsCopying(true);
    void copyPng().finally(() => setIsCopying(false));
  };

  const loadSavedImages = async () => {
    try {
      const response = await fetch("/api/image-editor/saved-images");

      if (!response.ok) {
        throw new Error("Unable to load saved images.");
      }

      const payload = (await response.json()) as { images?: SavedImageSummary[] };
      setSavedImages(payload.images ?? []);
    } catch {
      setSavedImages([]);
    }
  };

  const saveImageToServer = async () => {
    setIsSaving(true);

    try {
      const pngExport = await buildPngExport();
      const currentProject = project();

      if (!pngExport || !currentProject) {
        return;
      }

      const formData = new FormData();
      formData.append(
        "file",
        pngExport.blob,
        `${downloadBaseName(currentProject.name)}-annotated.png`,
      );
      formData.append(
        "metadata",
        JSON.stringify({
          name: currentProject.name,
          width: currentProject.width,
          height: currentProject.height,
        }),
      );

      const response = await fetch("/api/image-editor/saved-images", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Unable to save image.");
      }

      const payload = (await response.json()) as {
        image?: SavedImageSummary;
        images?: SavedImageSummary[];
      };

      if (payload.images) {
        setSavedImages(payload.images);
      } else if (payload.image) {
        setSavedImages((images) => [payload.image as SavedImageSummary, ...images]);
      }

      setStatus("Saved PNG to server.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save image.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    void saveImageToServer();
  };

  const updateStylePreferences = (
    updater: (current: ImageEditorStylePreferences) => ImageEditorStylePreferences,
  ) => {
    setStylePreferences((current) => {
      const next = updater(current);
      saveStylePreferences(next);
      return next;
    });
  };

  const rememberStyleColors = (patch: Partial<EditorSettings>) => {
    if (patch.color) {
      updateStylePreferences((current) => withRecentColor(current, patch.color ?? "", "stroke"));
    }

    if (patch.fillColor) {
      updateStylePreferences((current) => withRecentColor(current, patch.fillColor ?? "", "fill"));
    }
  };

  const handleZoomChange = (nextZoom: ImageEditorZoom) => {
    if (!project()) {
      return;
    }

    setZoom(nextZoom);
    setStatus(nextZoom === "fit" ? "Fit image to viewport." : `Zoom ${formatZoom(nextZoom)}.`);
  };

  const zoomIn = () => {
    const nextZoom = clampZoom(numericZoom(zoom()) * 1.25);
    handleZoomChange(nextZoom);
  };

  const zoomOut = () => {
    const nextZoom = clampZoom(numericZoom(zoom()) / 1.25);
    handleZoomChange(nextZoom);
  };

  const resetZoom = () => {
    handleZoomChange(1);
  };

  const fitZoom = () => {
    handleZoomChange("fit");
  };

  const expandCanvas = () => {
    const currentProject = project();

    if (!currentProject) {
      return;
    }

    commitProject(padProjectCanvas(currentProject, 128), "Expanded canvas");
  };

  const trimCanvas = () => {
    const currentProject = project();

    if (!currentProject) {
      return;
    }

    commitProject(currentProject, "Trimmed canvas", { fitToContent: true });
  };

  const undoHistory = () => {
    commitPendingKeyboardNudge();
    restoreHistoryEntry(historyIndex() - 1);
  };

  const redoHistory = () => {
    commitPendingKeyboardNudge();
    restoreHistoryEntry(historyIndex() + 1);
  };

  const handleSettingsChange = (patch: Partial<EditorSettings>) => {
    const nextSettings = {
      ...settings(),
      ...patch,
    };
    setSettings(nextSettings);
    rememberStyleColors(patch);

    const currentProject = project();
    const ids = selectedIds();

    if (!currentProject || ids.length === 0) {
      return;
    }

    const idSet = new Set(ids);
    commitProject(
      {
        ...currentProject,
        annotations: currentProject.annotations.map((annotation) =>
          idSet.has(annotation.id) ? applySettingsToAnnotation(annotation, nextSettings) : annotation,
        ),
      },
      ids.length > 1 ? "Updated selection style" : "Updated layer style",
    );
  };

  const handleAttachedTextChange = (patch: Partial<AttachedText>) => {
    const currentProject = project();
    const ids = selectedIds();

    if (!currentProject || ids.length === 0) {
      return;
    }

    const idSet = new Set(ids);
    let changed = false;
    const nextAnnotations = currentProject.annotations.map((annotation) => {
      if (!idSet.has(annotation.id) || !isShapeTextAnnotation(annotation)) {
        return annotation;
      }

      const currentText =
        annotation.text ?? createAttachedTextForAnnotation(annotation, settings());
      const nextText = {
        ...currentText,
        ...patch,
      };

      if (sameAttachedText(currentText, nextText)) {
        return annotation;
      }

      changed = true;
      return {
        ...annotation,
        text: nextText,
      };
    });

    if (!changed) {
      return;
    }

    if (typeof patch.fontSize === "number") {
      setSettings({
        ...settings(),
        fontSize: patch.fontSize,
      });
    }

    commitProject(
      {
        ...currentProject,
        annotations: nextAnnotations,
      },
      ids.length > 1 ? "Updated labels" : "Updated label",
      { fitToContent: true },
    );
  };

  const applyStylePreset = (presetId: StylePresetId) => {
    const tool = activeStyleTool();

    if (!tool) {
      setStatus("Select an annotation style target first.");
      return;
    }

    const patch = settingsForStylePreset(tool, presetId);
    handleSettingsChange(patch);
    setStatus("Applied style preset.");
  };

  const addCustomColor = (color: string, target: "stroke" | "fill") => {
    const patch =
      target === "stroke"
        ? { color }
        : { fillColor: hexToFillColor(color) };

    updateStylePreferences((current) => withCustomColor(current, color));
    handleSettingsChange(patch);
    setStatus(target === "stroke" ? "Added custom stroke color." : "Added custom fill color.");
  };

  const makeCurrentStyleDefault = () => {
    const tool = activeStyleTool();

    if (!tool) {
      setStatus("Choose a tool or selected annotation first.");
      return;
    }

    const nextSettings = settings();
    updateStylePreferences((current) => ({
      ...current,
      toolDefaults: {
        ...current.toolDefaults,
        [tool]: nextSettings,
      },
    }));
    setStatus(`${toolLabels[tool]} style saved as the default.`);
  };

  const copySelectedStyle = () => {
    const annotation = selectedAnnotation();

    if (!annotation) {
      setStatus("Select a layer to copy its style.");
      return;
    }

    setStyleClipboard(settingsFromAnnotation(annotation, settings()));
    setStatus("Copied layer style.");
  };

  const pasteCopiedStyle = () => {
    const copiedStyle = styleClipboard();

    if (!copiedStyle) {
      setStatus("Copy a layer style first.");
      return;
    }

    if (selectedIds().length === 0) {
      setStatus("Select a layer to paste the copied style.");
      return;
    }

    handleSettingsChange(copiedStyle);
    setStatus("Pasted layer style.");
  };

  const updateAnnotationLive = (
    id: string,
    updater: (annotation: ImageAnnotation) => ImageAnnotation,
  ) => {
    const currentProject = project();

    if (!currentProject) {
      return;
    }

    setProject({
      ...currentProject,
      annotations: currentProject.annotations.map((annotation) =>
        annotation.id === id ? updater(annotation) : annotation,
      ),
      updatedAt: Date.now(),
    });
    setHasPendingInlineEdit(true);
  };

  const commitPendingInlineEdit = () => {
    const id = inlineEditingId();
    const currentProject = project();
    const annotation = currentProject?.annotations.find((candidate) => candidate.id === id);

    if (
      currentProject &&
      annotation?.type === "text" &&
      annotation.text.trim().length === 0
    ) {
      setHasPendingInlineEdit(false);
      setInlineEditingId(undefined);
      setInlineEditOriginalAnnotations(undefined);
      setActiveTool("select");
      commitProject(
        {
          ...currentProject,
          annotations: currentProject.annotations.filter(
            (candidate) => candidate.id !== annotation.id,
          ),
        },
        "Removed empty text",
        { fitToContent: true },
      );
      setSelectedId(undefined);
      return;
    }

    if (
      currentProject &&
      annotation &&
      isShapeTextAnnotation(annotation) &&
      annotation.text &&
      annotation.text.text.trim().length === 0
    ) {
      setHasPendingInlineEdit(false);
      setInlineEditingId(undefined);
      setInlineEditOriginalAnnotations(undefined);
      commitProject(
        {
          ...currentProject,
          annotations: currentProject.annotations.map((candidate) =>
            candidate.id === annotation.id && isShapeTextAnnotation(candidate)
              ? { ...candidate, text: undefined }
              : candidate,
          ),
        },
        "Removed empty label",
        { fitToContent: true },
      );
      return;
    }

    if (!hasPendingInlineEdit()) {
      setInlineEditingId(undefined);
      setInlineEditOriginalAnnotations(undefined);
      return;
    }

    setHasPendingInlineEdit(false);
    setInlineEditingId(undefined);
    setInlineEditOriginalAnnotations(undefined);
    setActiveTool("select");
    commitCurrentProject("Edited layer", { fitToContent: true });
  };

  const finishInlineEditFromCanvasPointer = () => {
    if (!inlineEditingId()) {
      return false;
    }

    commitPendingInlineEdit();
    batch(() => {
      setSelectedId(undefined);
      setActiveTool("select");
    });

    return true;
  };

  const cancelInlineEdit = () => {
    const currentProject = project();
    const originalAnnotations = inlineEditOriginalAnnotations();

    batch(() => {
      if (currentProject && originalAnnotations) {
        setProject({
          ...currentProject,
          annotations: originalAnnotations,
          updatedAt: Date.now(),
        });
      }
      setHasPendingInlineEdit(false);
      setInlineEditingId(undefined);
      setInlineEditOriginalAnnotations(undefined);
    });
  };

  const startInlineEdit = () => {
    if (selectedIds().length !== 1) {
      return;
    }

    const id = selectedId();

    if (id) {
      startInlineEditFor(id);
    }
  };

  const startInlineEditFor = (
    id: string,
    originalAnnotations?: ImageAnnotation[],
  ) => {
    const currentProject = project();
    const annotation = currentProject?.annotations.find((candidate) => candidate.id === id);

    if (
      !currentProject ||
      !annotation ||
      !(
        annotation.type === "text" ||
        annotation.type === "step" ||
        annotation.type === "arrow" ||
        annotation.type === "rectangle" ||
        annotation.type === "ellipse" ||
        annotation.type === "pixelate" ||
        annotation.type === "erase"
      )
    ) {
      return;
    }

    const nextAnnotations =
      annotation.type === "arrow" ||
      annotation.type === "rectangle" ||
      annotation.type === "ellipse" ||
      annotation.type === "pixelate" ||
      annotation.type === "erase"
        ? currentProject.annotations.map((candidate) =>
            candidate.id === id && isShapeTextAnnotation(candidate) && !candidate.text
              ? {
                  ...candidate,
                  text: createAttachedTextForAnnotation(candidate, settings()),
                }
              : candidate,
          )
        : currentProject.annotations;

    batch(() => {
      if (nextAnnotations !== currentProject.annotations) {
        setProject({
          ...currentProject,
          annotations: nextAnnotations,
          updatedAt: Date.now(),
        });
      }
      setSelectedId(id);
      setInlineEditingId(id);
      setInlineEditOriginalAnnotations(
        structuredClone(originalAnnotations ?? currentProject.annotations),
      );
      setHasPendingInlineEdit(false);
    });
  };

  const deleteSelected = () => {
    const ids = selectedIds();

    if (ids.length > 0) {
      deleteLayers(ids);
    }
  };

  const deleteLayer = (id: string) => {
    deleteLayers(selectedLayerIdsForMutation(id));
  };

  const deleteLayers = (ids: string[]) => {
    const currentProject = project();

    if (!currentProject || ids.length === 0) {
      return;
    }

    const idSet = new Set(ids);
    commitProject(
      {
        ...currentProject,
        annotations: currentProject.annotations.filter((annotation) => !idSet.has(annotation.id)),
      },
      ids.length > 1 ? "Deleted layers" : "Deleted layer",
    );
    setSelectedId(undefined);
    setInlineEditingId(undefined);
  };

  const duplicateSelected = () => {
    const ids = selectedIds();

    if (ids.length > 0) {
      duplicateLayers(ids);
      return;
    }

    setStatus("Select a layer to duplicate.");
  };

  const duplicateLayer = (id: string) => {
    duplicateLayers(selectedLayerIdsForMutation(id));
  };

  const duplicateLayers = (ids: string[]) => {
    const currentProject = project();

    if (!currentProject || ids.length === 0) {
      setStatus("Select a layer to duplicate.");
      return;
    }

    const idSet = new Set(ids);
    const duplicates = currentProject.annotations
      .filter((annotation) => idSet.has(annotation.id))
      .map((annotation) =>
        moveAnnotation(
          {
            ...structuredClone(annotation),
            id: createEditorId("layer"),
            createdAt: Date.now(),
            hidden: false,
          },
          16,
          16,
        ),
      );

    if (duplicates.length === 0) {
      return;
    }

    commitProject(
      {
        ...currentProject,
        annotations: [...currentProject.annotations, ...duplicates],
      },
      duplicates.length > 1 ? "Duplicated layers" : "Duplicated layer",
    );
    setSelectedIds(duplicates.map((annotation) => annotation.id));
    setStatus(duplicates.length > 1 ? "Duplicated layers." : "Duplicated layer.");
  };

  const copySelectedAnnotation = () => {
    const annotations = selectedAnnotations();

    if (annotations.length === 0) {
      setStatus("Select a layer to copy.");
      return false;
    }

    setAnnotationClipboard(structuredClone(annotations));
    setStatus(annotations.length > 1 ? "Copied layers." : "Copied layer.");
    return true;
  };

  const cutSelectedAnnotation = () => {
    const currentProject = project();
    const annotations = selectedAnnotations();

    if (!currentProject || annotations.length === 0) {
      setStatus("Select a layer to cut.");
      return false;
    }

    const idSet = new Set(annotations.map((annotation) => annotation.id));
    setAnnotationClipboard(structuredClone(annotations));
    commitProject(
      {
        ...currentProject,
        annotations: currentProject.annotations.filter(
          (candidate) => !idSet.has(candidate.id),
        ),
      },
      annotations.length > 1 ? "Cut layers" : "Cut layer",
    );
    batch(() => {
      setSelectedId(undefined);
      setInlineEditingId(undefined);
    });
    setStatus(annotations.length > 1 ? "Cut layers." : "Cut layer.");
    return true;
  };

  const pasteCopiedAnnotation = () => {
    const currentProject = project();
    const copiedAnnotations = annotationClipboard();

    if (!currentProject || copiedAnnotations.length === 0) {
      setStatus("No copied layer to paste.");
      return false;
    }

    const duplicates = copiedAnnotations.map((copiedAnnotation) =>
      moveAnnotation(
        {
          ...structuredClone(copiedAnnotation),
          id: createEditorId("layer"),
          createdAt: Date.now(),
          hidden: false,
        },
        24,
        24,
      ),
    );

    commitProject(
      {
        ...currentProject,
        annotations: [...currentProject.annotations, ...duplicates],
      },
      duplicates.length > 1 ? "Pasted layers" : "Pasted layer",
    );
    setSelectedIds(duplicates.map((annotation) => annotation.id));
    setAnnotationClipboard(structuredClone(duplicates));
    setStatus(duplicates.length > 1 ? "Pasted layers." : "Pasted layer.");
    return true;
  };

  const createBeforeAfterTemplate = async (
    currentProject: ImageEditorProject,
    afterImage: HTMLImageElement,
    fileName: string,
  ) => {
    const beforeBlob = await renderProjectToPngBlob(currentProject, {
      backgroundColor: "#ffffff",
    });
    const beforeDataUrl = await blobToDataUrl(beforeBlob);
    const beforeImage = await loadImageElement(beforeDataUrl);
    const now = Date.now();
    const frame = createBeforeAfterFrame(beforeImage, afterImage);
    const nextProject: ImageEditorProject = {
      version: 1,
      id: createEditorId("project"),
      name: `${downloadBaseName(fileName || currentProject.name)}-before-after`,
      width: frame.width,
      height: frame.height,
      baseImage: {
        dataUrl: frame.dataUrl,
        mimeType: "image/png",
        width: frame.width,
        height: frame.height,
        offsetX: 0,
        offsetY: 0,
      },
      annotations: [],
      createdAt: now,
      updatedAt: now,
    };

    batch(() => {
      setIsBeforeAfterMode(false);
      setSelectedId(undefined);
      setDraft(undefined);
      setInteraction(undefined);
      setInlineEditingId(undefined);
      setActiveTool("select");
      setZoom("fit");
    });
    commitProject(nextProject, "Created before/after frame");
  };

  const handlePastedImage = async (
    file: File | undefined,
    pngDataFallback?: ImageEditorPngPayload,
  ) => {
    if (!file) {
      return;
    }

    const embeddedPayload = await extractPngDataFromFile(file);
    const restoredPayload = embeddedPayload ?? pngDataFallback;

    if (restoredPayload) {
      restorePngDataProject(
        restoredPayload.project,
        restoredPayload.historyLog,
        restoredPayload.history,
      );
      setStatus("Opened editable PNGDATA project.");
      return;
    }

    const currentProject = project();

    if (!currentProject) {
      void importFiles([file], "Pasted image", pngDataFallback);
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const image = await loadImageElement(dataUrl);

      if (isBeforeAfterMode()) {
        await createBeforeAfterTemplate(currentProject, image, file.name);
        return;
      }

      const maxWidth = Math.max(80, currentProject.width * 0.45);
      const maxHeight = Math.max(80, currentProject.height * 0.45);
      const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
      const width = Math.max(24, Math.round(image.naturalWidth * scale));
      const height = Math.max(24, Math.round(image.naturalHeight * scale));
      const annotation: ImageAnnotation = {
        id: createEditorId("layer"),
        type: "image",
        createdAt: Date.now(),
        opacity: 1,
        x: Math.round((currentProject.width - width) / 2),
        y: Math.round((currentProject.height - height) / 2),
        width,
        height,
        dataUrl,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
      };

      commitProject(
        {
          ...currentProject,
          annotations: [...currentProject.annotations, annotation],
        },
        "Pasted image layer",
      );
      setSelectedId(annotation.id);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to paste image.");
    }
  };

  const bringSelectedForward = () => {
    const ids = selectedIds();

    if (ids.length > 0) {
      reorderLayers(ids, 1, ids.length > 1 ? "Brought layers forward" : "Brought layer forward");
    }
  };

  const sendSelectedBackward = () => {
    const ids = selectedIds();

    if (ids.length > 0) {
      reorderLayers(ids, -1, ids.length > 1 ? "Sent layers backward" : "Sent layer backward");
    }
  };

  const bringLayerForward = (id: string) => {
    reorderLayer(id, 1, "Brought layer forward");
  };

  const sendLayerBackward = (id: string) => {
    reorderLayer(id, -1, "Sent layer backward");
  };

  const reorderLayer = (id: string, direction: -1 | 1, label: string) => {
    reorderLayers(selectedLayerIdsForMutation(id), direction, label);
  };

  const reorderLayers = (ids: string[], direction: -1 | 1, label: string) => {
    const currentProject = project();

    if (!currentProject || ids.length === 0) {
      return;
    }

    const idSet = new Set(ids);
    const selectedIndexes = currentProject.annotations
      .map((annotation, index) => (idSet.has(annotation.id) ? index : -1))
      .filter((index) => index >= 0);

    if (selectedIndexes.length === 0) {
      return;
    }

    const blocked =
      direction > 0
        ? selectedIndexes[selectedIndexes.length - 1] === currentProject.annotations.length - 1
        : selectedIndexes[0] === 0;

    if (blocked) {
      setStatus(direction > 0 ? "Selection is already in front." : "Selection is already behind.");
      return;
    }

    const nextAnnotations = [...currentProject.annotations];
    const indexesToMove = direction > 0 ? [...selectedIndexes].reverse() : selectedIndexes;

    for (const index of indexesToMove) {
      const targetIndex = index + direction;
      const current = nextAnnotations[index];
      const target = nextAnnotations[targetIndex];

      if (!current || !target || idSet.has(target.id)) {
        continue;
      }

      nextAnnotations[index] = target;
      nextAnnotations[targetIndex] = current;
    }

    commitProject(
      {
        ...currentProject,
        annotations: nextAnnotations,
      },
      label,
    );
    setSelection(ids, ids[ids.length - 1]);
    setStatus(label);
  };

  const selectLayer = (id: string, mode: "replace" | "toggle" | "range" = "replace") => {
    const annotation = project()?.annotations.find((candidate) => candidate.id === id);

    if (!annotation) {
      return;
    }

    if (mode === "toggle") {
      toggleSelection(id);
      setInlineEditingId(undefined);
      setActiveTool("select");
      setStatus("Updated selection.");
      return;
    }

    if (mode === "range") {
      const currentProject = project();
      const anchorId = selectedId();
      const anchorIndex = currentProject?.annotations.findIndex(
        (candidate) => candidate.id === anchorId,
      );
      const nextIndex = currentProject?.annotations.findIndex(
        (candidate) => candidate.id === id,
      );

      if (
        currentProject &&
        anchorIndex !== undefined &&
        nextIndex !== undefined &&
        anchorIndex >= 0 &&
        nextIndex >= 0
      ) {
        const start = Math.min(anchorIndex, nextIndex);
        const end = Math.max(anchorIndex, nextIndex);
        setSelection(
          currentProject.annotations
            .slice(start, end + 1)
            .filter((candidate) => !candidate.hidden)
            .map((candidate) => candidate.id),
          id,
        );
        setInlineEditingId(undefined);
        setActiveTool("select");
        setStatus("Selected layer range.");
        return;
      }
    }

    batch(() => {
      setSelectedId(id);
      setInlineEditingId(undefined);
      setActiveTool("select");
    });
    setStatus(
      annotation.hidden
        ? `Selected hidden ${annotationTypeLabel(annotation)} layer.`
        : `Selected ${annotationTypeLabel(annotation)} layer.`,
    );
  };

  const toggleLayerVisibility = (id: string) => {
    const currentProject = project();
    const annotation = currentProject?.annotations.find((candidate) => candidate.id === id);

    if (!currentProject || !annotation) {
      return;
    }

    const nextHidden = !annotation.hidden;
    commitProject(
      {
        ...currentProject,
        annotations: currentProject.annotations.map((candidate) =>
          candidate.id === id ? { ...candidate, hidden: nextHidden } : candidate,
        ),
      },
      nextHidden ? "Hid layer" : "Showed layer",
    );

    if (nextHidden && selectedIds().includes(id)) {
      batch(() => {
        setSelection(selectedIds().filter((selectedLayerId) => selectedLayerId !== id));
        setInlineEditingId(undefined);
      });
    }
  };

  const handleDoubleClick = (point: Point) => {
    const currentProject = project();

    if (!currentProject) {
      return;
    }

    const hit = findHitAnnotation(currentProject.annotations, point);

    if (
      hit?.type === "text" ||
      hit?.type === "step" ||
      (hit !== undefined && isShapeTextAnnotation(hit))
    ) {
      startInlineEditFor(hit.id);
    }
  };

  const moveSelectedByKeyboard = (deltaX: number, deltaY: number) => {
    const currentProject = project();
    const ids = selectedIds();

    if (!currentProject || ids.length === 0) {
      return;
    }

    const idSet = new Set(ids);
    setProject(expandProjectToAnnotations({
      ...currentProject,
      annotations: currentProject.annotations.map((annotation) =>
        idSet.has(annotation.id) ? moveAnnotation(annotation, deltaX, deltaY) : annotation,
      ),
      updatedAt: Date.now(),
    }));
    setSelectedIds(ids);
    scheduleKeyboardNudgeCommit();
    setStatus(
      ids.length > 1
        ? `Nudged layers ${eventNudgeLabel(deltaX, deltaY)}.`
        : `Nudged layer ${eventNudgeLabel(deltaX, deltaY)}.`,
    );
  };

  const cycleSelectedLayer = (direction: -1 | 1) => {
    const currentProject = project();

    if (!currentProject || currentProject.annotations.length === 0) {
      return;
    }

    const annotations = currentProject.annotations.filter(
      (annotation) => !annotation.hidden,
    );

    if (annotations.length === 0) {
      setStatus("No visible layers to select.");
      return;
    }

    const selectedIndex = annotations.findIndex(
      (annotation) => annotation.id === selectedId(),
    );
    const startIndex = selectedIndex < 0 ? (direction > 0 ? -1 : 0) : selectedIndex;
    const nextIndex =
      (startIndex + direction + annotations.length) % annotations.length;
    const nextAnnotation = annotations[nextIndex];

    if (!nextAnnotation) {
      return;
    }

    batch(() => {
      setSelectedId(nextAnnotation.id);
      setInlineEditingId(undefined);
      setActiveTool("select");
    });
    setStatus(`Selected ${annotationTypeLabel(nextAnnotation)} layer.`);
  };

  const adjustStrokeWidth = (delta: number) => {
    const nextStrokeWidth = Math.max(1, Math.min(36, settings().strokeWidth + delta));
    handleSettingsChange({ strokeWidth: nextStrokeWidth });
    setStatus(`Stroke ${nextStrokeWidth}px.`);
  };

  const snapBounds = (
    currentProject: ImageEditorProject,
    bounds: Bounds,
    excludedIds: string[],
  ): SnapResult => {
    if (snapMode() === "off") {
      return { bounds, guides: [] };
    }

    return snapBoundsToTargets(
      bounds,
      buildSnapTargets(currentProject, excludedIds, bounds),
      snapMode(),
    );
  };

  const snapDraft = (
    currentProject: ImageEditorProject,
    currentDraft: ImageAnnotation,
  ): { draft: ImageAnnotation; guides: SnapGuide[] } => {
    if (snapMode() === "off") {
      return { draft: currentDraft, guides: [] };
    }

    if (
      currentDraft.type === "rectangle" ||
      currentDraft.type === "ellipse" ||
      currentDraft.type === "pixelate" ||
      currentDraft.type === "image"
    ) {
      const snapped = snapBounds(
        currentProject,
        normalizeRect(currentDraft.x, currentDraft.y, currentDraft.width, currentDraft.height),
        [],
      );

      return {
        draft: {
          ...currentDraft,
          x: snapped.bounds.x,
          y: snapped.bounds.y,
          width: snapped.bounds.width,
          height: snapped.bounds.height,
        },
        guides: snapped.guides,
      };
    }

    if (currentDraft.type === "arrow") {
      const snapped = snapPointToTargets(
        currentDraft.end,
        buildSnapTargets(currentProject, [], getAnnotationBounds(currentDraft)),
        snapMode(),
      );

      return {
        draft: { ...currentDraft, end: snapped.point },
        guides: snapped.guides,
      };
    }

    return { draft: currentDraft, guides: [] };
  };

  const updateSelectionBounds = (
    command: SelectionBoundsCommand,
    label: string,
  ) => {
    const currentProject = project();
    const ids = selectedIds();
    const bounds = selectionBounds();

    if (!currentProject || ids.length === 0 || !bounds) {
      setStatus("Select a layer first.");
      return;
    }

    const minSize = 4;
    let nextBounds = { ...bounds };

    if (command.type === "all") {
      const maxShrink = Math.max(
        0,
        Math.min((bounds.width - minSize) / 2, (bounds.height - minSize) / 2),
      );
      const delta = command.delta < 0 ? Math.max(command.delta, -maxShrink) : command.delta;
      nextBounds = {
        x: bounds.x - delta,
        y: bounds.y - delta,
        width: bounds.width + delta * 2,
        height: bounds.height + delta * 2,
      };
    } else if (command.type === "resize") {
      if (command.edge === "right") {
        nextBounds = {
          ...bounds,
          width: Math.max(minSize, bounds.width + command.delta),
        };
      } else {
        nextBounds = {
          ...bounds,
          height: Math.max(minSize, bounds.height + command.delta),
        };
      }
    } else {
      switch (command.edge) {
        case "left": {
          const right = bounds.x + bounds.width;
          const x = Math.min(bounds.x + command.delta, right - minSize);
          nextBounds = { ...bounds, x, width: right - x };
          break;
        }
        case "right":
          nextBounds = {
            ...bounds,
            width: Math.max(minSize, bounds.width + command.delta),
          };
          break;
        case "top": {
          const bottom = bounds.y + bounds.height;
          const y = Math.min(bounds.y + command.delta, bottom - minSize);
          nextBounds = { ...bounds, y, height: bottom - y };
          break;
        }
        case "bottom":
          nextBounds = {
            ...bounds,
            height: Math.max(minSize, bounds.height + command.delta),
          };
          break;
      }
    }

    transformSelectionToBounds(currentProject, ids, bounds, nextBounds, label);
  };

  const transformSelectionToBounds = (
    currentProject: ImageEditorProject,
    ids: string[],
    sourceBounds: Bounds,
    targetBounds: Bounds,
    label: string,
  ) => {
    const idSet = new Set(ids);

    commitProject(
      {
        ...currentProject,
        annotations: currentProject.annotations.map((annotation) =>
          idSet.has(annotation.id)
            ? transformAnnotationToBounds(annotation, sourceBounds, targetBounds)
            : annotation,
        ),
      },
      label,
      { preserveCanvas: true },
    );
    setSelectedIds(ids);
  };

  const alignSelection = (command: AlignmentCommand) => {
    const currentProject = project();
    const ids = selectedIds();
    const bounds = selectionBounds();
    const annotations = selectedAnnotations();

    if (!currentProject || ids.length < 2 || !bounds) {
      setStatus("Select at least two layers to align.");
      return;
    }

    const deltas = new Map<string, Point>();

    for (const annotation of annotations) {
      const annotationBounds = getAnnotationBounds(annotation);
      const delta =
        command === "left"
          ? { x: bounds.x - annotationBounds.x, y: 0 }
          : command === "center"
            ? {
                x:
                  bounds.x +
                  bounds.width / 2 -
                  (annotationBounds.x + annotationBounds.width / 2),
                y: 0,
              }
            : command === "right"
              ? {
                  x:
                    bounds.x +
                    bounds.width -
                    (annotationBounds.x + annotationBounds.width),
                  y: 0,
                }
              : command === "top"
                ? { x: 0, y: bounds.y - annotationBounds.y }
                : command === "middle"
                  ? {
                      x: 0,
                      y:
                        bounds.y +
                        bounds.height / 2 -
                        (annotationBounds.y + annotationBounds.height / 2),
                    }
                  : {
                      x: 0,
                      y:
                        bounds.y +
                        bounds.height -
                        (annotationBounds.y + annotationBounds.height),
                    };

      deltas.set(annotation.id, delta);
    }

    commitProject(
      {
        ...currentProject,
        annotations: currentProject.annotations.map((annotation) => {
          const delta = deltas.get(annotation.id);

          return delta ? moveAnnotation(annotation, delta.x, delta.y) : annotation;
        }),
      },
      `Aligned ${alignmentLabel(command)}`,
      { preserveCanvas: true },
    );
    setSelectedIds(ids);
  };

  const distributeSelection = (axis: DistributionAxis) => {
    const currentProject = project();
    const ids = selectedIds();
    const annotations = selectedAnnotations();

    if (!currentProject || annotations.length < 3) {
      setStatus("Select at least three layers to distribute.");
      return;
    }

    const entries = annotations
      .map((annotation) => ({
        annotation,
        bounds: getAnnotationBounds(annotation),
      }))
      .sort((first, second) =>
        axis === "horizontal"
          ? first.bounds.x - second.bounds.x
          : first.bounds.y - second.bounds.y,
      );
    const first = entries[0];
    const last = entries[entries.length - 1];

    if (!first || !last) {
      return;
    }

    const start = axis === "horizontal" ? first.bounds.x : first.bounds.y;
    const end =
      axis === "horizontal"
        ? last.bounds.x + last.bounds.width
        : last.bounds.y + last.bounds.height;
    const totalSize = entries.reduce(
      (sum, entry) => sum + (axis === "horizontal" ? entry.bounds.width : entry.bounds.height),
      0,
    );
    const gap = (end - start - totalSize) / Math.max(1, entries.length - 1);
    let cursor = start;
    const deltas = new Map<string, Point>();

    for (const entry of entries) {
      const delta =
        axis === "horizontal"
          ? { x: cursor - entry.bounds.x, y: 0 }
          : { x: 0, y: cursor - entry.bounds.y };

      deltas.set(entry.annotation.id, delta);
      cursor += (axis === "horizontal" ? entry.bounds.width : entry.bounds.height) + gap;
    }

    commitProject(
      {
        ...currentProject,
        annotations: currentProject.annotations.map((annotation) => {
          const delta = deltas.get(annotation.id);

          return delta ? moveAnnotation(annotation, delta.x, delta.y) : annotation;
        }),
      },
      axis === "horizontal" ? "Distributed horizontally" : "Distributed vertically",
      { preserveCanvas: true },
    );
    setSelectedIds(ids);
  };

  const requestSelectionView = (kind: SelectionViewAction["kind"]) => {
    if (!selectionBounds()) {
      setStatus("Select a layer first.");
      return;
    }

    setSelectionViewAction({ id: createEditorId("view"), kind });
    setStatus(selectionViewLabel(kind));
  };

  const smartAdjustSelection = async () => {
    const currentProject = project();
    const ids = selectedIds();
    const annotations = selectedAnnotations();

    if (!currentProject || ids.length === 0 || annotations.length === 0) {
      setStatus("Select a layer to smart-fit.");
      return;
    }

    try {
      const image = await loadImageElement(currentProject.baseImage.dataUrl);
      const canvas = document.createElement("canvas");
      canvas.width = currentProject.width;
      canvas.height = currentProject.height;
      const context = canvas.getContext("2d");

      if (!context) {
        setStatus("Unable to inspect image pixels.");
        return;
      }

      const baseOffset = getBaseImageOffset(currentProject);
      context.drawImage(
        image,
        baseOffset.x,
        baseOffset.y,
        image.naturalWidth,
        image.naturalHeight,
      );

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const adjustedBounds = new Map<string, Bounds>();

      for (const annotation of annotations) {
        const bounds = getAnnotationBounds(annotation);
        const detected = detectMonotoneBlockBounds(
          imageData,
          clampPointToProject(
            {
              x: bounds.x + bounds.width / 2,
              y: bounds.y + bounds.height / 2,
            },
            currentProject,
          ),
          clampBoundsToProject(expandBoundsBy(bounds, 256), currentProject),
        );

        if (detected && detected.width >= 4 && detected.height >= 4) {
          adjustedBounds.set(annotation.id, detected);
        }
      }

      if (adjustedBounds.size === 0) {
        setStatus("No monotone UI block found under the selection.");
        return;
      }

      commitProject(
        {
          ...currentProject,
          annotations: currentProject.annotations.map((annotation) => {
            const targetBounds = adjustedBounds.get(annotation.id);

            return targetBounds
              ? transformAnnotationToBounds(
                  annotation,
                  getAnnotationBounds(annotation),
                  targetBounds,
                )
              : annotation;
          }),
        },
        adjustedBounds.size > 1 ? "Smart-fit layers" : "Smart-fit layer",
        { preserveCanvas: true },
      );
      setSelectedIds(ids);
      setStatus(adjustedBounds.size > 1 ? "Smart-fit layers." : "Smart-fit layer.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to smart-fit selection.");
    }
  };

  const handleKeyboardShortcut = (event: KeyboardEvent) => {
    if (isEditableTarget(event.target)) {
      return;
    }

    const isPrimaryModifier = event.metaKey || event.ctrlKey;
    const key = event.key.toLowerCase();

    if (isPrimaryModifier && event.altKey && (event.key === "+" || event.key === "=")) {
      event.preventDefault();
      updateSelectionBounds(
        { type: "all", delta: event.shiftKey ? 10 : 1 },
        "Grew selection bounds",
      );
      return;
    }

    if (isPrimaryModifier && event.altKey && event.key === "-") {
      event.preventDefault();
      updateSelectionBounds(
        { type: "all", delta: event.shiftKey ? -10 : -1 },
        "Shrank selection bounds",
      );
      return;
    }

    if (isPrimaryModifier && event.altKey && key === "f") {
      event.preventDefault();
      requestSelectionView("fit-region");
      return;
    }

    if (isPrimaryModifier && event.altKey && key === "1") {
      event.preventDefault();
      requestSelectionView("zoom");
      return;
    }

    if (isPrimaryModifier && event.altKey && event.key === "[") {
      event.preventDefault();
      requestSelectionView("top-left");
      return;
    }

    if (isPrimaryModifier && event.altKey && event.key === "]") {
      event.preventDefault();
      requestSelectionView("bottom-right");
      return;
    }

    if (isPrimaryModifier && event.altKey && key === "r") {
      event.preventDefault();
      void smartAdjustSelection();
      return;
    }

    if (isPrimaryModifier && event.key.startsWith("Arrow") && selectedIds().length > 0) {
      event.preventDefault();
      const amount = event.shiftKey ? 10 : 1;

      if (event.altKey) {
        const edgeDelta = event.shiftKey ? 10 : 1;
        const command =
          event.key === "ArrowLeft"
            ? ({
                type: "edge",
                edge: "left",
                delta: event.shiftKey ? edgeDelta : -edgeDelta,
              } satisfies SelectionBoundsCommand)
            : event.key === "ArrowRight"
              ? ({
                  type: "edge",
                  edge: "right",
                  delta: event.shiftKey ? -edgeDelta : edgeDelta,
                } satisfies SelectionBoundsCommand)
              : event.key === "ArrowUp"
                ? ({
                    type: "edge",
                    edge: "top",
                    delta: event.shiftKey ? edgeDelta : -edgeDelta,
                  } satisfies SelectionBoundsCommand)
                : ({
                    type: "edge",
                    edge: "bottom",
                    delta: event.shiftKey ? -edgeDelta : edgeDelta,
                  } satisfies SelectionBoundsCommand);

        updateSelectionBounds(command, "Adjusted selection edge");
        return;
      }

      const command =
        event.key === "ArrowRight"
          ? ({ type: "resize", edge: "right", delta: amount } satisfies SelectionBoundsCommand)
          : event.key === "ArrowLeft"
            ? ({ type: "resize", edge: "right", delta: -amount } satisfies SelectionBoundsCommand)
            : event.key === "ArrowDown"
              ? ({ type: "resize", edge: "bottom", delta: amount } satisfies SelectionBoundsCommand)
              : ({ type: "resize", edge: "bottom", delta: -amount } satisfies SelectionBoundsCommand);

      updateSelectionBounds(command, "Resized selection bounds");
      return;
    }

    if (isPrimaryModifier && key === "z") {
      event.preventDefault();
      commitPendingKeyboardNudge();

      if (event.shiftKey) {
        restoreHistoryEntry(historyIndex() + 1);
      } else {
        restoreHistoryEntry(historyIndex() - 1);
      }
      return;
    }

    if (isPrimaryModifier && key === "y") {
      event.preventDefault();
      commitPendingKeyboardNudge();
      restoreHistoryEntry(historyIndex() + 1);
      return;
    }

    if (isPrimaryModifier && event.shiftKey && key === "c") {
      event.preventDefault();
      handleCopy();
      return;
    }

    if (isPrimaryModifier && key === "c") {
      event.preventDefault();

      if (!copySelectedAnnotation()) {
        handleCopy();
      }

      return;
    }

    if (isPrimaryModifier && key === "x") {
      if (selectedId()) {
        event.preventDefault();
        cutSelectedAnnotation();
      }

      return;
    }

    if (isPrimaryModifier && key === "v") {
      if (annotationClipboard().length > 0) {
        event.preventDefault();
        pasteCopiedAnnotation();
      }

      return;
    }

    if (isPrimaryModifier && key === "d") {
      event.preventDefault();
      duplicateSelected();
      return;
    }

    if (isPrimaryModifier && (key === "s" || key === "e")) {
      event.preventDefault();
      handleExport();
      return;
    }

    if (isPrimaryModifier && event.key === "]") {
      event.preventDefault();
      bringSelectedForward();
      return;
    }

    if (isPrimaryModifier && event.key === "[") {
      event.preventDefault();
      sendSelectedBackward();
      return;
    }

    if (isPrimaryModifier && key === "0") {
      event.preventDefault();
      resetZoom();
      return;
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      if (selectedIds().length > 0) {
        event.preventDefault();
        deleteSelected();
      }
      return;
    }

    if (event.key === "Tab" && project()?.annotations.length) {
      event.preventDefault();
      cycleSelectedLayer(event.shiftKey ? -1 : 1);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      if (isShortcutsOpen()) {
        setIsShortcutsOpen(false);
        return;
      }
      if (draft()?.type === "crop") {
        cancelCropDraft();
        return;
      }
      batch(() => {
        setDraft(undefined);
        setInteraction(undefined);
        setInlineEditingId(undefined);
        setSelectedId(undefined);
        setActiveTool("select");
      });
      return;
    }

    if (!isPrimaryModifier && event.shiftKey && key === "?") {
      event.preventDefault();
      setIsShortcutsOpen((value) => !value);
      return;
    }

    if (!isPrimaryModifier && !event.altKey && (event.key === "+" || event.key === "=")) {
      event.preventDefault();
      zoomIn();
      return;
    }

    if (!isPrimaryModifier && !event.altKey && event.key === "-") {
      event.preventDefault();
      zoomOut();
      return;
    }

    if (!isPrimaryModifier && !event.altKey && key === "f") {
      event.preventDefault();
      fitZoom();
      return;
    }

    if (!isPrimaryModifier && !event.altKey && event.key === "]") {
      event.preventDefault();
      adjustStrokeWidth(1);
      return;
    }

    if (!isPrimaryModifier && !event.altKey && event.key === "[") {
      event.preventDefault();
      adjustStrokeWidth(-1);
      return;
    }

    if (event.key === "Enter" && draft()?.type === "crop") {
      event.preventDefault();
      applyCropDraft();
      return;
    }

    if (event.key === "Enter" && selectedAnnotation()) {
      event.preventDefault();
      startInlineEdit();
      return;
    }

    if (event.key.startsWith("Arrow") && selectedIds().length > 0) {
      event.preventDefault();
      const amount = event.shiftKey ? 10 : 1;
      const delta =
        event.key === "ArrowUp"
          ? { x: 0, y: -amount }
          : event.key === "ArrowDown"
            ? { x: 0, y: amount }
            : event.key === "ArrowLeft"
              ? { x: -amount, y: 0 }
              : { x: amount, y: 0 };
      moveSelectedByKeyboard(delta.x, delta.y);
      return;
    }

    const shortcutTool = toolFromShortcut(event.key);

    if (shortcutTool && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      if (project() || shortcutTool === "select") {
        handleToolChange(shortcutTool);
      }
    }
  };

  return (
    <Box
      ref={shellRef}
      tabIndex={0}
      h="100dvh"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      bg="bg.canvas"
      color="fg.default"
      outline="none"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={handleFileInput}
      />

      <ImageEditorToolbar
        activeTool={activeTool()}
        hasProject={project() !== undefined}
        canUndo={canUndo()}
        canRedo={canRedo()}
        isExporting={isExporting()}
        isCopying={isCopying()}
        isSaving={isSaving()}
        isHistoryOpen={isHistoryOpen()}
        isBeforeAfterMode={isBeforeAfterMode()}
        selectedCount={selectedIds().length}
        snapMode={snapMode()}
        measureMode={measureMode()}
        zoom={zoom()}
        onToolChange={handleToolChange}
        onToggleHistory={() => setIsHistoryOpen((value) => !value)}
        onChooseFile={chooseFile}
        onUndo={undoHistory}
        onRedo={redoHistory}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomFit={fitZoom}
        onZoomReset={resetZoom}
        onExpandCanvas={expandCanvas}
        onTrimCanvas={trimCanvas}
        onSelectionView={requestSelectionView}
        onSmartAdjustSelection={() => void smartAdjustSelection()}
        onSnapModeChange={handleSnapModeChange}
        onMeasureModeChange={handleMeasureModeChange}
        onToggleBeforeAfterMode={() => {
          const nextMode = !isBeforeAfterMode();
          setIsBeforeAfterMode(nextMode);
          setStatus(
            nextMode
              ? "Next pasted image will be framed as before/after."
              : "Before/after framing off.",
          );
        }}
        onPasteMeasureTestImage={pasteMeasureTestImage}
        onSave={handleSave}
        onExport={handleExport}
        onCopy={handleCopy}
        onShowShortcuts={() => setIsShortcutsOpen(true)}
      />

      <Flex
        flex="1"
        minH="0"
        overflow="hidden"
        direction={{ base: "column", lg: "row" }}
      >
        <Show when={isHistoryOpen()}>
          <ImageEditorSidebar
            annotations={project()?.annotations ?? []}
            selectedIds={selectedIds()}
            historyEntries={history()}
            activeHistoryIndex={historyIndex()}
            onSelectLayer={selectLayer}
            onToggleLayerVisibility={toggleLayerVisibility}
            onDuplicateLayer={duplicateLayer}
            onBringLayerForward={bringLayerForward}
            onSendLayerBackward={sendLayerBackward}
            onDeleteLayer={deleteLayer}
            onJumpHistory={(index) => {
              commitPendingKeyboardNudge();
              restoreHistoryEntry(index);
            }}
            savedImages={savedImages()}
            onRefreshSavedImages={() => void loadSavedImages()}
          />
        </Show>
        <ImageEditorCanvas
          project={project()}
          draft={draft()}
          selectedIds={selectedIds()}
          selectedAnnotation={selectedAnnotation()}
          selectionBounds={selectionBounds()}
          snapGuides={snapGuides()}
          selectionMarquee={selectionMarquee()}
          selectionViewAction={selectionViewAction()}
          inlineEditingAnnotation={visibleInlineEditingAnnotation()}
          activeTool={activeTool()}
          measureMode={measureMode()}
          measureAnchor={activeMeasureContext().anchor}
          measureAxis={activeMeasureContext().axis}
          measureStartSnap={activeMeasureContext().startSnap}
          zoom={zoom()}
          settings={settings()}
          recentColors={stylePreferences().recentColors}
          recentFillColors={stylePreferences().recentFillColors}
          customColors={stylePreferences().customColors}
          brandPalettes={activeBrandPalettes()}
          canPasteStyle={styleClipboard() !== undefined}
          onChooseFile={chooseFile}
          onFiles={(files) => void importFiles(files, "Dropped image")}
          onZoomChange={handleZoomChange}
          onSettingsChange={handleSettingsChange}
          onAttachedTextChange={handleAttachedTextChange}
          onStylePreset={applyStylePreset}
          onCustomColorChange={addCustomColor}
          onMakeCurrentStyleDefault={makeCurrentStyleDefault}
          onCopyStyle={copySelectedStyle}
          onPasteStyle={pasteCopiedStyle}
          onAlignSelection={alignSelection}
          onDistributeSelection={distributeSelection}
          onStartInlineEdit={startInlineEdit}
          onInlineEditChange={(id, value) =>
            updateAnnotationLive(id, (annotation) =>
              annotation.type === "text"
                ? { ...annotation, text: value }
                : annotation.type === "step"
                  ? { ...annotation, label: value }
                  : isShapeTextAnnotation(annotation)
                    ? {
                        ...annotation,
                        text: {
                          ...(annotation.text ?? createAttachedTextForAnnotation(annotation, settings())),
                          text: value,
                        },
                      }
                  : annotation,
            )
          }
          onInlineEditCommit={commitPendingInlineEdit}
          onInlineEditCancel={cancelInlineEdit}
          onDuplicateSelected={duplicateSelected}
          onBringForward={bringSelectedForward}
          onSendBackward={sendSelectedBackward}
          onDeleteSelected={deleteSelected}
          onApplyCrop={applyCropDraft}
          onCancelCrop={cancelCropDraft}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDoubleClick={handleDoubleClick}
        />
      </Flex>

      <HStack
        position="fixed"
        right="4"
        bottom="4"
        gap="2"
        px="3"
        py="2"
        borderRadius="l2"
        borderWidth="1px"
        borderColor="border"
        bg="bg.default"
        boxShadow="md"
        textStyle="sm"
        color="fg.muted"
      >
        <Badge colorPalette={project() ? "green" : "gray"} variant="subtle">
          PNGDATA
        </Badge>
        <Box>{status()}</Box>
      </HStack>

      <Show when={isShortcutsOpen()}>
        <Box
          position="fixed"
          inset="0"
          zIndex="modal"
          bg="rgba(15, 23, 42, 0.36)"
          onClick={() => setIsShortcutsOpen(false)}
        >
          <Box
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
            position="absolute"
            left="50%"
            top="50%"
            transform="translate(-50%, -50%)"
            width="min(520px, calc(100vw - 32px))"
            p="5"
            borderRadius="l2"
            borderWidth="1px"
            borderColor="border"
            bg="bg.default"
            boxShadow="xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Box fontWeight="semibold" mb="3">Keyboard shortcuts</Box>
            <Flex gap="2" direction="column" textStyle="sm">
              <ShortcutRow keys="V L A R O P H T S M D X C" label="Choose tools" />
              <ShortcutRow keys="+ / -" label="Zoom in or out" />
              <ShortcutRow keys="Cmd/Ctrl wheel or pinch" label="Zoom around cursor" />
              <ShortcutRow keys="Two-finger pan / Middle drag / Space drag" label="Pan viewport" />
              <ShortcutRow keys="Enter / double click" label="Edit selected text or step" />
              <ShortcutRow keys="Shift drag / Shift click" label="Add layers to selection" />
              <ShortcutRow keys="Arrow keys" label="Nudge selected layers" />
              <ShortcutRow keys="Cmd/Ctrl Arrow" label="Resize selected bounds" />
              <ShortcutRow keys="Cmd/Ctrl Alt +/-" label="Grow or shrink selected bounds" />
              <ShortcutRow keys="Cmd/Ctrl Alt Arrow" label="Grow or shrink an edge" />
              <ShortcutRow keys="Cmd/Ctrl Alt 1/F/[/]" label="Zoom to selected region" />
              <ShortcutRow keys="Cmd/Ctrl Alt R" label="Smart-fit selected layers" />
              <ShortcutRow keys="Cmd/Ctrl C, X, V, D" label="Copy, cut, paste, duplicate layers" />
              <ShortcutRow keys="Cmd/Ctrl Z / Shift Z" label="Undo or redo" />
            </Flex>
          </Box>
        </Box>
      </Show>
    </Box>
  );
};

const ShortcutRow = (props: { keys: string; label: string }) => (
  <HStack justifyContent="space-between" gap="4">
    <Box color="fg.muted">{props.label}</Box>
    <Badge variant="subtle" colorPalette="gray">{props.keys}</Badge>
  </HStack>
);

const snapThreshold = 6;

const alignmentLabel = (command: AlignmentCommand) => {
  switch (command) {
    case "left":
      return "left";
    case "center":
      return "center";
    case "right":
      return "right";
    case "top":
      return "top";
    case "middle":
      return "middle";
    case "bottom":
      return "bottom";
  }
};

const selectionViewLabel = (kind: SelectionViewAction["kind"]) => {
  switch (kind) {
    case "zoom":
      return "Zoomed to selection.";
    case "fit-region":
      return "Fit selected region.";
    case "top-left":
      return "Focused selection top-left.";
    case "bottom-right":
      return "Focused selection bottom-right.";
  }
};

const snapBoundsToTargets = (
  bounds: Bounds,
  targets: SnapTarget[],
  mode: SnapMode,
): SnapResult => {
  let deltaX = 0;
  let deltaY = 0;
  const guides: SnapGuide[] = [];
  const xAnchors = [bounds.x, bounds.x + bounds.width / 2, bounds.x + bounds.width];
  const yAnchors = [bounds.y, bounds.y + bounds.height / 2, bounds.y + bounds.height];

  if (snapModeAllowsAxis(mode, "x")) {
    const snap = nearestSnapDelta(xAnchors, targets.filter((target) => target.axis === "x"));

    if (snap) {
      deltaX = snap.delta;
      guides.push({
        axis: "x",
        position: snap.target.position,
        min: Math.min(snap.target.min, bounds.y),
        max: Math.max(snap.target.max, bounds.y + bounds.height),
      });
    }
  }

  if (snapModeAllowsAxis(mode, "y")) {
    const snap = nearestSnapDelta(yAnchors, targets.filter((target) => target.axis === "y"));

    if (snap) {
      deltaY = snap.delta;
      guides.push({
        axis: "y",
        position: snap.target.position,
        min: Math.min(snap.target.min, bounds.x),
        max: Math.max(snap.target.max, bounds.x + bounds.width),
      });
    }
  }

  return {
    bounds: moveBounds(bounds, deltaX, deltaY),
    guides,
  };
};

const snapPointToTargets = (
  point: Point,
  targets: SnapTarget[],
  mode: SnapMode,
): { point: Point; guides: SnapGuide[] } => {
  let x = point.x;
  let y = point.y;
  const guides: SnapGuide[] = [];

  if (snapModeAllowsAxis(mode, "x")) {
    const snap = nearestSnapDelta([point.x], targets.filter((target) => target.axis === "x"));

    if (snap) {
      x += snap.delta;
      guides.push({
        axis: "x",
        position: snap.target.position,
        min: Math.min(snap.target.min, point.y - 32),
        max: Math.max(snap.target.max, point.y + 32),
      });
    }
  }

  if (snapModeAllowsAxis(mode, "y")) {
    const snap = nearestSnapDelta([point.y], targets.filter((target) => target.axis === "y"));

    if (snap) {
      y += snap.delta;
      guides.push({
        axis: "y",
        position: snap.target.position,
        min: Math.min(snap.target.min, point.x - 32),
        max: Math.max(snap.target.max, point.x + 32),
      });
    }
  }

  return { point: { x, y }, guides };
};

const nearestSnapDelta = (anchors: number[], targets: SnapTarget[]) => {
  let best:
    | {
        delta: number;
        distance: number;
        target: SnapTarget;
      }
    | undefined;

  for (const anchor of anchors) {
    for (const target of targets) {
      const delta = target.position - anchor;
      const distanceToTarget = Math.abs(delta);

      if (distanceToTarget > snapThreshold) {
        continue;
      }

      if (!best || distanceToTarget < best.distance) {
        best = { delta, distance: distanceToTarget, target };
      }
    }
  }

  return best;
};

const buildSnapTargets = (
  project: ImageEditorProject,
  excludedIds: string[],
  movingBounds: Bounds,
): SnapTarget[] => {
  const targets: SnapTarget[] = [];
  const excluded = new Set(excludedIds);
  const pushX = (position: number, min = 0, max = project.height) => {
    targets.push({ axis: "x", position, min, max });
  };
  const pushY = (position: number, min = 0, max = project.width) => {
    targets.push({ axis: "y", position, min, max });
  };

  pushX(0);
  pushX(project.width / 2);
  pushX(project.width);
  pushY(0);
  pushY(project.height / 2);
  pushY(project.height);

  const baseOffset = getBaseImageOffset(project);
  const imageBounds = {
    x: baseOffset.x,
    y: baseOffset.y,
    width: project.baseImage.width,
    height: project.baseImage.height,
  };

  pushX(imageBounds.x, imageBounds.y, imageBounds.y + imageBounds.height);
  pushX(imageBounds.x + imageBounds.width / 2, imageBounds.y, imageBounds.y + imageBounds.height);
  pushX(imageBounds.x + imageBounds.width, imageBounds.y, imageBounds.y + imageBounds.height);
  pushY(imageBounds.y, imageBounds.x, imageBounds.x + imageBounds.width);
  pushY(imageBounds.y + imageBounds.height / 2, imageBounds.x, imageBounds.x + imageBounds.width);
  pushY(imageBounds.y + imageBounds.height, imageBounds.x, imageBounds.x + imageBounds.width);

  const otherBounds = project.annotations
    .filter((annotation) => !annotation.hidden && !excluded.has(annotation.id))
    .map(getAnnotationBounds);

  for (const bounds of otherBounds) {
    pushX(bounds.x, bounds.y, bounds.y + bounds.height);
    pushX(bounds.x + bounds.width / 2, bounds.y, bounds.y + bounds.height);
    pushX(bounds.x + bounds.width, bounds.y, bounds.y + bounds.height);
    pushY(bounds.y, bounds.x, bounds.x + bounds.width);
    pushY(bounds.y + bounds.height / 2, bounds.x, bounds.x + bounds.width);
    pushY(bounds.y + bounds.height, bounds.x, bounds.x + bounds.width);
  }

  addEqualSpacingTargets(otherBounds, movingBounds, targets);

  return targets;
};

const addEqualSpacingTargets = (
  otherBounds: Bounds[],
  movingBounds: Bounds,
  targets: SnapTarget[],
) => {
  const horizontal = [...otherBounds].sort((first, second) => first.x - second.x);

  for (let index = 0; index < horizontal.length - 1; index += 1) {
    const left = horizontal[index];
    const right = horizontal[index + 1];

    if (!left || !right || right.x <= left.x + left.width) {
      continue;
    }

    const targetLeft = (left.x + left.width + right.x - movingBounds.width) / 2;
    targets.push({
      axis: "x",
      position: targetLeft,
      min: Math.min(left.y, right.y),
      max: Math.max(left.y + left.height, right.y + right.height),
    });
    targets.push({
      axis: "x",
      position: targetLeft + movingBounds.width,
      min: Math.min(left.y, right.y),
      max: Math.max(left.y + left.height, right.y + right.height),
    });
  }

  const vertical = [...otherBounds].sort((first, second) => first.y - second.y);

  for (let index = 0; index < vertical.length - 1; index += 1) {
    const top = vertical[index];
    const bottom = vertical[index + 1];

    if (!top || !bottom || bottom.y <= top.y + top.height) {
      continue;
    }

    const targetTop = (top.y + top.height + bottom.y - movingBounds.height) / 2;
    targets.push({
      axis: "y",
      position: targetTop,
      min: Math.min(top.x, bottom.x),
      max: Math.max(top.x + top.width, bottom.x + bottom.width),
    });
    targets.push({
      axis: "y",
      position: targetTop + movingBounds.height,
      min: Math.min(top.x, bottom.x),
      max: Math.max(top.x + top.width, bottom.x + bottom.width),
    });
  }
};

const snapModeAllowsAxis = (mode: SnapMode, axis: SnapAxis) =>
  mode === "both" ||
  (mode === "horizontal" && axis === "x") ||
  (mode === "vertical" && axis === "y");

const detectMonotoneBlockBounds = (
  imageData: ImageData,
  seedPoint: Point,
  searchBounds: Bounds,
): Bounds | undefined => {
  const width = imageData.width;
  const height = imageData.height;
  const seedX = Math.max(0, Math.min(width - 1, Math.round(seedPoint.x)));
  const seedY = Math.max(0, Math.min(height - 1, Math.round(seedPoint.y)));
  const target = readPixel(imageData, seedX, seedY);

  if (!target) {
    return undefined;
  }

  const left = Math.max(0, Math.floor(searchBounds.x));
  const top = Math.max(0, Math.floor(searchBounds.y));
  const right = Math.min(width - 1, Math.ceil(searchBounds.x + searchBounds.width));
  const bottom = Math.min(height - 1, Math.ceil(searchBounds.y + searchBounds.height));
  const visited = new Set<number>();
  const stack: Point[] = [{ x: seedX, y: seedY }];
  let minX = seedX;
  let minY = seedY;
  let maxX = seedX;
  let maxY = seedY;
  let count = 0;

  while (stack.length > 0 && count < 350_000) {
    const point = stack.pop();

    if (!point) {
      continue;
    }

    const x = Math.round(point.x);
    const y = Math.round(point.y);

    if (x < left || x > right || y < top || y > bottom) {
      continue;
    }

    const key = y * width + x;

    if (visited.has(key)) {
      continue;
    }

    visited.add(key);
    const pixel = readPixel(imageData, x, y);

    if (!pixel || pixelDistance(target, pixel) > 18) {
      continue;
    }

    count += 1;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    stack.push({ x: x + 1, y });
    stack.push({ x: x - 1, y });
    stack.push({ x, y: y + 1 });
    stack.push({ x, y: y - 1 });
  }

  if (count < 16) {
    return undefined;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
};

const readPixel = (
  imageData: ImageData,
  x: number,
  y: number,
): [number, number, number, number] | undefined => {
  const index = (y * imageData.width + x) * 4;
  const data = imageData.data;

  if (index < 0 || index + 3 >= data.length) {
    return undefined;
  }

  return [
    data[index] ?? 0,
    data[index + 1] ?? 0,
    data[index + 2] ?? 0,
    data[index + 3] ?? 0,
  ];
};

const pixelDistance = (
  first: [number, number, number, number],
  second: [number, number, number, number],
) =>
  Math.hypot(
    first[0] - second[0],
    first[1] - second[1],
    first[2] - second[2],
    (first[3] - second[3]) * 0.5,
  );

const expandBoundsBy = (bounds: Bounds, amount: number): Bounds => ({
  x: bounds.x - amount,
  y: bounds.y - amount,
  width: bounds.width + amount * 2,
  height: bounds.height + amount * 2,
});

const clampPointToProject = (
  point: Point,
  project: Pick<ImageEditorProject, "width" | "height">,
): Point => ({
  x: Math.max(0, Math.min(project.width - 1, point.x)),
  y: Math.max(0, Math.min(project.height - 1, point.y)),
});

const createDraftAnnotation = (
  tool: ImageEditorTool,
  point: Point,
  settings: EditorSettings,
  options: {
    measureMode: MeasureMode;
    measureInfo?: MeasurePointerInfo;
  } = { measureMode: "edge" },
): EditorDraft | undefined => {
  const id = createEditorId("layer");
  const createdAt = Date.now();

  switch (tool) {
    case "line":
    case "arrow":
      return {
        id,
        type: "arrow",
        createdAt,
        opacity: settings.opacity,
        start: point,
        end: point,
        color: settings.color,
        strokeWidth: settings.strokeWidth,
        arrowStyle: tool === "line" ? "line-only" : settings.arrowStyle,
      };
    case "measure": {
      const start = options.measureInfo?.point ?? point;

      return {
        id,
        type: "measure",
        createdAt,
        opacity: settings.opacity,
        start,
        end: start,
        color: settings.color,
        strokeWidth: settings.strokeWidth,
        mode: options.measureMode,
        axis: options.measureMode === "point" ? "point" : options.measureInfo?.axis,
        startSnap: measureEndpointSnapFromInfo(options.measureInfo),
      };
    }
    case "rectangle":
    case "ellipse":
    case "erase":
    case "pixelate":
      return {
        id,
        type: tool,
        createdAt,
        opacity: settings.opacity,
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        strokeColor: settings.color,
        fillColor: settings.fillColor,
        strokeWidth: settings.strokeWidth,
        rectangleStyle: settings.rectangleStyle,
      };
    case "pen":
    case "highlighter":
      return {
        id,
        type: tool,
        createdAt,
        opacity: settings.opacity,
        points: [point],
        color: settings.color,
        strokeWidth: tool === "highlighter" ? settings.strokeWidth * 3 : settings.strokeWidth,
      };
    case "crop":
      return {
        id,
        type: "crop",
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
      };
    case "select":
    case "step":
    case "text":
      return undefined;
  }
};

const updateDraft = (
  draft: EditorDraft,
  start: Point,
  point: Point,
  options: {
    centerFromStart: boolean;
    constrain: boolean;
    measureInfo?: MeasurePointerInfo;
  },
): EditorDraft => {
  switch (draft.type) {
    case "arrow":
      return {
        ...draft,
        end: options.constrain ? constrainPointTo45Degrees(start, point) : point,
      };
    case "measure":
      return updateMeasureDraft(draft, point, options.measureInfo, options.constrain);
    case "rectangle":
    case "ellipse":
    case "pixelate":
    case "erase":
    case "crop": {
      const bounds = getGestureRect(start, point, options);

      return {
        ...draft,
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      };
    }
    case "pen":
    case "highlighter":
      if (distance(draft.points[draft.points.length - 1] ?? start, point) < 1.5) {
        return draft;
      }

      return {
        ...draft,
        points: [...draft.points, point],
      };
    case "text":
    case "step":
    case "image":
      return draft;
  }
};

const updateMeasureDraft = (
  draft: MeasureAnnotation,
  point: Point,
  measureInfo: MeasurePointerInfo | undefined,
  constrain: boolean,
): MeasureAnnotation => {
  const mode = draft.mode ?? "point";

  if (mode === "point") {
    return {
      ...draft,
      axis: "point",
      end: constrain ? constrainPointTo45Degrees(draft.start, point) : point,
      endSnap: undefined,
    };
  }

  const fallbackAxis =
    draft.axis ?? measureInfo?.axis ?? measureAxisFromSnap(draft.startSnap) ?? "horizontal";
  const axis = measureInfo?.axis ?? inferMeasureAxis(draft.start, point, fallbackAxis);
  const end =
    measureInfo?.point ?? constrainMeasurePointToAxis(draft.start, point, axis);

  return {
    ...draft,
    axis,
    end,
    endSnap: measureEndpointSnapFromInfo(measureInfo),
  };
};

const normalizeMeasureMode = (
  annotation: MeasureAnnotation,
  mode: MeasureMode,
): MeasureAnnotation => {
  if (mode === "point") {
    return {
      ...annotation,
      mode,
      axis: "point",
      startSnap: undefined,
      endSnap: undefined,
    };
  }

  return {
    ...annotation,
    mode,
    axis:
      annotation.axis && annotation.axis !== "point"
        ? annotation.axis
        : inferMeasureAxis(annotation.start, annotation.end, "horizontal"),
  };
};

const updateAnchoredMeasureDraft = (
  currentDraft: EditorDraft | undefined,
  interaction: MeasureAnchorInteraction,
  point: Point,
  measureInfo: MeasurePointerInfo | undefined,
  settings: EditorSettings,
): MeasureAnnotation => {
  const draft =
    currentDraft?.type === "measure"
      ? currentDraft
      : ({
          id: createEditorId("layer"),
          type: "measure",
          createdAt: Date.now(),
          opacity: settings.opacity,
          start: interaction.start,
          end: interaction.start,
          color: settings.color,
          strokeWidth: settings.strokeWidth,
          mode: "edge",
          axis: interaction.axis,
          startSnap: interaction.startSnap,
        } satisfies MeasureAnnotation);

  return updateMeasureDraft(draft, point, measureInfo, false);
};

const createTextAnnotation = (
  point: Point,
  settings: EditorSettings,
  text = "",
): ImageAnnotation => ({
  id: createEditorId("layer"),
  type: "text",
  createdAt: Date.now(),
  opacity: settings.opacity,
  x: point.x,
  y: point.y,
  text,
  color: settings.color,
  backgroundColor: settings.fillColor,
  fontSize: settings.fontSize,
  textStyle: settings.textStyle,
});

const createStepAnnotation = (
  point: Point,
  settings: EditorSettings,
  annotations: ImageAnnotation[],
): ImageAnnotation => {
  const nextNumber =
    annotations.filter((annotation) => annotation.type === "step").length + 1;

  return {
    id: createEditorId("layer"),
    type: "step",
    createdAt: Date.now(),
    opacity: settings.opacity,
    x: point.x,
    y: point.y,
    label: nextNumber.toString(),
    color: settings.color,
    size: Math.max(28, settings.fontSize * 1.35),
    stepStyle: settings.stepStyle,
  };
};

const isShapeTextAnnotation = (
  annotation: ImageAnnotation,
): annotation is ArrowAnnotation | BoxAnnotation =>
  annotation.type === "arrow" ||
  annotation.type === "rectangle" ||
  annotation.type === "ellipse" ||
  annotation.type === "pixelate" ||
  annotation.type === "erase";

const createAttachedTextForAnnotation = (
  annotation: ArrowAnnotation | BoxAnnotation,
  settings: EditorSettings,
): AttachedText => {
  const bounds = getDefaultAttachedTextBounds(annotation, settings);

  return {
    text: "",
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    color: settings.color,
    backgroundColor: "rgba(255, 255, 255, 0)",
    fontSize: settings.fontSize,
    textStyle: "none",
    textAlign: "center",
    verticalAlign: "middle",
  };
};

const getDefaultAttachedTextBounds = (
  annotation: ArrowAnnotation | BoxAnnotation,
  settings: EditorSettings,
): Bounds => {
  if (annotation.type === "arrow") {
    const minX = Math.min(annotation.start.x, annotation.end.x);
    const minY = Math.min(annotation.start.y, annotation.end.y);
    const width = Math.max(96, Math.abs(annotation.end.x - annotation.start.x));
    const height = Math.max(settings.fontSize * 1.6, Math.abs(annotation.end.y - annotation.start.y));

    return {
      x: minX,
      y: minY - height - Math.max(4, settings.strokeWidth),
      width,
      height,
    };
  }

  const bounds = normalizeRect(annotation.x, annotation.y, annotation.width, annotation.height);
  const inset = Math.max(6, annotation.strokeWidth * 1.5);

  return {
    x: bounds.x + inset,
    y: bounds.y + inset,
    width: Math.max(24, bounds.width - inset * 2),
    height: Math.max(settings.fontSize * 1.6, bounds.height - inset * 2),
  };
};

const isUsableDraft = (draft: EditorDraft) => {
  switch (draft.type) {
    case "arrow":
      return distance(draft.start, draft.end) >= 8;
    case "measure":
      return getMeasureLength(draft) >= 8;
    case "rectangle":
    case "ellipse":
    case "pixelate":
    case "erase":
    case "crop": {
      const bounds = normalizeRect(draft.x, draft.y, draft.width, draft.height);
      return bounds.width >= 8 && bounds.height >= 8;
    }
    case "pen":
    case "highlighter":
      return draft.points.length >= 2;
    case "text":
    case "step":
    case "image":
      return true;
  }
};

const findHitAnnotation = (
  annotations: ImageAnnotation[],
  point: Point,
  matches: (annotation: ImageAnnotation) => boolean = () => true,
): ImageAnnotation | undefined => {
  for (let index = annotations.length - 1; index >= 0; index -= 1) {
    const annotation = annotations[index];

    if (annotation && matches(annotation) && hitTestAnnotation(annotation, point)) {
      return annotation;
    }
  }

  return undefined;
};

const getMeasureEndpointHandleAt = (
  annotation: MeasureAnnotation,
  point: Point,
): MeasureEndpointHandle | undefined => {
  const handleRadius = Math.max(8, annotation.strokeWidth * 2.5);

  if (distance(annotation.start, point) <= handleRadius) {
    return "start";
  }

  if (distance(annotation.end, point) <= handleRadius) {
    return "end";
  }

  return undefined;
};

const resizeMeasureEndpoint = (
  annotation: ImageAnnotation,
  interaction: MeasureEndpointInteraction,
  point: Point,
  measureInfo: MeasurePointerInfo | undefined,
): ImageAnnotation => {
  if (annotation.type !== "measure") {
    return annotation;
  }

  const mode = annotation.mode ?? "point";

  if (mode === "point" || interaction.axis === "point") {
    return {
      ...annotation,
      axis: "point",
      start: interaction.endpoint === "start" ? point : annotation.start,
      end: interaction.endpoint === "end" ? point : annotation.end,
      startSnap:
        interaction.endpoint === "start" ? undefined : annotation.startSnap,
      endSnap: interaction.endpoint === "end" ? undefined : annotation.endSnap,
    };
  }

  const nextPoint =
    measureInfo?.point ??
    constrainMeasurePointToAxis(interaction.anchor, point, interaction.axis);
  const nextSnap = measureEndpointSnapFromInfo(measureInfo);

  return {
    ...annotation,
    axis: interaction.axis,
    start: interaction.endpoint === "start" ? nextPoint : annotation.start,
    end: interaction.endpoint === "end" ? nextPoint : annotation.end,
    startSnap:
      interaction.endpoint === "start" ? nextSnap : annotation.startSnap,
    endSnap: interaction.endpoint === "end" ? nextSnap : annotation.endSnap,
  };
};

const getClipboardImageFiles = (clipboardData: DataTransfer): File[] => {
  const files = Array.from(clipboardData.files).filter((file) =>
    file.type.startsWith("image/"),
  );

  for (const item of Array.from(clipboardData.items)) {
    if (item.kind !== "file" || !item.type.startsWith("image/")) {
      continue;
    }

    const file = item.getAsFile();

    if (!file || files.some((candidate) => isSameClipboardFile(candidate, file))) {
      continue;
    }

    files.push(file);
  }

  return files;
};

const isSameClipboardFile = (first: File, second: File) =>
  first.name === second.name &&
  first.size === second.size &&
  first.type === second.type &&
  first.lastModified === second.lastModified;

const annotationTypeLabel = (annotation: ImageAnnotation | EditorDraft) =>
  annotation.type === "crop"
    ? toolLabels.crop
    : annotation.type === "image"
      ? "Image"
      : annotation.type === "arrow" && annotation.arrowStyle === "line-only"
        ? toolLabels.line
      : toolLabels[annotation.type];

const expandProjectToAnnotations = (
  project: ImageEditorProject,
): ImageEditorProject => expandProjectToContent(project).project;

const fitProjectToContent = (project: ImageEditorProject): ImageEditorProject => {
  const padding = 24;
  const baseOffset = getBaseImageOffset(project);
  const baseBounds = {
    minX: baseOffset.x,
    minY: baseOffset.y,
    maxX: baseOffset.x + project.baseImage.width,
    maxY: baseOffset.y + project.baseImage.height,
  };
  const contentBounds = project.annotations.reduce(
    (bounds, annotation) => {
      const annotationBounds = getAnnotationBounds(annotation);

      return {
        minX: Math.min(bounds.minX, annotationBounds.x - padding),
        minY: Math.min(bounds.minY, annotationBounds.y - padding),
        maxX: Math.max(bounds.maxX, annotationBounds.x + annotationBounds.width + padding),
        maxY: Math.max(bounds.maxY, annotationBounds.y + annotationBounds.height + padding),
      };
    },
    baseBounds,
  );
  const minX = Math.floor(Math.max(0, contentBounds.minX));
  const minY = Math.floor(Math.max(0, contentBounds.minY));
  const maxX = Math.ceil(Math.min(project.width, contentBounds.maxX));
  const maxY = Math.ceil(Math.min(project.height, contentBounds.maxY));
  const nextWidth = Math.max(1, maxX - minX);
  const nextHeight = Math.max(1, maxY - minY);

  if (
    minX === 0 &&
    minY === 0 &&
    nextWidth === project.width &&
    nextHeight === project.height
  ) {
    return expandProjectToAnnotations(project);
  }

  return expandProjectToAnnotations({
    ...project,
    width: nextWidth,
    height: nextHeight,
    baseImage: {
      ...project.baseImage,
      offsetX: baseOffset.x - minX,
      offsetY: baseOffset.y - minY,
    },
    annotations: project.annotations.map((annotation) =>
      moveAnnotation(annotation, -minX, -minY),
    ),
  });
};

const padProjectCanvas = (
  project: ImageEditorProject,
  padding: number,
): ImageEditorProject => ({
  ...project,
  width: project.width + padding * 2,
  height: project.height + padding * 2,
  baseImage: {
    ...project.baseImage,
    offsetX: (project.baseImage.offsetX ?? 0) + padding,
    offsetY: (project.baseImage.offsetY ?? 0) + padding,
  },
  annotations: project.annotations.map((annotation) =>
    moveAnnotation(annotation, padding, padding),
  ),
});

const expandProjectForInteraction = (
  project: ImageEditorProject,
  interaction: MoveInteraction | ResizeInteraction | MeasureEndpointInteraction,
): {
  project: ImageEditorProject;
  interaction: MoveInteraction | ResizeInteraction | MeasureEndpointInteraction;
} => {
  const expansion = expandProjectToContent(project);

  return {
    project: expansion.project,
    interaction: shiftInteraction(interaction, expansion.shift),
  };
};

const expandProjectForDraft = (
  project: ImageEditorProject,
  draft: ImageAnnotation,
  interaction: DrawingInteraction | MeasureAnchorInteraction,
): {
  project: ImageEditorProject;
  draft: ImageAnnotation;
  interaction: DrawingInteraction | MeasureAnchorInteraction;
} => {
  const expansion = expandProjectToContent(project, [draft]);

  if (expansion.shift.x === 0 && expansion.shift.y === 0) {
    return {
      project: expansion.project,
      draft,
      interaction,
    };
  }

  return {
    project: expansion.project,
    draft: moveAnnotation(draft, expansion.shift.x, expansion.shift.y),
    interaction: shiftInteraction(interaction, expansion.shift),
  };
};

const expandProjectToContent = (
  project: ImageEditorProject,
  extraAnnotations: ImageAnnotation[] = [],
): { project: ImageEditorProject; shift: Point } => {
  const padding = 24;
  const contentBounds = [...project.annotations, ...extraAnnotations].reduce(
    (bounds, annotation) => {
      const annotationBounds = getAnnotationBounds(annotation);

      return {
        minX: Math.min(bounds.minX, annotationBounds.x - padding),
        minY: Math.min(bounds.minY, annotationBounds.y - padding),
        maxX: Math.max(bounds.maxX, annotationBounds.x + annotationBounds.width + padding),
        maxY: Math.max(bounds.maxY, annotationBounds.y + annotationBounds.height + padding),
      };
    },
    { minX: 0, minY: 0, maxX: project.width, maxY: project.height },
  );
  const shiftX = contentBounds.minX < 0 ? Math.ceil(-contentBounds.minX) : 0;
  const shiftY = contentBounds.minY < 0 ? Math.ceil(-contentBounds.minY) : 0;
  const width = Math.ceil(Math.max(project.width + shiftX, contentBounds.maxX + shiftX));
  const height = Math.ceil(Math.max(project.height + shiftY, contentBounds.maxY + shiftY));
  const shift = { x: shiftX, y: shiftY };

  if (width === project.width && height === project.height && shiftX === 0 && shiftY === 0) {
    return { project, shift };
  }

  return {
    project: {
      ...project,
      width,
      height,
      baseImage:
        shiftX === 0 && shiftY === 0
          ? project.baseImage
          : {
              ...project.baseImage,
              offsetX: (project.baseImage.offsetX ?? 0) + shiftX,
              offsetY: (project.baseImage.offsetY ?? 0) + shiftY,
            },
      annotations:
        shiftX === 0 && shiftY === 0
          ? project.annotations
          : project.annotations.map((annotation) => moveAnnotation(annotation, shiftX, shiftY)),
    },
    shift,
  };
};

const shiftInteraction = <T extends EditorInteraction>(
  interaction: T,
  shift: Point,
): T => {
  if (shift.x === 0 && shift.y === 0) {
    return interaction;
  }

  switch (interaction.type) {
    case "draw":
    case "measure-anchor":
      return {
        ...interaction,
        start: movePoint(interaction.start, shift.x, shift.y),
      } as T;
    case "move":
      return {
        ...interaction,
        start: movePoint(interaction.start, shift.x, shift.y),
        originalAnnotations: interaction.originalAnnotations.map((annotation) =>
          moveAnnotation(annotation, shift.x, shift.y),
        ),
      } as T;
    case "resize":
      return {
        ...interaction,
        start: movePoint(interaction.start, shift.x, shift.y),
        initialBounds: moveBounds(interaction.initialBounds, shift.x, shift.y),
        originalAnnotations: interaction.originalAnnotations.map((annotation) =>
          moveAnnotation(annotation, shift.x, shift.y),
        ),
      } as T;
    case "measure-endpoint":
      return {
        ...interaction,
        start: movePoint(interaction.start, shift.x, shift.y),
        anchor: movePoint(interaction.anchor, shift.x, shift.y),
        originalAnnotations: interaction.originalAnnotations.map((annotation) =>
          moveAnnotation(annotation, shift.x, shift.y),
        ),
      } as T;
    case "crop-move":
    case "crop-resize":
    case "marquee":
      return interaction;
  }
};

const applySettingsToAnnotation = (
  annotation: ImageAnnotation,
  settings: EditorSettings,
): ImageAnnotation => {
  switch (annotation.type) {
    case "arrow":
    case "measure":
      return {
        ...annotation,
        color: settings.color,
        strokeWidth: settings.strokeWidth,
        opacity: settings.opacity,
        ...(annotation.type === "arrow" ? { arrowStyle: settings.arrowStyle } : {}),
      };
    case "rectangle":
    case "ellipse":
    case "erase":
    case "pixelate":
      return {
        ...annotation,
        strokeColor: settings.color,
        fillColor: settings.fillColor,
        strokeWidth: settings.strokeWidth,
        opacity: settings.opacity,
        rectangleStyle: settings.rectangleStyle,
      };
    case "pen":
    case "highlighter":
      return {
        ...annotation,
        color: settings.color,
        strokeWidth:
          annotation.type === "highlighter"
            ? settings.strokeWidth * 3
            : settings.strokeWidth,
        opacity: settings.opacity,
      };
    case "text":
      return {
        ...annotation,
        color: settings.color,
        backgroundColor: settings.fillColor,
        fontSize: settings.fontSize,
        opacity: settings.opacity,
        textStyle: settings.textStyle,
      };
    case "step":
      return {
        ...annotation,
        color: settings.color,
        size: Math.max(28, settings.fontSize * 1.35),
        opacity: settings.opacity,
        stepStyle: settings.stepStyle,
      };
    case "image":
      return {
        ...annotation,
        opacity: settings.opacity,
      };
  }
};

const settingsFromAnnotation = (
  annotation: ImageAnnotation,
  fallback: EditorSettings,
): EditorSettings => {
  switch (annotation.type) {
    case "arrow":
    case "measure":
      return {
        ...fallback,
        color: annotation.color,
        strokeWidth: annotation.strokeWidth,
        opacity: annotation.opacity,
        ...(annotation.type === "arrow"
          ? { arrowStyle: annotation.arrowStyle ?? fallback.arrowStyle }
          : {}),
      };
    case "rectangle":
    case "ellipse":
    case "erase":
    case "pixelate":
      return {
        ...fallback,
        color: annotation.strokeColor,
        fillColor: annotation.fillColor,
        strokeWidth: annotation.strokeWidth,
        opacity: annotation.opacity,
        rectangleStyle: annotation.rectangleStyle ?? fallback.rectangleStyle,
      };
    case "pen":
      return {
        ...fallback,
        color: annotation.color,
        strokeWidth: annotation.strokeWidth,
        opacity: annotation.opacity,
      };
    case "highlighter":
      return {
        ...fallback,
        color: annotation.color,
        strokeWidth: Math.max(1, Math.round(annotation.strokeWidth / 3)),
        opacity: annotation.opacity,
      };
    case "text":
      return {
        ...fallback,
        color: annotation.color,
        fillColor: annotation.backgroundColor,
        fontSize: annotation.fontSize,
        opacity: annotation.opacity,
        textStyle: annotation.textStyle ?? fallback.textStyle,
      };
    case "step":
      return {
        ...fallback,
        color: annotation.color,
        fontSize: Math.round(annotation.size / 1.35),
        opacity: annotation.opacity,
        stepStyle: annotation.stepStyle ?? fallback.stepStyle,
      };
    case "image":
      return {
        ...fallback,
        opacity: annotation.opacity,
      };
  }
};

const sameSettings = (first: EditorSettings, second: EditorSettings) =>
  first.color === second.color &&
  first.fillColor === second.fillColor &&
  first.strokeWidth === second.strokeWidth &&
  first.fontSize === second.fontSize &&
  first.opacity === second.opacity &&
  first.arrowStyle === second.arrowStyle &&
  first.rectangleStyle === second.rectangleStyle &&
  first.textStyle === second.textStyle &&
  first.stepStyle === second.stepStyle;

const sameAttachedText = (first: AttachedText, second: AttachedText) =>
  first.text === second.text &&
  first.x === second.x &&
  first.y === second.y &&
  first.width === second.width &&
  first.height === second.height &&
  first.color === second.color &&
  first.backgroundColor === second.backgroundColor &&
  first.fontSize === second.fontSize &&
  first.textStyle === second.textStyle &&
  first.textAlign === second.textAlign &&
  first.verticalAlign === second.verticalAlign;

const toolFromShortcut = (key: string): ImageEditorTool | undefined => {
  switch (key.toLowerCase()) {
    case "v":
      return "select";
    case "l":
      return "line";
    case "a":
      return "arrow";
    case "r":
      return "rectangle";
    case "o":
      return "ellipse";
    case "p":
      return "pen";
    case "h":
      return "highlighter";
    case "t":
      return "text";
    case "s":
      return "step";
    case "m":
      return "measure";
    case "d":
      return "erase";
    case "x":
      return "pixelate";
    case "c":
      return "crop";
    default:
      return undefined;
  }
};

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
};

const createCropDraftFromBounds = (bounds: Bounds): CropDraft => ({
  id: createEditorId("crop"),
  type: "crop",
  x: bounds.x,
  y: bounds.y,
  width: bounds.width,
  height: bounds.height,
});

const clampMovableBoundsToProject = (
  bounds: Bounds,
  project: Pick<ImageEditorProject, "width" | "height">,
): Bounds => {
  const width = Math.min(bounds.width, project.width);
  const height = Math.min(bounds.height, project.height);

  return {
    x: Math.max(0, Math.min(bounds.x, project.width - width)),
    y: Math.max(0, Math.min(bounds.y, project.height - height)),
    width,
    height,
  };
};

const moveBounds = (bounds: Bounds, deltaX: number, deltaY: number): Bounds => ({
  x: bounds.x + deltaX,
  y: bounds.y + deltaY,
  width: bounds.width,
  height: bounds.height,
});

const movePoint = (point: Point, deltaX: number, deltaY: number): Point => ({
  x: point.x + deltaX,
  y: point.y + deltaY,
});

const isPointInBounds = (point: Point, bounds: Bounds) =>
  point.x >= bounds.x &&
  point.x <= bounds.x + bounds.width &&
  point.y >= bounds.y &&
  point.y <= bounds.y + bounds.height;

const distance = (first: Point, second: Point) =>
  Math.hypot(first.x - second.x, first.y - second.y);

const getMeasureLength = (annotation: MeasureAnnotation) => {
  switch (annotation.axis) {
    case "horizontal":
      return Math.abs(annotation.end.x - annotation.start.x);
    case "vertical":
      return Math.abs(annotation.end.y - annotation.start.y);
    case "point":
    case undefined:
      return distance(annotation.start, annotation.end);
  }
};

const intersects = (first: Bounds, second: Bounds) =>
  first.x < second.x + second.width &&
  first.x + first.width > second.x &&
  first.y < second.y + second.height &&
  first.y + first.height > second.y;

const clampZoom = (zoom: number) => Math.max(0.001, Math.min(5, zoom));

const numericZoom = (zoom: ImageEditorZoom) => (zoom === "fit" ? 1 : zoom);

const formatZoom = (zoom: number) => `${Math.round(zoom * 100)}%`;

const eventNudgeLabel = (deltaX: number, deltaY: number) => {
  if (deltaX < 0) {
    return "left";
  }

  if (deltaX > 0) {
    return "right";
  }

  if (deltaY < 0) {
    return "up";
  }

  return "down";
};

const constrainPointTo45Degrees = (start: Point, point: Point): Point => {
  const deltaX = point.x - start.x;
  const deltaY = point.y - start.y;
  const angle = Math.atan2(deltaY, deltaX);
  const distanceFromStart = Math.hypot(deltaX, deltaY);
  const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);

  return {
    x: start.x + Math.cos(snappedAngle) * distanceFromStart,
    y: start.y + Math.sin(snappedAngle) * distanceFromStart,
  };
};

const getGestureRect = (
  start: Point,
  point: Point,
  options: { centerFromStart: boolean; constrain: boolean },
) => {
  let deltaX = point.x - start.x;
  let deltaY = point.y - start.y;

  if (options.constrain) {
    const size = Math.max(Math.abs(deltaX), Math.abs(deltaY));
    deltaX = Math.sign(deltaX || 1) * size;
    deltaY = Math.sign(deltaY || 1) * size;
  }

  if (options.centerFromStart) {
    return {
      x: start.x - deltaX,
      y: start.y - deltaY,
      width: deltaX * 2,
      height: deltaY * 2,
    };
  }

  return {
    x: start.x,
    y: start.y,
    width: deltaX,
    height: deltaY,
  };
};

const createBeforeAfterFrame = (
  beforeImage: HTMLImageElement,
  afterImage: HTMLImageElement,
) => {
  const margin = 48;
  const gap = 32;
  const labelHeight = 40;
  const imagePadding = 18;
  const maxImageWidth = 760;
  const maxImageHeight = 620;
  const beforeSize = fitImageSize(
    beforeImage.naturalWidth,
    beforeImage.naturalHeight,
    maxImageWidth,
    maxImageHeight,
  );
  const afterSize = fitImageSize(
    afterImage.naturalWidth,
    afterImage.naturalHeight,
    maxImageWidth,
    maxImageHeight,
  );
  const frameWidth = Math.max(beforeSize.width, afterSize.width) + imagePadding * 2;
  const frameHeight =
    Math.max(beforeSize.height, afterSize.height) + imagePadding * 2 + labelHeight;
  const width = margin * 2 + frameWidth * 2 + gap;
  const height = margin * 2 + frameHeight;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create before/after frame.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawBeforeAfterPanel(
    context,
    beforeImage,
    beforeSize,
    "Before",
    margin,
    margin,
    frameWidth,
    frameHeight,
    imagePadding,
    labelHeight,
  );

  drawBeforeAfterPanel(
    context,
    afterImage,
    afterSize,
    "After",
    margin + frameWidth + gap,
    margin,
    frameWidth,
    frameHeight,
    imagePadding,
    labelHeight,
  );

  return {
    width: canvas.width,
    height: canvas.height,
    dataUrl: canvas.toDataURL("image/png"),
  };
};

const fitImageSize = (
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
) => {
  const scale = Math.min(1, maxWidth / width, maxHeight / height);

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

const createMeasureTestProject = (): ImageEditorProject => {
  const width = 960;
  const height = 620;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create measure test image.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#0f172a";
  context.font = "700 24px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif";
  context.textAlign = "left";
  context.textBaseline = "top";
  context.fillText("Measure calibration image", 40, 28);
  context.font = "500 14px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif";
  context.fillStyle = "#475569";
  context.fillText("Labels show the visible inner-edge gap in source image pixels.", 40, 62);

  const verticalGaps = [20, 40, 76, 120, 160];
  const horizontalGaps = [24, 50, 96, 144, 200];
  const verticalX = [70, 210, 390, 610, 760];

  verticalGaps.forEach((gap, index) => {
    drawMeasureTestVerticalGap(context, verticalX[index] ?? 70, 130, gap);
  });

  horizontalGaps.forEach((gap, index) => {
    const y = 390 + index * 42;
    drawMeasureTestHorizontalGap(context, 90, y, gap);
  });

  const now = Date.now();

  return {
    version: 1,
    id: createEditorId("project"),
    name: "Measure test image",
    width,
    height,
    baseImage: {
      dataUrl: canvas.toDataURL("image/png"),
      mimeType: "image/png",
      width,
      height,
    },
    annotations: [],
    createdAt: now,
    updatedAt: now,
  };
};

const drawMeasureTestVerticalGap = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  gap: number,
) => {
  const lineHeight = 170;

  context.save();
  context.strokeStyle = "#020617";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(x + 0.5, y);
  context.lineTo(x + 0.5, y + lineHeight);
  context.moveTo(x + gap + 0.5, y);
  context.lineTo(x + gap + 0.5, y + lineHeight);
  context.stroke();

  const visibleGap = Math.max(0, gap - 2);
  context.fillStyle = "#0f172a";
  context.font = "700 14px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif";
  context.textAlign = "center";
  context.textBaseline = "top";
  context.fillText(`${visibleGap}px`, x + gap / 2, y + lineHeight + 14);
  context.restore();
};

const drawMeasureTestHorizontalGap = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  gap: number,
) => {
  const lineWidth = 720;

  context.save();
  context.strokeStyle = "#020617";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(x, y + 0.5);
  context.lineTo(x + lineWidth, y + 0.5);
  context.moveTo(x, y + gap + 0.5);
  context.lineTo(x + lineWidth, y + gap + 0.5);
  context.stroke();

  const visibleGap = Math.max(0, gap - 2);
  context.fillStyle = "#0f172a";
  context.font = "700 14px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif";
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillText(`${visibleGap}px`, x + lineWidth + 18, y + gap / 2);
  context.restore();
};

const drawBeforeAfterPanel = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  imageSize: { width: number; height: number },
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
  imagePadding: number,
  labelHeight: number,
) => {
  context.save();
  context.fillStyle = "#f8fafc";
  context.strokeStyle = "#cbd5e1";
  context.lineWidth = 2;
  context.beginPath();
  context.roundRect(x, y, width, height, 12);
  context.fill();
  context.stroke();

  context.fillStyle = "#0f172a";
  context.font = "700 18px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, x + width / 2, y + labelHeight / 2);

  const imageX = x + (width - imageSize.width) / 2;
  const imageY =
    y + labelHeight + imagePadding + (height - labelHeight - imagePadding * 2 - imageSize.height) / 2;
  context.drawImage(image, imageX, imageY, imageSize.width, imageSize.height);
  context.restore();
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read rendered image."));
    };
    reader.onerror = () => reject(new Error("Unable to read rendered image."));
    reader.readAsDataURL(blob);
  });

const downloadBaseName = (name: string) => {
  const withoutExtension = name.replace(/\.[^.]+$/, "");
  const normalized = withoutExtension
    .trim()
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return normalized || "image-annotation";
};
