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
  getBaseImageOffset,
  getBoundsResizeHandleAt,
  getResizeHandleAt,
  hitTestAnnotation,
  loadImageElement,
  moveAnnotation,
  normalizeRect,
  resizeBounds,
  resizeAnnotation,
  renderProjectToPngBlob,
  type Bounds,
} from "./image-editor.render";
import { ImageEditorCanvas } from "./ImageEditorCanvas";
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
  type CropDraft,
  type EditorDraft,
  type EditorSettings,
  type HistoryEntry,
  type ImageAnnotation,
  type ImageEditorProject,
  type ImageEditorPngPayload,
  type ImageEditorTool,
  type ImageEditorZoom,
  type Point,
  type ResizeHandle,
} from "./image-editor.types";

type DrawingInteraction = {
  type: "draw";
  tool: ImageEditorTool;
  start: Point;
};

type MoveInteraction = {
  type: "move";
  annotationId: string;
  start: Point;
  originalAnnotations: ImageAnnotation[];
  commitLabel?: string;
};

type ResizeInteraction = {
  type: "resize";
  annotationId: string;
  handle: ResizeHandle;
  start: Point;
  initialBounds: Bounds;
  originalAnnotations: ImageAnnotation[];
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
  | CropMoveInteraction
  | CropResizeInteraction;

type PngExport = {
  blob: Blob;
  payload: ImageEditorPngPayload;
};

type CommitProjectOptions = {
  fitToContent?: boolean;
};

export const ImageEditor = () => {
  let fileInputRef: HTMLInputElement | undefined;
  let shellRef: HTMLDivElement | undefined;
  const [project, setProject] = createSignal<ImageEditorProject>();
  const [history, setHistory] = createSignal<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = createSignal(-1);
  const [activeTool, setActiveTool] = createSignal<ImageEditorTool>("select");
  const [settings, setSettings] = createSignal<EditorSettings>({
    ...defaultEditorSettings,
  });
  const [draft, setDraft] = createSignal<EditorDraft>();
  const [selectedId, setSelectedId] = createSignal<string>();
  const [interaction, setInteraction] = createSignal<EditorInteraction>();
  const [isExporting, setIsExporting] = createSignal(false);
  const [isCopying, setIsCopying] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const [isHistoryOpen, setIsHistoryOpen] = createSignal(true);
  const [status, setStatus] = createSignal("Ready for paste, drop, or import.");
  const [zoom, setZoom] = createSignal<ImageEditorZoom>("fit");
  const [annotationClipboard, setAnnotationClipboard] =
    createSignal<ImageAnnotation>();
  const [inlineEditingId, setInlineEditingId] = createSignal<string>();
  const [inlineEditOriginalAnnotations, setInlineEditOriginalAnnotations] =
    createSignal<ImageAnnotation[]>();
  const [hasPendingInlineEdit, setHasPendingInlineEdit] = createSignal(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = createSignal(false);
  const [isBeforeAfterMode, setIsBeforeAfterMode] = createSignal(false);
  const [savedImages, setSavedImages] = createSignal<SavedImageSummary[]>([]);
  let keyboardNudgeTimer: number | undefined;

  const selectedAnnotation = createMemo(() =>
    project()?.annotations.find((annotation) => annotation.id === selectedId()),
  );
  const inlineEditingAnnotation = createMemo(() => {
    const annotation = project()?.annotations.find(
      (candidate) => candidate.id === inlineEditingId(),
    );

    if (annotation?.type === "text" || annotation?.type === "step") {
      return annotation;
    }

    return undefined;
  });
  const visibleInlineEditingAnnotation = createMemo(() => {
    const annotation = inlineEditingAnnotation();
    const tool = activeTool();

    if (!annotation || annotation.hidden || (tool !== "select" && tool !== annotation.type)) {
      return undefined;
    }

    return annotation;
  });
  const canUndo = createMemo(() => historyIndex() > 0);
  const canRedo = createMemo(() => historyIndex() < history().length - 1);

  createEffect(() => {
    const id = selectedId();

    if (!id) {
      return;
    }

    if (!project()?.annotations.some((annotation) => annotation.id === id)) {
      setSelectedId(undefined);
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

  const commitProject = (
    nextProject: ImageEditorProject,
    label: string,
    options: CommitProjectOptions = {},
  ) => {
    clearKeyboardNudgeTimer();
    const timestamp = Date.now();
    const expandedProject = options.fitToContent
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
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
      setStatus(label);
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

      setActiveTool(tool);
    });
    setStatus(`${toolLabels[tool]} tool`);
  };

  const handleFileInput = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = "";
    void importFiles(files, "Imported image");
  };

  const handlePointerDown = (point: Point, event: PointerEvent) => {
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
    const resizeHandle = selected ? getResizeHandleAt(selected, point) : undefined;

    if (selected && resizeHandle) {
      setInteraction({
        type: "resize",
        annotationId: selected.id,
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
      setSelectedId(hit?.id);
      setInlineEditingId(undefined);

      if (hit) {
        if (event.altKey) {
          const duplicate = {
            ...structuredClone(hit),
            id: createEditorId("layer"),
            createdAt: Date.now(),
            hidden: false,
          };
          const nextAnnotations = [...currentProject.annotations, duplicate];

          batch(() => {
            setProject({
              ...currentProject,
              annotations: nextAnnotations,
              updatedAt: Date.now(),
            });
            setSelectedId(duplicate.id);
            setInteraction({
              type: "move",
              annotationId: duplicate.id,
              start: point,
              originalAnnotations: structuredClone(nextAnnotations),
              commitLabel: "Duplicated layer",
            });
          });
          return;
        }

        setInteraction({
          type: "move",
          annotationId: hit.id,
          start: point,
          originalAnnotations: structuredClone(currentProject.annotations),
        });
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
          annotationId: sameToolHit.id,
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

    const nextDraft = createDraftAnnotation(tool, point, settings());

    if (!nextDraft) {
      return;
    }

    batch(() => {
      setSelectedId(undefined);
      setDraft(nextDraft);
      setInteraction({ type: "draw", tool, start: point });
    });
  };

  const handlePointerMove = (point: Point, event: PointerEvent) => {
    event.preventDefault();
    const currentInteraction = interaction();
    const currentProject = project();

    if (!currentInteraction || !currentProject) {
      return;
    }

    if (currentInteraction.type === "move") {
      const deltaX = point.x - currentInteraction.start.x;
      const deltaY = point.y - currentInteraction.start.y;
      const nextProject = {
        ...currentProject,
        annotations: currentInteraction.originalAnnotations.map((annotation) =>
          annotation.id === currentInteraction.annotationId
            ? moveAnnotation(annotation, deltaX, deltaY)
            : annotation,
        ),
        updatedAt: Date.now(),
      };
      const expanded = expandProjectForInteraction(nextProject, currentInteraction);

      batch(() => {
        setProject(expanded.project);
        setInteraction(expanded.interaction);
      });
      return;
    }

    if (currentInteraction.type === "resize") {
      const nextProject = {
        ...currentProject,
        annotations: currentInteraction.originalAnnotations.map((annotation) =>
          annotation.id === currentInteraction.annotationId
            ? resizeAnnotation(
                annotation,
                currentInteraction.initialBounds,
                currentInteraction.handle,
                point,
              )
            : annotation,
        ),
        updatedAt: Date.now(),
      };
      const expanded = expandProjectForInteraction(nextProject, currentInteraction);

      batch(() => {
        setProject(expanded.project);
        setInteraction(expanded.interaction);
      });
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

    const nextDraft = updateDraft(currentDraft, currentInteraction.start, point, {
      centerFromStart: event.altKey,
      constrain: event.shiftKey,
    });

    if (nextDraft.type === "crop") {
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
    });
  };

  const handlePointerUp = (point: Point, event: PointerEvent) => {
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

    const currentDraft = draft();
    const currentProject = project();

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
    );
    setSelectedId(currentDraft.id);
  };

  const finishMoveInteraction = (currentInteraction: MoveInteraction, point: Point) => {
    const currentProject = project();
    const movedDistance = distance(currentInteraction.start, point);

    batch(() => {
      setInteraction(undefined);
      setDraft(undefined);
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
        commitProject(nextProject, currentInteraction.commitLabel);
      } else {
        setProject(nextProject);
      }
      return;
    }

    commitProject(currentProject, currentInteraction.commitLabel ?? "Moved layer", {
      fitToContent: true,
    });
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

    commitProject(currentProject, "Resized layer", { fitToContent: true });
  };

  const finishCropAdjustment = (
    currentInteraction: CropMoveInteraction | CropResizeInteraction,
    point: Point,
  ) => {
    const movedDistance = distance(currentInteraction.start, point);

    setInteraction(undefined);

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

    const currentProject = project();
    const id = selectedId();

    if (!currentProject || !id) {
      return;
    }

    commitProject(
      {
        ...currentProject,
        annotations: currentProject.annotations.map((annotation) =>
          annotation.id === id ? applySettingsToAnnotation(annotation, nextSettings) : annotation,
        ),
      },
      "Updated layer style",
    );
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

    if (!currentProject || (annotation?.type !== "text" && annotation?.type !== "step")) {
      return;
    }

    batch(() => {
      setSelectedId(id);
      setInlineEditingId(id);
      setInlineEditOriginalAnnotations(
        structuredClone(originalAnnotations ?? currentProject.annotations),
      );
      setHasPendingInlineEdit(false);
    });
  };

  const deleteSelected = () => {
    const id = selectedId();

    if (id) {
      deleteLayer(id);
    }
  };

  const deleteLayer = (id: string) => {
    const currentProject = project();

    if (!currentProject || !id) {
      return;
    }

    commitProject(
      {
        ...currentProject,
        annotations: currentProject.annotations.filter((annotation) => annotation.id !== id),
      },
      "Deleted layer",
    );
    setSelectedId(undefined);
    setInlineEditingId(undefined);
  };

  const duplicateSelected = () => {
    const id = selectedId();

    if (id) {
      duplicateLayer(id);
      return;
    }

    setStatus("Select a layer to duplicate.");
  };

  const duplicateLayer = (id: string) => {
    const currentProject = project();
    const annotation = currentProject?.annotations.find((candidate) => candidate.id === id);

    if (!currentProject || !annotation) {
      setStatus("Select a layer to duplicate.");
      return;
    }

    const duplicate = moveAnnotation(
      {
        ...structuredClone(annotation),
        id: createEditorId("layer"),
        createdAt: Date.now(),
        hidden: false,
      },
      16,
      16,
    );

    commitProject(
      {
        ...currentProject,
        annotations: [...currentProject.annotations, duplicate],
      },
      "Duplicated layer",
    );
    setSelectedId(duplicate.id);
    setStatus("Duplicated layer.");
  };

  const copySelectedAnnotation = () => {
    const annotation = selectedAnnotation();

    if (!annotation) {
      setStatus("Select a layer to copy.");
      return false;
    }

    setAnnotationClipboard(structuredClone(annotation));
    setStatus("Copied layer.");
    return true;
  };

  const cutSelectedAnnotation = () => {
    const currentProject = project();
    const annotation = selectedAnnotation();

    if (!currentProject || !annotation) {
      setStatus("Select a layer to cut.");
      return false;
    }

    setAnnotationClipboard(structuredClone(annotation));
    commitProject(
      {
        ...currentProject,
        annotations: currentProject.annotations.filter(
          (candidate) => candidate.id !== annotation.id,
        ),
      },
      "Cut layer",
    );
    batch(() => {
      setSelectedId(undefined);
      setInlineEditingId(undefined);
    });
    setStatus("Cut layer.");
    return true;
  };

  const pasteCopiedAnnotation = () => {
    const currentProject = project();
    const copiedAnnotation = annotationClipboard();

    if (!currentProject || !copiedAnnotation) {
      setStatus("No copied layer to paste.");
      return false;
    }

    const duplicate = moveAnnotation(
      {
        ...structuredClone(copiedAnnotation),
        id: createEditorId("layer"),
        createdAt: Date.now(),
        hidden: false,
      },
      24,
      24,
    );

    commitProject(
      {
        ...currentProject,
        annotations: [...currentProject.annotations, duplicate],
      },
      "Pasted layer",
    );
    setSelectedId(duplicate.id);
    setAnnotationClipboard(structuredClone(duplicate));
    setStatus("Pasted layer.");
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
    const id = selectedId();

    if (id) {
      bringLayerForward(id);
    }
  };

  const sendSelectedBackward = () => {
    const id = selectedId();

    if (id) {
      sendLayerBackward(id);
    }
  };

  const bringLayerForward = (id: string) => {
    reorderLayer(id, 1, "Brought layer forward");
  };

  const sendLayerBackward = (id: string) => {
    reorderLayer(id, -1, "Sent layer backward");
  };

  const reorderLayer = (id: string, direction: -1 | 1, label: string) => {
    const currentProject = project();

    if (!currentProject || !id) {
      return;
    }

    const index = currentProject.annotations.findIndex((annotation) => annotation.id === id);
    const nextIndex = index + direction;

    if (index < 0 || nextIndex < 0 || nextIndex >= currentProject.annotations.length) {
      setStatus(direction > 0 ? "Layer is already in front." : "Layer is already behind.");
      return;
    }

    const nextAnnotations = [...currentProject.annotations];
    const [annotation] = nextAnnotations.splice(index, 1);

    if (!annotation) {
      return;
    }

    nextAnnotations.splice(nextIndex, 0, annotation);
    commitProject(
      {
        ...currentProject,
        annotations: nextAnnotations,
      },
      label,
    );
    setSelectedId(id);
    setStatus(label);
  };

  const selectLayer = (id: string) => {
    const annotation = project()?.annotations.find((candidate) => candidate.id === id);

    if (!annotation) {
      return;
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

    if (nextHidden && selectedId() === id) {
      batch(() => {
        setSelectedId(undefined);
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

    if (hit?.type === "text" || hit?.type === "step") {
      startInlineEditFor(hit.id);
    }
  };

  const moveSelectedByKeyboard = (deltaX: number, deltaY: number) => {
    const currentProject = project();
    const id = selectedId();

    if (!currentProject || !id) {
      return;
    }

    setProject(expandProjectToAnnotations({
      ...currentProject,
      annotations: currentProject.annotations.map((annotation) =>
        annotation.id === id ? moveAnnotation(annotation, deltaX, deltaY) : annotation,
      ),
      updatedAt: Date.now(),
    }));
    setSelectedId(id);
    scheduleKeyboardNudgeCommit();
    setStatus(`Nudged layer ${eventNudgeLabel(deltaX, deltaY)}.`);
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

  const handleKeyboardShortcut = (event: KeyboardEvent) => {
    if (isEditableTarget(event.target)) {
      return;
    }

    const isPrimaryModifier = event.metaKey || event.ctrlKey;
    const key = event.key.toLowerCase();

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
      if (annotationClipboard()) {
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
      if (selectedId()) {
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

    if (event.key.startsWith("Arrow") && selectedId()) {
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
        onToggleBeforeAfterMode={() => {
          const nextMode = !isBeforeAfterMode();
          setIsBeforeAfterMode(nextMode);
          setStatus(
            nextMode
              ? "Next pasted image will be framed as before/after."
              : "Before/after framing off.",
          );
        }}
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
            selectedId={selectedId()}
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
          selectedId={selectedId()}
          selectedAnnotation={selectedAnnotation()}
          inlineEditingAnnotation={visibleInlineEditingAnnotation()}
          activeTool={activeTool()}
          zoom={zoom()}
          settings={settings()}
          onChooseFile={chooseFile}
          onFiles={(files) => void importFiles(files, "Dropped image")}
          onZoomChange={handleZoomChange}
          onSettingsChange={handleSettingsChange}
          onStartInlineEdit={startInlineEdit}
          onInlineEditChange={(id, value) =>
            updateAnnotationLive(id, (annotation) =>
              annotation.type === "text"
                ? { ...annotation, text: value }
                : annotation.type === "step"
                  ? { ...annotation, label: value }
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
              <ShortcutRow keys="V A R O P H T S M X C" label="Choose tools" />
              <ShortcutRow keys="+ / -" label="Zoom in or out" />
              <ShortcutRow keys="Mouse wheel" label="Zoom around cursor" />
              <ShortcutRow keys="Middle drag / Space drag" label="Pan viewport" />
              <ShortcutRow keys="Enter / double click" label="Edit selected text or step" />
              <ShortcutRow keys="Arrow keys" label="Nudge selected layer" />
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

const createDraftAnnotation = (
  tool: ImageEditorTool,
  point: Point,
  settings: EditorSettings,
): EditorDraft | undefined => {
  const id = createEditorId("layer");
  const createdAt = Date.now();

  switch (tool) {
    case "arrow":
    case "measure":
      return {
        id,
        type: tool,
        createdAt,
        opacity: settings.opacity,
        start: point,
        end: point,
        color: settings.color,
        strokeWidth: settings.strokeWidth,
      };
    case "rectangle":
    case "ellipse":
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
    case "text":
    case "step":
      return undefined;
  }
};

const updateDraft = (
  draft: EditorDraft,
  start: Point,
  point: Point,
  options: { centerFromStart: boolean; constrain: boolean },
): EditorDraft => {
  switch (draft.type) {
    case "arrow":
    case "measure":
      return {
        ...draft,
        end: options.constrain ? constrainPointTo45Degrees(start, point) : point,
      };
    case "rectangle":
    case "ellipse":
    case "pixelate":
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
  };
};

const isUsableDraft = (draft: EditorDraft) => {
  switch (draft.type) {
    case "arrow":
    case "measure":
      return distance(draft.start, draft.end) >= 8;
    case "rectangle":
    case "ellipse":
    case "pixelate":
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
  interaction: MoveInteraction | ResizeInteraction,
): { project: ImageEditorProject; interaction: MoveInteraction | ResizeInteraction } => {
  const expansion = expandProjectToContent(project);

  return {
    project: expansion.project,
    interaction: shiftInteraction(interaction, expansion.shift),
  };
};

const expandProjectForDraft = (
  project: ImageEditorProject,
  draft: ImageAnnotation,
  interaction: DrawingInteraction,
): {
  project: ImageEditorProject;
  draft: ImageAnnotation;
  interaction: DrawingInteraction;
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
    case "crop-move":
    case "crop-resize":
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
      };
    case "rectangle":
    case "ellipse":
    case "pixelate":
      return {
        ...annotation,
        strokeColor: settings.color,
        fillColor: settings.fillColor,
        strokeWidth: settings.strokeWidth,
        opacity: settings.opacity,
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
      };
    case "step":
      return {
        ...annotation,
        color: settings.color,
        size: Math.max(28, settings.fontSize * 1.35),
        opacity: settings.opacity,
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
      };
    case "rectangle":
    case "ellipse":
    case "pixelate":
      return {
        ...fallback,
        color: annotation.strokeColor,
        fillColor: annotation.fillColor,
        strokeWidth: annotation.strokeWidth,
        opacity: annotation.opacity,
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
      };
    case "step":
      return {
        ...fallback,
        color: annotation.color,
        fontSize: Math.round(annotation.size / 1.35),
        opacity: annotation.opacity,
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
  first.opacity === second.opacity;

const toolFromShortcut = (key: string): ImageEditorTool | undefined => {
  switch (key.toLowerCase()) {
    case "v":
      return "select";
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

const intersects = (first: Bounds, second: Bounds) =>
  first.x < second.x + second.width &&
  first.x + first.width > second.x &&
  first.y < second.y + second.height &&
  first.y + first.height > second.y;

const clampZoom = (zoom: number) => Math.max(0.1, Math.min(5, zoom));

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
