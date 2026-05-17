import { Check, ImagePlus, X } from "lucide-solid";
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  Show,
  untrack,
} from "solid-js";
import type { JSX } from "solid-js";
import { Box, HStack, VStack } from "styled-system/jsx";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { ImageEditorContextBar } from "./ImageEditorContextBar";
import {
  type EditableAnnotation,
  InlineAnnotationEditor,
} from "./InlineAnnotationEditor";
import {
  getAnnotationBounds,
  getAnnotationTextBounds,
  getAnnotationUnionBounds,
  getBaseImageOffset,
  getBoundsResizeHandleAt,
  getResizeHandleAt,
  hitTestAnnotation,
  loadImageElement,
  renderImageEditorCanvas,
  type Bounds,
  type SnapGuide,
} from "./image-editor.render";
import { createMeasurePointerInfo } from "./image-editor.measure";
import {
  toolMatchesAnnotation,
  type AttachedText,
  type BrandPalette,
  type EditorSettings,
  type EditorDraft,
  type ImageAnnotation,
  type ImageEditorProject,
  type ImageEditorTool,
  type ImageEditorZoom,
  type MeasureAxis,
  type MeasureEndpointSnap,
  type MeasureMode,
  type MeasurePointerInfo,
  type Point,
  type ResizeHandle,
  type StylePresetId,
} from "./image-editor.types";

type CanvasCoordinateEvent = {
  currentTarget: HTMLCanvasElement;
  clientX: number;
  clientY: number;
};

export type ImageEditorCanvasProps = {
  project: ImageEditorProject | undefined;
  draft: EditorDraft | undefined;
  selectedIds: string[];
  selectedAnnotation: ImageAnnotation | undefined;
  selectionBounds: Bounds | undefined;
  snapGuides: SnapGuide[];
  selectionMarquee: Bounds | undefined;
  selectionViewAction: SelectionViewAction | undefined;
  inlineEditingAnnotation: EditableAnnotation | undefined;
  activeTool: ImageEditorTool;
  measureMode: MeasureMode;
  measureAnchor: Point | undefined;
  measureAxis: MeasureAxis | undefined;
  measureStartSnap: MeasureEndpointSnap | undefined;
  zoom: ImageEditorZoom;
  settings: EditorSettings;
  recentColors: string[];
  recentFillColors: string[];
  customColors: string[];
  brandPalettes: BrandPalette[];
  canPasteStyle: boolean;
  onChooseFile: () => void;
  onFiles: (files: File[]) => void;
  onZoomChange: (zoom: ImageEditorZoom) => void;
  onSettingsChange: (settings: Partial<EditorSettings>) => void;
  onAttachedTextChange: (settings: Partial<AttachedText>) => void;
  onStylePreset: (preset: StylePresetId) => void;
  onCustomColorChange: (color: string, target: "stroke" | "fill") => void;
  onMakeCurrentStyleDefault: () => void;
  onCopyStyle: () => void;
  onPasteStyle: () => void;
  onAlignSelection: (command: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  onDistributeSelection: (axis: "horizontal" | "vertical") => void;
  onStartInlineEdit: () => void;
  onInlineEditChange: (id: string, value: string) => void;
  onInlineEditCommit: () => void;
  onInlineEditCancel: () => void;
  onDuplicateSelected: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onDeleteSelected: () => void;
  onApplyCrop: () => void;
  onCancelCrop: () => void;
  onPointerDown: (
    point: Point,
    event: PointerEvent,
    measureInfo: MeasurePointerInfo | undefined,
  ) => void;
  onPointerMove: (
    point: Point,
    event: PointerEvent,
    measureInfo: MeasurePointerInfo | undefined,
  ) => void;
  onPointerUp: (
    point: Point,
    event: PointerEvent,
    measureInfo: MeasurePointerInfo | undefined,
  ) => void;
  onDoubleClick: (point: Point, event: MouseEvent & { currentTarget: HTMLCanvasElement }) => void;
};

type CanvasFrame = {
  left: number;
  top: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
};

type PanDrag = {
  clientX: number;
  clientY: number;
  scrollLeft: number;
  scrollTop: number;
};

type InlineEditAnchor = {
  id: string;
  type: EditableAnnotation["type"];
  bounds: Bounds;
};

type ProjectViewportState = {
  projectId: string;
  offsetX: number;
  offsetY: number;
};

type ViewportSize = {
  width: number;
  height: number;
};

export type SelectionViewAction = {
  id: string;
  kind: "zoom" | "fit-region" | "top-left" | "bottom-right";
};

export const ImageEditorCanvas = (props: ImageEditorCanvasProps) => {
  let hostRef: HTMLDivElement | undefined;
  let scrollRef: HTMLDivElement | undefined;
  let canvasRef: HTMLCanvasElement | undefined;
  let measureEdgeCanvas: HTMLCanvasElement | undefined;
  let measureEdgeContext: CanvasRenderingContext2D | undefined;
  let measureEdgeSourceKey: string | undefined;
  let lastSelectionScrollKey: string | undefined;
  let lastSelectionViewActionId: string | undefined;
  let lastCenteredViewportKey: string | undefined;
  let previousProjectViewportState: ProjectViewportState | undefined;
  const [baseImage, setBaseImage] = createSignal<HTMLImageElement>();
  const [canvasFrame, setCanvasFrame] = createSignal<CanvasFrame>();
  const [isDragActive, setIsDragActive] = createSignal(false);
  const [pointerPoint, setPointerPoint] = createSignal<Point>();
  const [isSpacePanning, setIsSpacePanning] = createSignal(false);
  const [panDrag, setPanDrag] = createSignal<PanDrag>();
  const [inlineEditAnchor, setInlineEditAnchor] = createSignal<InlineEditAnchor>();
  const [viewportSize, setViewportSize] = createSignal<ViewportSize>({
    width: 0,
    height: 0,
  });
  const [devicePixelRatio, setDevicePixelRatio] = createSignal(1);

  const hoverAnnotation = createMemo(() => {
    const project = props.project;
    const point = pointerPoint();
    const activeTool = props.activeTool;

    if (!project || !point || props.draft) {
      return undefined;
    }

    return findHitAnnotation(project.annotations, point, (annotation) =>
      activeTool === "select" ? true : toolMatchesAnnotation(activeTool, annotation),
    );
  });

  const visibleSelectedAnnotations = createMemo(() => {
    const currentProject = props.project;

    if (!currentProject) {
      return [];
    }

    return props.selectedIds
      .map((id) => currentProject.annotations.find((annotation) => annotation.id === id))
      .filter(
        (annotation): annotation is ImageAnnotation =>
          annotation !== undefined && !annotation.hidden,
      );
  });

  const visibleSelectionBounds = createMemo(
    () => props.selectionBounds ?? getAnnotationUnionBounds(visibleSelectedAnnotations()),
  );

  const canvasAnnotations = createMemo(() => {
    const project = props.project;
    const editingAnnotation = props.inlineEditingAnnotation;

    if (!project) {
      return [];
    }

    if (!editingAnnotation) {
      return project.annotations;
    }

    if (
      editingAnnotation.type === "arrow" ||
      editingAnnotation.type === "rectangle" ||
      editingAnnotation.type === "ellipse" ||
      editingAnnotation.type === "pixelate" ||
      editingAnnotation.type === "erase"
    ) {
      return project.annotations.map((annotation) =>
        annotation.id === editingAnnotation.id &&
        (annotation.type === "arrow" ||
          annotation.type === "rectangle" ||
          annotation.type === "ellipse" ||
          annotation.type === "pixelate" ||
          annotation.type === "erase")
          ? { ...annotation, text: undefined }
          : annotation,
      );
    }

    return project.annotations.filter((annotation) => annotation.id !== editingAnnotation.id);
  });

  const cropDraftBounds = createMemo(() => {
    const currentDraft = props.draft;

    if (currentDraft?.type !== "crop") {
      return undefined;
    }

    return normalizeDraftRect(
      currentDraft.x,
      currentDraft.y,
      currentDraft.width,
      currentDraft.height,
    );
  });

  const effectiveMeasureMode = () =>
    props.draft?.type === "measure"
      ? props.draft.mode ?? props.measureMode
      : props.selectedAnnotation?.type === "measure"
        ? props.selectedAnnotation.mode ?? props.measureMode
        : props.measureMode;

  const measurePointerInfoFor = (
    point: Point,
    event?: Pick<PointerEvent, "altKey">,
  ): MeasurePointerInfo | undefined => {
    const mode = effectiveMeasureMode();

    if (
      props.activeTool !== "measure" &&
      props.draft?.type !== "measure" &&
      props.selectedAnnotation?.type !== "measure"
    ) {
      return undefined;
    }

    return createMeasurePointerInfo(measureEdgeContext, point, {
      mode,
      start: props.measureAnchor,
      axis: props.measureAxis,
      startSnap: props.measureStartSnap,
      disableSnap: event?.altKey,
    });
  };

  const measureGuide = createMemo(() => {
    const point = pointerPoint();

    if (!point) {
      return undefined;
    }

    return measurePointerInfoFor(point);
  });

  const refreshMeasureEdgeSource = (
    currentProject: ImageEditorProject,
    image: HTMLImageElement,
  ) => {
    const edgeAnnotations = canvasAnnotations().filter(
      (annotation) => annotation.type !== "measure",
    );
    const nextKey = [
      currentProject.id,
      currentProject.updatedAt,
      currentProject.width,
      currentProject.height,
      currentProject.baseImage.dataUrl,
      image.currentSrc || image.src,
      image.naturalWidth,
      image.naturalHeight,
      currentProject.baseImage.offsetX ?? 0,
      currentProject.baseImage.offsetY ?? 0,
      props.inlineEditingAnnotation?.id ?? "",
      measureEdgeAnnotationKey(edgeAnnotations),
    ].join(":");

    if (measureEdgeSourceKey === nextKey && measureEdgeContext) {
      return;
    }

    if (!measureEdgeCanvas) {
      measureEdgeCanvas = document.createElement("canvas");
    }

    if (measureEdgeCanvas.width !== currentProject.width) {
      measureEdgeCanvas.width = currentProject.width;
    }

    if (measureEdgeCanvas.height !== currentProject.height) {
      measureEdgeCanvas.height = currentProject.height;
    }

    renderImageEditorCanvas(
      measureEdgeCanvas,
      image,
      edgeAnnotations,
      undefined,
      [],
      getBaseImageOffset(currentProject),
      undefined,
    );
    measureEdgeContext = measureEdgeCanvas.getContext("2d") ?? undefined;
    measureEdgeSourceKey = nextKey;
  };

  createEffect(() => {
    const dataUrl = props.project?.baseImage.dataUrl;

    if (!dataUrl) {
      setBaseImage(undefined);
      measureEdgeSourceKey = undefined;
      return;
    }

    let isDisposed = false;
    setBaseImage(undefined);
    measureEdgeSourceKey = undefined;

    loadImageElement(dataUrl)
      .then((image) => {
        if (!isDisposed) {
          setBaseImage(image);
          measureEdgeSourceKey = undefined;
        }
      })
      .catch(() => {
        if (!isDisposed) {
          setBaseImage(undefined);
          measureEdgeSourceKey = undefined;
        }
      });

    onCleanup(() => {
      isDisposed = true;
    });
  });

  createEffect(() => {
    const project = props.project;
    const image = baseImage();

    if (!project || !image || !canvasRef) {
      return;
    }

    if (canvasRef.width !== project.width) {
      canvasRef.width = project.width;
    }

    if (canvasRef.height !== project.height) {
      canvasRef.height = project.height;
    }

    const hoveredId = props.inlineEditingAnnotation
      ? undefined
      : hoverAnnotation()?.id;

    refreshMeasureEdgeSource(project, image);
    renderImageEditorCanvas(
      canvasRef,
      image,
      canvasAnnotations(),
      props.draft,
      props.inlineEditingAnnotation ? [] : props.selectedIds,
      getBaseImageOffset(project),
      hoveredId,
      {
        measureGuide: measureGuide(),
        snapGuides: props.snapGuides,
        selectionMarquee: props.selectionMarquee,
      },
    );
    window.requestAnimationFrame(() => {
      updateCanvasFrame();
      compensateCanvasOriginShift(project);
    });
  });

  createEffect(() => {
    const bounds = visibleSelectionBounds();
    const key = props.selectedIds.join(",");

    if (!bounds || key.length === 0) {
      return;
    }

    const scrollKey = `${key}:${props.zoom}`;

    if (scrollKey === lastSelectionScrollKey) {
      return;
    }

    lastSelectionScrollKey = scrollKey;
    window.requestAnimationFrame(() => ensureProjectBoundsVisible(bounds));
  });

  createEffect(() => {
    const action = props.selectionViewAction;

    if (!action || action.id === lastSelectionViewActionId) {
      return;
    }

    const bounds = untrack(visibleSelectionBounds);

    if (!bounds) {
      return;
    }

    lastSelectionViewActionId = action.id;
    window.requestAnimationFrame(() => focusSelectionBounds(bounds, action.kind));
  });

  createEffect(() => {
    if (props.zoom === "fit") {
      return;
    }

    const minimumZoom = manualMinZoom();

    if (props.zoom < minimumZoom) {
      props.onZoomChange(minimumZoom);
    }
  });

  createEffect(() => {
    const annotation = props.inlineEditingAnnotation;
    const currentAnchor = inlineEditAnchor();

    if (!annotation) {
      if (currentAnchor) {
        setInlineEditAnchor(undefined);
      }
      return;
    }

    if (currentAnchor?.id === annotation.id) {
      return;
    }

    setInlineEditAnchor({
      id: annotation.id,
      type: annotation.type,
      bounds: getAnnotationBounds(annotation),
    });
  });

  createEffect(() => {
    const projectId = props.project?.id;
    const viewport = viewportSize();
    const zoom = props.zoom;
    const centeredKey = zoom === "fit"
      ? `${projectId}:${viewport.width}:${viewport.height}:fit`
      : `${projectId}:manual`;

    if (
      !projectId ||
      centeredKey === lastCenteredViewportKey ||
      viewport.width === 0 ||
      viewport.height === 0
    ) {
      return;
    }

    lastCenteredViewportKey = centeredKey;
    window.requestAnimationFrame(centerCanvasInViewport);
  });

  onMount(() => {
    const resizeObserver = new ResizeObserver(() => updateCanvasFrame());

    if (hostRef) {
      resizeObserver.observe(hostRef);
    }

    if (canvasRef) {
      resizeObserver.observe(canvasRef);
    }

    const handleResize = () => {
      updateCanvasFrame();
      setDevicePixelRatio(window.devicePixelRatio || 1);
    };
    const handleImageLayerLoad = () => {
      const project = props.project;
      const image = baseImage();

      if (!project || !image || !canvasRef) {
        return;
      }

      measureEdgeSourceKey = undefined;
      refreshMeasureEdgeSource(project, image);
      renderImageEditorCanvas(
        canvasRef,
        image,
        canvasAnnotations(),
        props.draft,
        props.inlineEditingAnnotation ? [] : props.selectedIds,
        getBaseImageOffset(project),
        props.inlineEditingAnnotation ? undefined : hoverAnnotation()?.id,
        {
          measureGuide: measureGuide(),
          snapGuides: props.snapGuides,
          selectionMarquee: props.selectionMarquee,
        },
      );
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.code !== "Space" ||
        !props.project ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      event.preventDefault();
      setIsSpacePanning(true);
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        setIsSpacePanning(false);
        setPanDrag(undefined);
      }
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    scrollRef?.addEventListener("scroll", handleResize, { passive: true });
    canvasRef?.addEventListener("image-layer-load", handleImageLayerLoad);
    setDevicePixelRatio(window.devicePixelRatio || 1);
    updateCanvasFrame();

    onCleanup(() => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      scrollRef?.removeEventListener("scroll", handleResize);
      canvasRef?.removeEventListener("image-layer-load", handleImageLayerLoad);
    });
  });

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setIsDragActive(false);
    const files = Array.from(event.dataTransfer?.files ?? []);

    if (files.length > 0) {
      props.onFiles(files);
    }
  };

  const handleWheel = (event: WheelEvent) => {
    if (!props.project) {
      return;
    }

    event.preventDefault();
    if (shouldPanWithWheel(event)) {
      panWithWheel(event);
      return;
    }

    zoomWithWheel(event);
  };

  const panWithWheel = (event: WheelEvent) => {
    if (!scrollRef) {
      return;
    }

    scrollRef.scrollLeft += normalizeWheelDelta(event.deltaX, event.deltaMode, "x");
    scrollRef.scrollTop += normalizeWheelDelta(event.deltaY, event.deltaMode, "y");
    updateCanvasFrame();
  };

  const zoomWithWheel = (event: WheelEvent) => {
    const currentZoom =
      props.zoom === "fit" ? canvasFrame()?.scaleX ?? 1 : props.zoom;
    const multiplier = wheelZoomMultiplier(event);
    const nextZoom = clampZoom(currentZoom * multiplier, manualMinZoom());
    const canvasBounds = canvasRef?.getBoundingClientRect();
    const scrollBounds = scrollRef?.getBoundingClientRect();
    const anchor =
      canvasBounds && scrollBounds
        ? {
            x: (event.clientX - canvasBounds.left) / currentZoom,
            y: (event.clientY - canvasBounds.top) / currentZoom,
            viewportX: event.clientX - scrollBounds.left,
            viewportY: event.clientY - scrollBounds.top,
          }
        : undefined;

    props.onZoomChange(nextZoom);

    if (anchor && scrollRef && canvasRef) {
      window.requestAnimationFrame(() => {
        if (!scrollRef || !canvasRef) {
          return;
        }

        scrollRef.scrollLeft = canvasRef.offsetLeft + anchor.x * nextZoom - anchor.viewportX;
        scrollRef.scrollTop = canvasRef.offsetTop + anchor.y * nextZoom - anchor.viewportY;
        updateCanvasFrame();
      });
    }
  };

  const shouldStartPan = (event: PointerEvent) =>
    props.project !== undefined && (event.button === 1 || isSpacePanning());

  const startPanDrag = (event: PointerEvent & { currentTarget: HTMLElement }) => {
    if (!shouldStartPan(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setPanDrag({
      clientX: event.clientX,
      clientY: event.clientY,
      scrollLeft: scrollRef?.scrollLeft ?? 0,
      scrollTop: scrollRef?.scrollTop ?? 0,
    });
  };

  const updatePanDrag = (event: PointerEvent) => {
    const currentPanDrag = panDrag();

    if (!currentPanDrag || !scrollRef) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    scrollRef.scrollLeft =
      currentPanDrag.scrollLeft - (event.clientX - currentPanDrag.clientX);
    scrollRef.scrollTop =
      currentPanDrag.scrollTop - (event.clientY - currentPanDrag.clientY);
    updateCanvasFrame();
  };

  const stopPanDrag = (event: PointerEvent & { currentTarget: HTMLElement }) => {
    if (!panDrag()) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setPanDrag(undefined);
  };

  const handleHostPointerDown = (
    event: PointerEvent & { currentTarget: HTMLElement },
  ) => {
    startPanDrag(event);

    if (!event.defaultPrevented) {
      handleOutOfBoundsTextPointerDown(event);
    }
  };

  const pointFromEvent = (event: CanvasCoordinateEvent): Point => {
    return pointFromCanvasBounds(event, event.currentTarget.getBoundingClientRect());
  };

  const pointFromCanvasBounds = (
    event: Pick<CanvasCoordinateEvent, "clientX" | "clientY">,
    bounds: DOMRect,
  ): Point => {
    const project = props.project;

    if (!project || bounds.width === 0 || bounds.height === 0) {
      return { x: 0, y: 0 };
    }

    return {
      x: ((event.clientX - bounds.left) / bounds.width) * project.width,
      y: ((event.clientY - bounds.top) / bounds.height) * project.height,
    };
  };

  const handleOutOfBoundsTextPointerDown = (event: PointerEvent) => {
    if (
      !props.project ||
      !canvasRef ||
      event.button !== 0 ||
      (props.activeTool !== "text" && props.activeTool !== "step") ||
      event.target === canvasRef ||
      isInteractiveTarget(event.target)
    ) {
      return;
    }

    const point = pointFromCanvasBounds(event, canvasRef.getBoundingClientRect());

    if (
      point.x >= 0 &&
      point.x <= props.project.width &&
      point.y >= 0 &&
      point.y <= props.project.height
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setPointerPoint(point);
    props.onPointerDown(point, event, undefined);
  };

  const updateCanvasFrame = () => {
    const project = props.project;

    if (!hostRef || !canvasRef || !project) {
      setCanvasFrame(undefined);
      return;
    }

    const hostBounds = hostRef.getBoundingClientRect();
    const canvasBounds = canvasRef.getBoundingClientRect();

    if (scrollRef) {
      setViewportSize({
        width: scrollRef.clientWidth,
        height: scrollRef.clientHeight,
      });
    }

    setCanvasFrame({
      left: canvasBounds.left - hostBounds.left,
      top: canvasBounds.top - hostBounds.top,
      width: canvasBounds.width,
      height: canvasBounds.height,
      scaleX: canvasBounds.width / project.width,
      scaleY: canvasBounds.height / project.height,
    });
  };

  const centerCanvasInViewport = () => {
    if (!scrollRef || !canvasRef) {
      return;
    }

    scrollRef.scrollLeft =
      canvasRef.offsetLeft + canvasRef.offsetWidth / 2 - scrollRef.clientWidth / 2;
    scrollRef.scrollTop =
      canvasRef.offsetTop + canvasRef.offsetHeight / 2 - scrollRef.clientHeight / 2;
    updateCanvasFrame();
  };

  const compensateCanvasOriginShift = (currentProject: ImageEditorProject) => {
    if (!scrollRef || !canvasRef) {
      return;
    }

    const baseOffset = getBaseImageOffset(currentProject);
    const currentState: ProjectViewportState = {
      projectId: currentProject.id,
      offsetX: baseOffset.x,
      offsetY: baseOffset.y,
    };
    const previousState = previousProjectViewportState;
    previousProjectViewportState = currentState;

    if (!previousState || previousState.projectId !== currentProject.id) {
      return;
    }

    const deltaX = currentState.offsetX - previousState.offsetX;
    const deltaY = currentState.offsetY - previousState.offsetY;

    if (deltaX === 0 && deltaY === 0) {
      return;
    }

    const canvasBounds = canvasRef.getBoundingClientRect();
    const scaleX = canvasBounds.width / Math.max(1, currentProject.width);
    const scaleY = canvasBounds.height / Math.max(1, currentProject.height);

    scrollRef.scrollLeft += deltaX * scaleX;
    scrollRef.scrollTop += deltaY * scaleY;
  };

  const lockFitZoomForCanvasInteraction = (point: Point) => {
    if (props.zoom !== "fit" || !props.project) {
      return;
    }

    const frame = canvasFrame();

    if (!frame) {
      return;
    }

    const shouldLockZoom =
      (props.activeTool !== "select" && props.activeTool !== "crop") ||
      hasDirectManipulationTarget(point);

    if (!shouldLockZoom) {
      return;
    }

    props.onZoomChange(clampZoom(Math.min(frame.scaleX, frame.scaleY), manualMinZoom()));
  };

  const hasDirectManipulationTarget = (point: Point) => {
    const currentProject = props.project;

    if (!currentProject || props.activeTool !== "select") {
      return false;
    }

    const groupBounds = visibleSelectionBounds();

    if (
      props.selectedIds.length > 1 &&
      groupBounds &&
      getBoundsResizeHandleAt(groupBounds, point)
    ) {
      return true;
    }

    if (
      props.selectedAnnotation &&
      !props.selectedAnnotation.hidden &&
      getResizeHandleAt(props.selectedAnnotation, point)
    ) {
      return true;
    }

    return findHitAnnotation(currentProject.annotations, point, () => true) !== undefined;
  };

  const ensureProjectBoundsVisible = (bounds: Bounds) => {
    const project = props.project;

    if (!project || !scrollRef || !canvasRef || props.zoom === "fit") {
      return;
    }

    const margin = 56;
    const scale = props.zoom;
    const left = canvasRef.offsetLeft + bounds.x * scale;
    const top = canvasRef.offsetTop + bounds.y * scale;
    const right = left + bounds.width * scale;
    const bottom = top + bounds.height * scale;
    const visibleLeft = scrollRef.scrollLeft;
    const visibleTop = scrollRef.scrollTop;
    const visibleRight = visibleLeft + scrollRef.clientWidth;
    const visibleBottom = visibleTop + scrollRef.clientHeight;
    let nextLeft = visibleLeft;
    let nextTop = visibleTop;

    if (left < visibleLeft + margin) {
      nextLeft = Math.max(0, left - margin);
    } else if (right > visibleRight - margin) {
      nextLeft = right - scrollRef.clientWidth + margin;
    }

    if (top < visibleTop + margin) {
      nextTop = Math.max(0, top - margin);
    } else if (bottom > visibleBottom - margin) {
      nextTop = bottom - scrollRef.clientHeight + margin;
    }

    if (nextLeft !== visibleLeft || nextTop !== visibleTop) {
      scrollRef.scrollTo({ left: nextLeft, top: nextTop, behavior: "auto" });
    }
  };

  const focusSelectionBounds = (
    bounds: Bounds,
    kind: SelectionViewAction["kind"],
  ) => {
    const project = props.project;

    if (!project || !scrollRef || !canvasRef) {
      return;
    }

    const viewportWidth = Math.max(1, scrollRef.clientWidth - 112);
    const viewportHeight = Math.max(1, scrollRef.clientHeight - 112);
    const fitScale = clampZoom(
      Math.min(
        viewportWidth / Math.max(1, bounds.width),
        viewportHeight / Math.max(1, bounds.height),
      ),
      manualMinZoom(),
    );
    const currentScale = props.zoom === "fit" ? canvasFrame()?.scaleX ?? 1 : props.zoom;
    const nextZoom =
      kind === "fit-region"
        ? fitScale
        : clampZoom(Math.max(currentScale, Math.min(4, fitScale * 1.4)), manualMinZoom());

    props.onZoomChange(nextZoom);

    window.requestAnimationFrame(() => {
      if (!scrollRef || !canvasRef) {
        return;
      }

      const left = canvasRef.offsetLeft + bounds.x * nextZoom;
      const top = canvasRef.offsetTop + bounds.y * nextZoom;
      const width = bounds.width * nextZoom;
      const height = bounds.height * nextZoom;

      if (kind === "top-left") {
        scrollRef.scrollTo({
          left: Math.max(0, left - 56),
          top: Math.max(0, top - 56),
          behavior: "auto",
        });
      } else if (kind === "bottom-right") {
        scrollRef.scrollTo({
          left: Math.max(0, left + width - scrollRef.clientWidth + 56),
          top: Math.max(0, top + height - scrollRef.clientHeight + 56),
          behavior: "auto",
        });
      } else {
        scrollRef.scrollTo({
          left: Math.max(0, left + width / 2 - scrollRef.clientWidth / 2),
          top: Math.max(0, top + height / 2 - scrollRef.clientHeight / 2),
          behavior: "auto",
        });
      }

      updateCanvasFrame();
    });
  };

  const shouldShowContextBar = createMemo(
    () =>
      props.project !== undefined &&
      props.inlineEditingAnnotation === undefined &&
      ((props.selectedIds.length > 0 && visibleSelectionBounds() !== undefined) ||
        (props.activeTool !== "select" && props.activeTool !== "crop")),
  );

  const contextBarStyle = createMemo<JSX.CSSProperties>(() => {
    return {
      left: "50%",
      top: "12px",
      transform: "translateX(-50%)",
    };
  });

  const inlineEditorStyle = createMemo<JSX.CSSProperties>(() => {
    const frame = canvasFrame();
    const annotation = props.inlineEditingAnnotation;
    const anchor = inlineEditAnchor();

    if (!frame || !annotation || !anchor) {
      return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
    }

    const boundsSource =
      annotation.type === "text"
        ? getAnnotationBounds(annotation)
        : getAnnotationTextBounds(annotation) ?? anchor.bounds;
    const bounds = projectBoundsToFrame(boundsSource, frame);

    if (anchor.type === "step") {
      return {
        left: `${bounds.x + bounds.width / 2}px`,
        top: `${bounds.y + bounds.height / 2}px`,
        transform: "translate(-50%, -50%)",
      };
    }

    return {
      left: `${bounds.x}px`,
      top: `${bounds.y}px`,
      width: `${Math.max(1, bounds.width)}px`,
      height: `${Math.max(1, bounds.height)}px`,
    };
  });

  const inlineEditorScale = createMemo(() => {
    const frame = canvasFrame();

    return frame ? Math.min(frame.scaleX, frame.scaleY) : 1;
  });

  const fitCanvasScale = createMemo(() => {
    const project = props.project;
    const viewport = viewportSize();

    if (!project || viewport.width === 0 || viewport.height === 0) {
      return 1;
    }

    const contentSize = getScrollContentSize(scrollRef, viewport);

    return Math.max(
      0.01,
      Math.min(
        1,
        contentSize.width / Math.max(1, project.width),
        contentSize.height / Math.max(1, project.height),
      ),
    );
  });

  const manualMinZoom = createMemo(() => {
    const project = props.project;
    const viewport = viewportSize();

    if (!project || viewport.width === 0 || viewport.height === 0) {
      return MIN_MANUAL_ZOOM;
    }

    const contentSize = getScrollContentSize(scrollRef, viewport);
    const minimumWidth = Math.min(MIN_MANUAL_CANVAS_SIDE, contentSize.width);
    const minimumHeight = Math.min(MIN_MANUAL_CANVAS_SIDE, contentSize.height);

    return Math.max(
      MIN_MANUAL_ZOOM,
      Math.min(
        MAX_ZOOM,
        Math.max(
          minimumWidth / Math.max(1, project.width),
          minimumHeight / Math.max(1, project.height),
        ),
      ),
    );
  });

  const hoverResizeHandle = createMemo((): ResizeHandle | undefined => {
    const selectedAnnotation = props.selectedAnnotation;
    const point = pointerPoint();

    if (!point) {
      return undefined;
    }

    const cropBounds = cropDraftBounds();

    if (props.activeTool === "crop" && cropBounds) {
      return getBoundsResizeHandleAt(cropBounds, point);
    }

    const groupBounds = visibleSelectionBounds();

    if (props.selectedIds.length > 1 && groupBounds) {
      return getBoundsResizeHandleAt(groupBounds, point);
    }

    if (!selectedAnnotation || selectedAnnotation.hidden) {
      return undefined;
    }

    return getResizeHandleAt(selectedAnnotation, point);
  });

  const hasCropDraftHover = createMemo(() => {
    const point = pointerPoint();
    const cropBounds = cropDraftBounds();

    return point && cropBounds ? isPointInBounds(point, cropBounds) : false;
  });

  const canvasStyle = createMemo<JSX.CSSProperties>(() => {
    const project = props.project;
    const width = project ? `${project.width * numericZoom(props.zoom)}px` : undefined;
    const height = project ? `${project.height * numericZoom(props.zoom)}px` : undefined;

    if (props.zoom === "fit") {
      const scale = fitCanvasScale();

      return {
        display: "block",
        width: project ? `${project.width * scale}px` : undefined,
        height: project ? `${project.height * scale}px` : undefined,
        "max-width": "none",
        "max-height": "none",
        "box-shadow": "0 20px 80px rgba(15, 23, 42, 0.22)",
        cursor: canvasCursor(
          props.activeTool,
          props.selectedIds.length > 0 && visibleSelectionBounds() !== undefined,
          isSpacePanning(),
          panDrag() !== undefined,
          hoverResizeHandle(),
          hoverAnnotation() !== undefined || hasCropDraftHover(),
        ),
        "touch-action": "none",
      };
    }

    return {
      display: "block",
      width,
      height,
      "max-width": "none",
      "max-height": "none",
      "box-shadow": "0 20px 80px rgba(15, 23, 42, 0.22)",
      cursor: canvasCursor(
        props.activeTool,
        props.selectedIds.length > 0 && visibleSelectionBounds() !== undefined,
        isSpacePanning(),
        panDrag() !== undefined,
        hoverResizeHandle(),
        hoverAnnotation() !== undefined || hasCropDraftHover(),
      ),
      "touch-action": "none",
    };
  });

  const overpanFrameStyle = createMemo<JSX.CSSProperties>(() => {
    const viewport = viewportSize();
    const project = props.project;
    const scale = props.zoom === "fit" ? fitCanvasScale() : props.zoom;
    const canvasWidth = project ? project.width * scale : 0;
    const canvasHeight = project ? project.height * scale : 0;

    return {
      display: "grid",
      "place-items": "center",
      width: `${canvasWidth + Math.max(0, viewport.width - OVERPAN_VISIBLE_EDGE) * 2}px`,
      height: `${canvasHeight + Math.max(0, viewport.height - OVERPAN_VISIBLE_EDGE) * 2}px`,
      "min-width": "100%",
      "min-height": "100%",
    };
  });

  const draftReadout = createMemo(() => {
    const currentDraft = props.draft;

    if (!currentDraft) {
      return undefined;
    }

    if (currentDraft.type === "crop" || currentDraft.type === "rectangle" || currentDraft.type === "ellipse" || currentDraft.type === "pixelate") {
      const bounds = normalizeDraftRect(currentDraft.x, currentDraft.y, currentDraft.width, currentDraft.height);
      return `${Math.round(bounds.width)} x ${Math.round(bounds.height)}`;
    }

    if (currentDraft.type === "arrow" || currentDraft.type === "measure") {
      const length =
        currentDraft.type === "measure" && currentDraft.axis === "horizontal"
          ? Math.abs(currentDraft.end.x - currentDraft.start.x)
          : currentDraft.type === "measure" && currentDraft.axis === "vertical"
            ? Math.abs(currentDraft.end.y - currentDraft.start.y)
            : Math.hypot(
                currentDraft.end.x - currentDraft.start.x,
                currentDraft.end.y - currentDraft.start.y,
              );
      return `${Math.round(length)} px`;
    }

    if (currentDraft.type === "pen" || currentDraft.type === "highlighter") {
      return `${currentDraft.points.length} pts`;
    }

    return undefined;
  });

  const layerReadout = createMemo(() => {
    const project = props.project;

    if (!project) {
      return "0 layers";
    }

    const visible = project.annotations.filter((annotation) => !annotation.hidden).length;

    return visible === project.annotations.length
      ? `${project.annotations.length} layers`
      : `${visible}/${project.annotations.length} visible`;
  });

  return (
    <Box
      ref={hostRef}
      position="relative"
      minH="0"
      flex="1"
      display="flex"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      bg="bg.subtle"
      borderWidth="1px"
      borderColor={isDragActive() ? "blue.8" : "border"}
      onPointerDown={handleHostPointerDown}
      onPointerMove={updatePanDrag}
      onPointerUp={stopPanDrag}
      onPointerCancel={stopPanDrag}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragActive(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={handleDrop}
      style={{
        cursor: panDrag() ? "grabbing" : isSpacePanning() ? "grab" : undefined,
      }}
    >
      <Show
        when={props.project}
        fallback={
          <VStack
            gap="5"
            alignItems="center"
            justifyContent="center"
            minH={{ base: "96", md: "calc(100dvh - 132px)" }}
            px="6"
            textAlign="center"
          >
            <Box
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              boxSize="14"
              borderRadius="l2"
              bg="bg.default"
              color="fg.muted"
              borderWidth="1px"
              borderColor="border"
            >
              <ImagePlus size={26} />
            </Box>
            <VStack gap="1" alignItems="center">
              <Box fontWeight="semibold">Paste, drop, or choose an image</Box>
              <Text color="fg.muted" textStyle="sm" maxW="sm">
                PNG exports from this editor restore their editable layers.
              </Text>
            </VStack>
            <Button variant="surface" colorPalette="blue" onClick={props.onChooseFile}>
              Choose Image
            </Button>
          </VStack>
        }
      >
        {(project) => (
          <>
            <Box
              ref={scrollRef}
              p={{ base: "3", md: "6" }}
              maxW="full"
              maxH="full"
              overflow="hidden"
              onWheel={handleWheel}
              style={{
                "background-image":
                  "linear-gradient(45deg, rgba(148, 163, 184, 0.16) 25%, transparent 25%), linear-gradient(-45deg, rgba(148, 163, 184, 0.16) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(148, 163, 184, 0.16) 75%), linear-gradient(-45deg, transparent 75%, rgba(148, 163, 184, 0.16) 75%)",
                "background-size": "24px 24px",
                "background-position": "0 0, 0 12px, 12px -12px, -12px 0px",
              }}
            >
              <Box style={overpanFrameStyle()}>
                <canvas
                  ref={canvasRef}
                  aria-label="Editable image canvas"
                  data-active-tool={props.activeTool}
                  onPointerDown={(event) => {
                    if (event.button === 1 || isSpacePanning()) {
                      return;
                    }

                    event.currentTarget.setPointerCapture(event.pointerId);
                    const point = pointFromEvent(event);
                    setPointerPoint(point);
                    lockFitZoomForCanvasInteraction(point);
                    props.onPointerDown(point, event, measurePointerInfoFor(point, event));
                  }}
                  onPointerMove={(event) => {
                    const point = pointFromEvent(event);
                    setPointerPoint(point);
                    props.onPointerMove(point, event, measurePointerInfoFor(point, event));
                  }}
                  onPointerUp={(event) => {
                    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                      event.currentTarget.releasePointerCapture(event.pointerId);
                    }

                    const point = pointFromEvent(event);
                    setPointerPoint(point);
                    props.onPointerUp(point, event, measurePointerInfoFor(point, event));
                  }}
                  onPointerLeave={() => setPointerPoint(undefined)}
                  onDblClick={(event) => props.onDoubleClick(pointFromEvent(event), event)}
                  style={canvasStyle()}
                  width={project().width}
                  height={project().height}
                />
              </Box>
            </Box>

            <Show when={isDragActive()}>
              <VStack
                position="absolute"
                inset="4"
                zIndex="8"
                pointerEvents="none"
                alignItems="center"
                justifyContent="center"
                borderWidth="2px"
                borderStyle="dashed"
                borderColor="blue.8"
                borderRadius="l3"
                bg="rgba(255, 255, 255, 0.72)"
                color="fg.default"
                gap="1"
              >
                <Box fontWeight="semibold">Drop to replace the working image</Box>
                <Text color="fg.muted" textStyle="sm">
                  Editable PNGDATA projects reopen with their layers.
                </Text>
              </VStack>
            </Show>

            <Show when={shouldShowContextBar()}>
              <ImageEditorContextBar
                style={contextBarStyle()}
                activeTool={props.activeTool}
                selectedAnnotation={props.selectedAnnotation}
                selectedCount={props.selectedIds.length}
                settings={props.settings}
                recentColors={props.recentColors}
                recentFillColors={props.recentFillColors}
                customColors={props.customColors}
                brandPalettes={props.brandPalettes}
                canPasteStyle={props.canPasteStyle}
                onSettingsChange={props.onSettingsChange}
                onAttachedTextChange={props.onAttachedTextChange}
                onStylePreset={props.onStylePreset}
                onCustomColorChange={props.onCustomColorChange}
                onMakeCurrentStyleDefault={props.onMakeCurrentStyleDefault}
                onCopyStyle={props.onCopyStyle}
                onPasteStyle={props.onPasteStyle}
                onAlignSelection={props.onAlignSelection}
                onDistributeSelection={props.onDistributeSelection}
                onStartInlineEdit={props.onStartInlineEdit}
                onDuplicateSelected={props.onDuplicateSelected}
                onBringForward={props.onBringForward}
                onSendBackward={props.onSendBackward}
                onDeleteSelected={props.onDeleteSelected}
              />
            </Show>

            <Show when={cropDraftBounds()}>
              {(bounds) => (
                <HStack
                  position="absolute"
                  left="50%"
                  top="12"
                  transform="translateX(-50%)"
                  zIndex="10"
                  gap="2"
                  px="2"
                  py="2"
                  borderRadius="l2"
                  bg="bg.default"
                  borderWidth="1px"
                  borderColor="border"
                  boxShadow="md"
                >
                  <Text color="fg.muted" textStyle="xs" px="1">
                    {Math.round(bounds().width)} x {Math.round(bounds().height)}
                  </Text>
                  <Button
                    size="xs"
                    colorPalette="blue"
                    onClick={props.onApplyCrop}
                  >
                    <Check size={16} />
                    Apply crop
                  </Button>
                  <Button
                    size="xs"
                    variant="plain"
                    colorPalette="gray"
                    onClick={props.onCancelCrop}
                  >
                    <X size={16} />
                    Cancel
                  </Button>
                </HStack>
              )}
            </Show>

            <InlineAnnotationEditor
              annotation={props.inlineEditingAnnotation}
              style={inlineEditorStyle()}
              scale={inlineEditorScale()}
              onChange={props.onInlineEditChange}
              onCommit={props.onInlineEditCommit}
              onCancel={props.onInlineEditCancel}
            />

            <HStack
              position="absolute"
              left="4"
              bottom="4"
              gap="2"
              px="2.5"
              py="1.5"
              borderRadius="l2"
              bg="bg.default"
              borderWidth="1px"
              borderColor="border"
              boxShadow="sm"
              textStyle="xs"
              color="fg.muted"
            >
              <Box>{project().width} x {project().height}</Box>
              <Box color="fg.subtle">/</Box>
              <Box>{layerReadout()}</Box>
              <Show when={pointerPoint()}>
                {(point) => (
                  <>
                    <Box color="fg.subtle">/</Box>
                    <Box>
                      {Math.round(point().x)}, {Math.round(point().y)}
                    </Box>
                  </>
                )}
              </Show>
              <Show when={draftReadout()}>
                {(readout) => (
                  <>
                    <Box color="fg.subtle">/</Box>
                    <Box>{readout()}</Box>
                  </>
                )}
              </Show>
            </HStack>
          </>
        )}
      </Show>
    </Box>
  );
};

const findHitAnnotation = (
  annotations: ImageAnnotation[],
  point: Point,
  matches: (annotation: ImageAnnotation) => boolean,
): ImageAnnotation | undefined => {
  for (let index = annotations.length - 1; index >= 0; index -= 1) {
    const annotation = annotations[index];

    if (annotation && matches(annotation) && hitTestAnnotation(annotation, point)) {
      return annotation;
    }
  }

  return undefined;
};

const projectBoundsToFrame = (bounds: Bounds, frame: CanvasFrame): Bounds => ({
  x: frame.left + bounds.x * frame.scaleX,
  y: frame.top + bounds.y * frame.scaleY,
  width: bounds.width * frame.scaleX,
  height: bounds.height * frame.scaleY,
});

const MIN_MANUAL_CANVAS_SIDE = 40;
const MIN_MANUAL_ZOOM = 0.001;
const MAX_ZOOM = 5;

const clampZoom = (zoom: number, minimumZoom = 0.1) =>
  Math.max(minimumZoom, Math.min(MAX_ZOOM, zoom));

const numericZoom = (zoom: ImageEditorZoom) => (zoom === "fit" ? 1 : zoom);

function getScrollContentSize(
  element: HTMLElement | undefined,
  fallback: ViewportSize,
): ViewportSize {
  if (!element) {
    return fallback;
  }

  const styles = window.getComputedStyle(element);
  const horizontalPadding =
    parseCssPixels(styles.paddingLeft) + parseCssPixels(styles.paddingRight);
  const verticalPadding =
    parseCssPixels(styles.paddingTop) + parseCssPixels(styles.paddingBottom);

  return {
    width: Math.max(1, element.clientWidth - horizontalPadding),
    height: Math.max(1, element.clientHeight - verticalPadding),
  };
}

function parseCssPixels(value: string) {
  const parsed = Number.parseFloat(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function measureEdgeAnnotationKey(annotations: ImageAnnotation[]) {
  return stableHash(
    JSON.stringify(
      annotations.map((annotation) => ({
        ...annotation,
        selected: undefined,
      })),
    ),
  );
}

function stableHash(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index);
    hash |= 0;
  }

  return hash.toString(36);
}

const WHEEL_ZOOM_SENSITIVITY = 0.0011;
const MAX_WHEEL_ZOOM_DELTA = 240;
const MOUSE_WHEEL_STEP_DELTA = 90;
const OVERPAN_VISIBLE_EDGE = 48;

const shouldPanWithWheel = (event: WheelEvent) => {
  if (event.metaKey || event.ctrlKey) {
    return false;
  }

  return event.deltaMode === WheelEvent.DOM_DELTA_PIXEL
    && (event.deltaX !== 0 || Math.abs(event.deltaY) < MOUSE_WHEEL_STEP_DELTA);
};

const wheelZoomMultiplier = (event: WheelEvent) => {
  const normalizedDeltaY = normalizeWheelDelta(event.deltaY, event.deltaMode, "y");
  const clampedDeltaY = Math.max(
    -MAX_WHEEL_ZOOM_DELTA,
    Math.min(MAX_WHEEL_ZOOM_DELTA, normalizedDeltaY),
  );

  return Math.exp(-clampedDeltaY * WHEEL_ZOOM_SENSITIVITY);
};

const normalizeWheelDelta = (
  delta: number,
  deltaMode: number,
  axis: "x" | "y",
) =>
  deltaMode === WheelEvent.DOM_DELTA_LINE
    ? delta * 16
    : deltaMode === WheelEvent.DOM_DELTA_PAGE
      ? delta * (axis === "x" ? window.innerWidth : window.innerHeight)
      : delta;

const canvasCursor = (
  tool: ImageEditorTool,
  hasSelection: boolean,
  isPanning: boolean,
  isPanDragging: boolean,
  resizeHandle: ResizeHandle | undefined,
  hasSameToolHover: boolean,
) => {
  if (isPanDragging) {
    return "grabbing";
  }

  if (isPanning) {
    return "grab";
  }

  if (resizeHandle) {
    return resizeCursor(resizeHandle);
  }

  if (hasSameToolHover) {
    return "move";
  }

  if (tool !== "select") {
    return "crosshair";
  }

  return hasSelection ? "move" : "default";
};

const resizeCursor = (handle: ResizeHandle) => {
  switch (handle) {
    case "n":
    case "s":
      return "ns-resize";
    case "e":
    case "w":
      return "ew-resize";
    case "ne":
    case "sw":
      return "nesw-resize";
    case "nw":
    case "se":
      return "nwse-resize";
  }
};

const normalizeDraftRect = (
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

const isPointInBounds = (point: Point, bounds: Bounds) =>
  point.x >= bounds.x &&
  point.x <= bounds.x + bounds.width &&
  point.y >= bounds.y &&
  point.y <= bounds.y + bounds.height;

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

const isInteractiveTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return isEditableTarget(target) || target.closest("button,a") !== null;
};
