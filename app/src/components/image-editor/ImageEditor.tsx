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
  getResizeHandleAt,
  hitTestAnnotation,
  loadImageElement,
  moveAnnotation,
  normalizeRect,
  resizeAnnotation,
  renderProjectToPngBlob,
  type Bounds,
} from "./image-editor.render";
import { ImageEditorCanvas } from "./ImageEditorCanvas";
import { ImageEditorSidebar } from "./ImageEditorSidebar";
import { ImageEditorToolbar } from "./ImageEditorToolbar";
import {
  appendPngDataToBlob,
  createPngDataPayload,
  extractPngDataFromFile,
  readFileAsDataUrl,
} from "./image-editor.png-data";
import {
  cloneProject,
  createEditorId,
  defaultEditorSettings,
  type CropDraft,
  type EditorDraft,
  type EditorSettings,
  type HistoryEntry,
  type ImageAnnotation,
  type ImageEditorProject,
  type ImageEditorTool,
  type ImageEditorZoom,
  type Point,
  type ResizeHandle,
  toolLabels,
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

type EditorInteraction = DrawingInteraction | MoveInteraction | ResizeInteraction;

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

    const handlePaste = (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.files ?? []).filter((file) =>
        file.type.startsWith("image/"),
      );

      if (files.length === 0) {
        return;
      }

      event.preventDefault();
      void handlePastedImage(files[0]);
    };

    window.addEventListener("paste", handlePaste);
    window.addEventListener("keydown", handleKeyboardShortcut);

    onCleanup(() => {
      clearKeyboardNudgeTimer();
      window.removeEventListener("paste", handlePaste);
      window.removeEventListener("keydown", handleKeyboardShortcut);
    });
  });

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
    commitCurrentProject("Nudged layer");
  };

  const scheduleKeyboardNudgeCommit = () => {
    clearKeyboardNudgeTimer();
    keyboardNudgeTimer = window.setTimeout(() => {
      keyboardNudgeTimer = undefined;
      commitCurrentProject("Nudged layer");
    }, 350);
  };

  const commitProject = (nextProject: ImageEditorProject, label: string) => {
    clearKeyboardNudgeTimer();
    const timestamp = Date.now();
    const expandedProject = expandProjectToAnnotations(nextProject);
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

  const commitCurrentProject = (label: string) => {
    const currentProject = project();

    if (!currentProject) {
      return;
    }

    commitProject(currentProject, label);
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

  const importFiles = async (files: File[], label: string) => {
    const file = files.find((candidate) => candidate.type.startsWith("image/"));

    if (!file) {
      setStatus("No image file found.");
      return;
    }

    try {
      const embeddedPayload = await extractPngDataFromFile(file);

      if (embeddedPayload) {
        restorePngDataProject(
          embeddedPayload.project,
          embeddedPayload.historyLog,
          embeddedPayload.history,
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
      batch(() => {
        setInlineEditingId(undefined);
        setInlineEditOriginalAnnotations(undefined);
        setHasPendingInlineEdit(false);
      });
    }

    batch(() => {
      if (tool !== "select") {
        setSelectedId(undefined);
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

    const tool = activeTool();

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
      setProject({
        ...currentProject,
        annotations: currentInteraction.originalAnnotations.map((annotation) =>
          annotation.id === currentInteraction.annotationId
            ? moveAnnotation(annotation, deltaX, deltaY)
            : annotation,
        ),
        updatedAt: Date.now(),
      });
      return;
    }

    if (currentInteraction.type === "resize") {
      setProject({
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
      });
      return;
    }

    const currentDraft = draft();

    if (!currentDraft) {
      return;
    }

    setDraft(
      updateDraft(currentDraft, currentInteraction.start, point, {
        centerFromStart: event.altKey,
        constrain: event.shiftKey,
      }),
    );
  };

  const handlePointerUp = (point: Point, event: PointerEvent) => {
    event.preventDefault();
    const currentInteraction = interaction();

    if (!currentInteraction) {
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

    batch(() => {
      setInteraction(undefined);
      setDraft(undefined);
    });

    if (!currentDraft || !currentProject || !isUsableDraft(currentDraft)) {
      return;
    }

    if (currentDraft.type === "crop") {
      void cropProject(currentDraft, currentProject);
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

    commitProject(currentProject, currentInteraction.commitLabel ?? "Moved layer");
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

    commitProject(currentProject, "Resized layer");
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

      context.drawImage(
        image,
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height,
        0,
        0,
        bounds.width,
        bounds.height,
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
          },
          annotations: adjustedAnnotations,
        },
        "Cropped canvas",
      );
      batch(() => {
        setSelectedId(undefined);
        setActiveTool("select");
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to crop image.");
    }
  };

  const exportPng = async () => {
    const blob = await buildPngBlob();

    if (!blob) {
      return;
    }

    const currentProject = project();

    if (!currentProject) {
      return;
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${downloadBaseName(currentProject.name)}-annotated.png`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 30000);
    setStatus("Exported PNG with PNGDATA.");
  };

  const copyPng = async () => {
    const blob = await buildPngBlob();

    if (!blob) {
      return;
    }

    if (!("ClipboardItem" in window) || !navigator.clipboard?.write) {
      setStatus("Clipboard image writing is not available in this browser.");
      return;
    }

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);
      setStatus("Copied PNG with PNGDATA.");
    } catch {
      setStatus("Clipboard copy was blocked by the browser.");
    }
  };

  const buildPngBlob = async () => {
    commitPendingKeyboardNudge();
    const currentProject = project();

    if (!currentProject) {
      return undefined;
    }

    try {
      setIsExporting(true);
      const renderedBlob = await renderProjectToPngBlob(currentProject);
      const payload = createPngDataPayload(
        currentProject,
        history().slice(0, historyIndex() + 1),
      );

      return await appendPngDataToBlob(renderedBlob, payload);
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
    if (!hasPendingInlineEdit()) {
      setInlineEditingId(undefined);
      setInlineEditOriginalAnnotations(undefined);
      return;
    }

    setHasPendingInlineEdit(false);
    setInlineEditingId(undefined);
    setInlineEditOriginalAnnotations(undefined);
    commitCurrentProject("Edited layer");
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

  const startInlineEditFor = (id: string) => {
    const currentProject = project();
    const annotation = currentProject?.annotations.find((candidate) => candidate.id === id);

    if (!currentProject || (annotation?.type !== "text" && annotation?.type !== "step")) {
      return;
    }

    batch(() => {
      setSelectedId(id);
      setInlineEditingId(id);
      setInlineEditOriginalAnnotations(structuredClone(currentProject.annotations));
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

  const handlePastedImage = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    const currentProject = project();

    if (!currentProject) {
      void importFiles([file], "Pasted image");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const image = await loadImageElement(dataUrl);
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

    setProject({
      ...currentProject,
      annotations: currentProject.annotations.map((annotation) =>
        annotation.id === id ? moveAnnotation(annotation, deltaX, deltaY) : annotation,
      ),
      updatedAt: Date.now(),
    });
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
      minH="100dvh"
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
        isHistoryOpen={isHistoryOpen()}
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
        onExport={handleExport}
        onCopy={handleCopy}
        onShowShortcuts={() => setIsShortcutsOpen(true)}
      />

      <Flex
        minH={{ base: "auto", lg: "calc(100dvh - 57px)" }}
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
              <ShortcutRow keys="V A R O P H T S X C" label="Choose tools" />
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
      return {
        id,
        type: "arrow",
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
): ImageAnnotation => ({
  id: createEditorId("layer"),
  type: "text",
  createdAt: Date.now(),
  opacity: settings.opacity,
  x: point.x,
  y: point.y,
  text: "Text",
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
): ImageAnnotation | undefined => {
  for (let index = annotations.length - 1; index >= 0; index -= 1) {
    const annotation = annotations[index];

    if (annotation && hitTestAnnotation(annotation, point)) {
      return annotation;
    }
  }

  return undefined;
};

const annotationTypeLabel = (annotation: ImageAnnotation | EditorDraft) =>
  annotation.type === "crop"
    ? toolLabels.crop
    : annotation.type === "image"
      ? "Image"
      : toolLabels[annotation.type];

const expandProjectToAnnotations = (
  project: ImageEditorProject,
): ImageEditorProject => {
  const padding = 24;
  const maxBounds = project.annotations.reduce(
    (bounds, annotation) => {
      const annotationBounds = getAnnotationBounds(annotation);

      return {
        width: Math.max(bounds.width, Math.ceil(annotationBounds.x + annotationBounds.width + padding)),
        height: Math.max(bounds.height, Math.ceil(annotationBounds.y + annotationBounds.height + padding)),
      };
    },
    { width: project.width, height: project.height },
  );

  if (maxBounds.width === project.width && maxBounds.height === project.height) {
    return project;
  }

  return {
    ...project,
    width: maxBounds.width,
    height: maxBounds.height,
  };
};

const applySettingsToAnnotation = (
  annotation: ImageAnnotation,
  settings: EditorSettings,
): ImageAnnotation => {
  switch (annotation.type) {
    case "arrow":
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

const downloadBaseName = (name: string) => {
  const withoutExtension = name.replace(/\.[^.]+$/, "");
  const normalized = withoutExtension
    .trim()
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return normalized || "image-annotation";
};
