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
import { ImageEditorHistory } from "./ImageEditorHistory";
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
  const [inlineEditingId, setInlineEditingId] = createSignal<string>();
  const [inlineEditOriginalAnnotations, setInlineEditOriginalAnnotations] =
    createSignal<ImageAnnotation[]>();
  const [hasPendingInlineEdit, setHasPendingInlineEdit] = createSignal(false);

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
      void importFiles(files, "Pasted image");
    };

    window.addEventListener("paste", handlePaste);
    window.addEventListener("keydown", handleKeyboardShortcut);

    onCleanup(() => {
      window.removeEventListener("paste", handlePaste);
      window.removeEventListener("keydown", handleKeyboardShortcut);
    });
  });

  const commitProject = (nextProject: ImageEditorProject, label: string) => {
    const timestamp = Date.now();
    const snapshot = cloneProject({
      ...nextProject,
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
        restorePngDataProject(embeddedPayload.project, embeddedPayload.historyLog);
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
  ) => {
    const snapshot = cloneProject({
      ...restoredProject,
      updatedAt: Date.now(),
    });
    const logEntries = restoredLog.map((entry) => ({
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
    });
  };

  const chooseFile = () => {
    fileInputRef?.click();
  };

  const handleFileInput = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = "";
    void importFiles(files, "Imported image");
  };

  const handlePointerDown = (point: Point, event: PointerEvent) => {
    event.preventDefault();
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
      batch(() => {
        setSelectedId(annotation.id);
        setActiveTool("select");
      });
      startInlineEditFor(annotation.id);
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
      startInlineEditFor(annotation.id);
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

    setDraft(updateDraft(currentDraft, currentInteraction.start, point));
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
      `Added ${toolLabels[currentDraft.type]}`,
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
      setProject({
        ...currentProject,
        annotations: currentInteraction.originalAnnotations,
      });
      return;
    }

    commitProject(currentProject, "Moved layer");
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
    const currentProject = project();

    if (!currentProject) {
      return undefined;
    }

    try {
      setIsExporting(true);
      const renderedBlob = await renderProjectToPngBlob(currentProject);
      const payload = createPngDataPayload(
        currentProject,
        history()
          .slice(0, historyIndex() + 1)
          .map((entry) => ({
            id: entry.id,
            label: entry.label,
            timestamp: entry.timestamp,
          })),
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
      setActiveTool("select");
    });
  };

  const deleteSelected = () => {
    const currentProject = project();
    const id = selectedId();

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
    const currentProject = project();
    const annotation = selectedAnnotation();

    if (!currentProject || !annotation) {
      return;
    }

    const duplicate = moveAnnotation(
      {
        ...structuredClone(annotation),
        id: createEditorId("layer"),
        createdAt: Date.now(),
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
  };

  const bringSelectedForward = () => {
    reorderSelected(1, "Brought layer forward");
  };

  const sendSelectedBackward = () => {
    reorderSelected(-1, "Sent layer backward");
  };

  const reorderSelected = (direction: -1 | 1, label: string) => {
    const currentProject = project();
    const id = selectedId();

    if (!currentProject || !id) {
      return;
    }

    const index = currentProject.annotations.findIndex((annotation) => annotation.id === id);
    const nextIndex = index + direction;

    if (index < 0 || nextIndex < 0 || nextIndex >= currentProject.annotations.length) {
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

    commitProject(
      {
        ...currentProject,
        annotations: currentProject.annotations.map((annotation) =>
          annotation.id === id ? moveAnnotation(annotation, deltaX, deltaY) : annotation,
        ),
      },
      "Nudged layer",
    );
    setSelectedId(id);
  };

  const handleKeyboardShortcut = (event: KeyboardEvent) => {
    if (isEditableTarget(event.target)) {
      return;
    }

    const isPrimaryModifier = event.metaKey || event.ctrlKey;

    if (isPrimaryModifier && event.key.toLowerCase() === "z") {
      event.preventDefault();

      if (event.shiftKey) {
        restoreHistoryEntry(historyIndex() + 1);
      } else {
        restoreHistoryEntry(historyIndex() - 1);
      }
      return;
    }

    if (isPrimaryModifier && event.key.toLowerCase() === "y") {
      event.preventDefault();
      restoreHistoryEntry(historyIndex() + 1);
      return;
    }

    if (isPrimaryModifier && event.shiftKey && event.key.toLowerCase() === "c") {
      event.preventDefault();
      handleCopy();
      return;
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      if (selectedId()) {
        event.preventDefault();
        deleteSelected();
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      batch(() => {
        setDraft(undefined);
        setInteraction(undefined);
        setInlineEditingId(undefined);
        setSelectedId(undefined);
        setActiveTool("select");
      });
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
      setActiveTool(shortcutTool);
      setStatus(`${toolLabels[shortcutTool]} tool`);
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
        onToolChange={setActiveTool}
        onToggleHistory={() => setIsHistoryOpen((value) => !value)}
        onChooseFile={chooseFile}
        onUndo={() => restoreHistoryEntry(historyIndex() - 1)}
        onRedo={() => restoreHistoryEntry(historyIndex() + 1)}
        onExport={handleExport}
        onCopy={handleCopy}
      />

      <Flex
        minH={{ base: "auto", xl: "calc(100dvh - 64px)" }}
        direction={{ base: "column", xl: "row" }}
      >
        <Show when={isHistoryOpen()}>
          <ImageEditorHistory
            entries={history()}
            activeIndex={historyIndex()}
            onJump={restoreHistoryEntry}
          />
        </Show>
        <ImageEditorCanvas
          project={project()}
          draft={draft()}
          selectedId={selectedId()}
          selectedAnnotation={selectedAnnotation()}
          inlineEditingAnnotation={inlineEditingAnnotation()}
          activeTool={activeTool()}
          settings={settings()}
          onChooseFile={chooseFile}
          onFiles={(files) => void importFiles(files, "Dropped image")}
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
    </Box>
  );
};

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
): EditorDraft => {
  switch (draft.type) {
    case "arrow":
      return { ...draft, end: point };
    case "rectangle":
    case "ellipse":
    case "pixelate":
      return {
        ...draft,
        width: point.x - start.x,
        height: point.y - start.y,
      };
    case "pen":
    case "highlighter":
      if (distance(draft.points[draft.points.length - 1] ?? start, point) < 1.5) {
        return draft;
      }

      return {
        ...draft,
        points: [...draft.points, point],
      };
    case "crop":
      return {
        ...draft,
        width: point.x - start.x,
        height: point.y - start.y,
      };
    case "text":
    case "step":
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

const downloadBaseName = (name: string) => {
  const withoutExtension = name.replace(/\.[^.]+$/, "");
  const normalized = withoutExtension
    .trim()
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return normalized || "image-annotation";
};
