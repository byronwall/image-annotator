import { ImagePlus } from "lucide-solid";
import { createEffect, createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";
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
  loadImageElement,
  renderImageEditorCanvas,
  type Bounds,
} from "./image-editor.render";
import {
  type EditorSettings,
  type EditorDraft,
  type ImageAnnotation,
  type ImageEditorProject,
  type ImageEditorTool,
  type ImageEditorZoom,
  type Point,
} from "./image-editor.types";

type CanvasPointerEvent = PointerEvent & {
  currentTarget: HTMLCanvasElement;
};

type CanvasCoordinateEvent = {
  currentTarget: HTMLCanvasElement;
  clientX: number;
  clientY: number;
};

export type ImageEditorCanvasProps = {
  project: ImageEditorProject | undefined;
  draft: EditorDraft | undefined;
  selectedId: string | undefined;
  selectedAnnotation: ImageAnnotation | undefined;
  inlineEditingAnnotation: EditableAnnotation | undefined;
  activeTool: ImageEditorTool;
  zoom: ImageEditorZoom;
  settings: EditorSettings;
  onChooseFile: () => void;
  onFiles: (files: File[]) => void;
  onZoomChange: (zoom: ImageEditorZoom) => void;
  onSettingsChange: (settings: Partial<EditorSettings>) => void;
  onStartInlineEdit: () => void;
  onInlineEditChange: (id: string, value: string) => void;
  onInlineEditCommit: () => void;
  onInlineEditCancel: () => void;
  onDuplicateSelected: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onDeleteSelected: () => void;
  onPointerDown: (point: Point, event: CanvasPointerEvent) => void;
  onPointerMove: (point: Point, event: CanvasPointerEvent) => void;
  onPointerUp: (point: Point, event: CanvasPointerEvent) => void;
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

export const ImageEditorCanvas = (props: ImageEditorCanvasProps) => {
  let hostRef: HTMLDivElement | undefined;
  let scrollRef: HTMLDivElement | undefined;
  let canvasRef: HTMLCanvasElement | undefined;
  const [baseImage, setBaseImage] = createSignal<HTMLImageElement>();
  const [canvasFrame, setCanvasFrame] = createSignal<CanvasFrame>();
  const [isDragActive, setIsDragActive] = createSignal(false);
  const [pointerPoint, setPointerPoint] = createSignal<Point>();

  createEffect(() => {
    const dataUrl = props.project?.baseImage.dataUrl;

    if (!dataUrl) {
      setBaseImage(undefined);
      return;
    }

    let isDisposed = false;
    loadImageElement(dataUrl)
      .then((image) => {
        if (!isDisposed) {
          setBaseImage(image);
        }
      })
      .catch(() => {
        if (!isDisposed) {
          setBaseImage(undefined);
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

    renderImageEditorCanvas(
      canvasRef,
      image,
      project.annotations,
      props.draft,
      props.selectedId,
    );
    window.requestAnimationFrame(updateCanvasFrame);
  });

  onMount(() => {
    const resizeObserver = new ResizeObserver(() => updateCanvasFrame());

    if (hostRef) {
      resizeObserver.observe(hostRef);
    }

    if (canvasRef) {
      resizeObserver.observe(canvasRef);
    }

    const handleResize = () => updateCanvasFrame();
    window.addEventListener("resize", handleResize);
    scrollRef?.addEventListener("scroll", handleResize, { passive: true });
    updateCanvasFrame();

    onCleanup(() => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      scrollRef?.removeEventListener("scroll", handleResize);
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
    if (!props.project || (!event.metaKey && !event.ctrlKey)) {
      return;
    }

    event.preventDefault();
    const currentZoom =
      props.zoom === "fit" ? canvasFrame()?.scaleX ?? 1 : props.zoom;
    const multiplier = event.deltaY < 0 ? 1.12 : 0.88;
    props.onZoomChange(clampZoom(currentZoom * multiplier));
  };

  const pointFromEvent = (event: CanvasCoordinateEvent): Point => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const project = props.project;

    if (!project || bounds.width === 0 || bounds.height === 0) {
      return { x: 0, y: 0 };
    }

    return {
      x: ((event.clientX - bounds.left) / bounds.width) * project.width,
      y: ((event.clientY - bounds.top) / bounds.height) * project.height,
    };
  };

  const updateCanvasFrame = () => {
    const project = props.project;

    if (!hostRef || !canvasRef || !project) {
      setCanvasFrame(undefined);
      return;
    }

    const hostBounds = hostRef.getBoundingClientRect();
    const canvasBounds = canvasRef.getBoundingClientRect();

    setCanvasFrame({
      left: canvasBounds.left - hostBounds.left,
      top: canvasBounds.top - hostBounds.top,
      width: canvasBounds.width,
      height: canvasBounds.height,
      scaleX: canvasBounds.width / project.width,
      scaleY: canvasBounds.height / project.height,
    });
  };

  const shouldShowContextBar = createMemo(
    () =>
      props.project !== undefined &&
      props.inlineEditingAnnotation === undefined &&
      (props.selectedAnnotation !== undefined ||
        (props.activeTool !== "select" && props.activeTool !== "crop")),
  );

  const contextBarStyle = createMemo<JSX.CSSProperties>(() => {
    const frame = canvasFrame();
    const selectedAnnotation = props.selectedAnnotation;

    if (!frame) {
      return { left: "50%", top: "12px", transform: "translateX(-50%)" };
    }

    if (!selectedAnnotation) {
      const top = Math.max(12, frame.top - 10);

      return {
        left: `${frame.left + frame.width / 2}px`,
        top: `${top}px`,
        transform: top <= 14 ? "translateX(-50%)" : "translate(-50%, -100%)",
      };
    }

    const bounds = projectBoundsToFrame(getAnnotationBounds(selectedAnnotation), frame);
    const left = Math.max(12, Math.min(frame.left + frame.width - 12, bounds.x + bounds.width / 2));
    const top = Math.max(12, bounds.y - 10);

    return {
      left: `${left}px`,
      top: `${top}px`,
      transform: top <= 14 ? "translateX(-50%)" : "translate(-50%, -100%)",
    };
  });

  const inlineEditorStyle = createMemo<JSX.CSSProperties>(() => {
    const frame = canvasFrame();
    const annotation = props.inlineEditingAnnotation;

    if (!frame || !annotation) {
      return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
    }

    const bounds = projectBoundsToFrame(getAnnotationBounds(annotation), frame);

    if (annotation.type === "step") {
      return {
        left: `${bounds.x + bounds.width / 2}px`,
        top: `${bounds.y + bounds.height / 2}px`,
        transform: "translate(-50%, -50%)",
      };
    }

    return {
      left: `${bounds.x}px`,
      top: `${bounds.y}px`,
      width: `${Math.max(180, bounds.width + 32)}px`,
      transform: "translateY(-2px)",
    };
  });

  const canvasStyle = createMemo<JSX.CSSProperties>(() => {
    const project = props.project;
    const width = project ? `${project.width * numericZoom(props.zoom)}px` : undefined;
    const height = project ? `${project.height * numericZoom(props.zoom)}px` : undefined;

    if (props.zoom === "fit") {
      return {
        display: "block",
        "max-width": "100%",
        "max-height": "calc(100dvh - 172px)",
        "box-shadow": "0 20px 80px rgba(15, 23, 42, 0.22)",
        cursor: canvasCursor(props.activeTool, props.selectedAnnotation !== undefined),
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
      cursor: canvasCursor(props.activeTool, props.selectedAnnotation !== undefined),
      "touch-action": "none",
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

    if (currentDraft.type === "arrow") {
      const length = Math.hypot(
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
              overflow="auto"
              onWheel={handleWheel}
              style={{
                "background-image":
                  "linear-gradient(45deg, rgba(148, 163, 184, 0.16) 25%, transparent 25%), linear-gradient(-45deg, rgba(148, 163, 184, 0.16) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(148, 163, 184, 0.16) 75%), linear-gradient(-45deg, transparent 75%, rgba(148, 163, 184, 0.16) 75%)",
                "background-size": "24px 24px",
                "background-position": "0 0, 0 12px, 12px -12px, -12px 0px",
              }}
            >
              <canvas
                ref={canvasRef}
                aria-label="Editable image canvas"
                data-active-tool={props.activeTool}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  const point = pointFromEvent(event);
                  setPointerPoint(point);
                  props.onPointerDown(point, event);
                }}
                onPointerMove={(event) => {
                  const point = pointFromEvent(event);
                  setPointerPoint(point);
                  props.onPointerMove(point, event);
                }}
                onPointerUp={(event) => {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                  const point = pointFromEvent(event);
                  setPointerPoint(point);
                  props.onPointerUp(point, event);
                }}
                onPointerLeave={() => setPointerPoint(undefined)}
                onDblClick={(event) => props.onDoubleClick(pointFromEvent(event), event)}
                style={canvasStyle()}
                width={project().width}
                height={project().height}
              />
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
                settings={props.settings}
                onSettingsChange={props.onSettingsChange}
                onStartInlineEdit={props.onStartInlineEdit}
                onDuplicateSelected={props.onDuplicateSelected}
                onBringForward={props.onBringForward}
                onSendBackward={props.onSendBackward}
                onDeleteSelected={props.onDeleteSelected}
              />
            </Show>

            <InlineAnnotationEditor
              annotation={props.inlineEditingAnnotation}
              style={inlineEditorStyle()}
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
              <Box>{project().annotations.length} layers</Box>
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

const projectBoundsToFrame = (bounds: Bounds, frame: CanvasFrame): Bounds => ({
  x: frame.left + bounds.x * frame.scaleX,
  y: frame.top + bounds.y * frame.scaleY,
  width: bounds.width * frame.scaleX,
  height: bounds.height * frame.scaleY,
});

const clampZoom = (zoom: number) => Math.max(0.1, Math.min(5, zoom));

const numericZoom = (zoom: ImageEditorZoom) => (zoom === "fit" ? 1 : zoom);

const canvasCursor = (tool: ImageEditorTool, hasSelection: boolean) => {
  if (tool !== "select") {
    return "crosshair";
  }

  return hasSelection ? "grab" : "default";
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
