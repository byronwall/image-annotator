import { createMemo, onCleanup, untrack } from "solid-js";
import { createStore } from "solid-js/store";
import type { JSX } from "solid-js";

type MermaidViewportState = {
  scale: number;
  panX: number;
  panY: number;
  pointerId: number | null;
  lastPointerX: number;
  lastPointerY: number;
};

const MIN_MERMAID_SCALE = 0.35;
const MAX_MERMAID_SCALE = 4;
const MERMAID_FIT_PADDING = 24;

function clampMermaidScale(scale: number): number {
  if (scale < MIN_MERMAID_SCALE) return MIN_MERMAID_SCALE;
  if (scale > MAX_MERMAID_SCALE) return MAX_MERMAID_SCALE;
  return scale;
}

export function useMermaidViewport() {
  const [state, setState] = createStore<MermaidViewportState>({
    scale: 1,
    panX: 0,
    panY: 0,
    pointerId: null,
    lastPointerX: 0,
    lastPointerY: 0,
  });
  const timeoutIds: number[] = [];
  let viewportRef: HTMLDivElement | undefined;

  const setViewportRef = (element: HTMLDivElement) => {
    viewportRef = element;
  };

  const registerTimeout = (id: number) => {
    timeoutIds.push(id);
  };

  const getMermaidBaseDimensions = () => {
    if (!viewportRef) return null;
    const svgElement = viewportRef.querySelector("svg");
    if (!svgElement) return null;
    const bounds = svgElement.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return null;
    const currentScale = state.scale > 0 ? state.scale : 1;
    return {
      width: bounds.width / currentScale,
      height: bounds.height / currentScale,
    };
  };

  const fitToViewport = () => {
    if (!viewportRef) return;
    const dimensions = getMermaidBaseDimensions();
    if (!dimensions) return;

    const viewportWidth = Math.max(
      viewportRef.clientWidth - MERMAID_FIT_PADDING * 2,
      1,
    );
    const viewportHeight = Math.max(
      viewportRef.clientHeight - MERMAID_FIT_PADDING * 2,
      1,
    );
    const nextScale = clampMermaidScale(
      Math.min(
        viewportWidth / dimensions.width,
        viewportHeight / dimensions.height,
      ),
    );
    console.log("Markdown:mermaid:fitToViewport", {
      nextScale,
      width: dimensions.width,
      height: dimensions.height,
    });
    setState({
      scale: nextScale,
      panX: 0,
      panY: 0,
      pointerId: null,
      lastPointerX: 0,
      lastPointerY: 0,
    });
  };

  const scheduleFitToViewport = () => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        untrack(() => fitToViewport());
      });
    });
    registerTimeout(
      window.setTimeout(() => {
        untrack(() => fitToViewport());
      }, 64),
    );
  };

  const reset = () => {
    console.log("Markdown:mermaid:resetViewport");
    setState({
      scale: 1,
      panX: 0,
      panY: 0,
      pointerId: null,
      lastPointerX: 0,
      lastPointerY: 0,
    });
  };

  const applyScale = (
    nextScale: number,
    anchorClientX: number,
    anchorClientY: number,
  ) => {
    if (!viewportRef) {
      setState("scale", clampMermaidScale(nextScale));
      return;
    }

    const currentScale = state.scale;
    const clampedScale = clampMermaidScale(nextScale);
    if (clampedScale === currentScale) return;

    const bounds = viewportRef.getBoundingClientRect();
    const centerX = bounds.width / 2;
    const centerY = bounds.height / 2;
    const anchorX = anchorClientX - bounds.left;
    const anchorY = anchorClientY - bounds.top;
    const pointX = (anchorX - centerX - state.panX) / currentScale;
    const pointY = (anchorY - centerY - state.panY) / currentScale;
    const panX = anchorX - centerX - pointX * clampedScale;
    const panY = anchorY - centerY - pointY * clampedScale;

    setState({
      scale: clampedScale,
      panX,
      panY,
    });
  };

  const handleWheel: JSX.EventHandlerUnion<HTMLDivElement, WheelEvent> = (
    event,
  ) => {
    event.preventDefault();
    const rawDelta =
      event.deltaMode === 1
        ? event.deltaY * 16
        : event.deltaMode === 2
          ? event.deltaY * window.innerHeight
          : event.deltaY;
    const clampedDelta = Math.max(-80, Math.min(80, rawDelta));
    const factor = Math.exp(-clampedDelta * 0.0025);
    applyScale(state.scale * factor, event.clientX, event.clientY);
  };

  const handlePointerDown: JSX.EventHandlerUnion<
    HTMLDivElement,
    PointerEvent
  > = (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setState({
      pointerId: event.pointerId,
      lastPointerX: event.clientX,
      lastPointerY: event.clientY,
    });
  };

  const handlePointerMove: JSX.EventHandlerUnion<
    HTMLDivElement,
    PointerEvent
  > = (event) => {
    if (state.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - state.lastPointerX;
    const deltaY = event.clientY - state.lastPointerY;
    setState({
      panX: state.panX + deltaX,
      panY: state.panY + deltaY,
      lastPointerX: event.clientX,
      lastPointerY: event.clientY,
    });
  };

  const handlePointerUp: JSX.EventHandlerUnion<HTMLDivElement, PointerEvent> = (
    event,
  ) => {
    if (state.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setState({ pointerId: null });
  };

  const zoomIn = () => {
    if (!viewportRef) return;
    const bounds = viewportRef.getBoundingClientRect();
    applyScale(
      state.scale * 1.2,
      bounds.left + bounds.width / 2,
      bounds.top + bounds.height / 2,
    );
  };

  const zoomOut = () => {
    if (!viewportRef) return;
    const bounds = viewportRef.getBoundingClientRect();
    applyScale(
      state.scale * 0.84,
      bounds.left + bounds.width / 2,
      bounds.top + bounds.height / 2,
    );
  };

  const transform = createMemo(
    () =>
      `translate(-50%, -50%) translate(${state.panX}px, ${state.panY}px) scale(${state.scale})`,
  );

  const cursor = createMemo(() =>
    state.pointerId === null ? "grab" : "grabbing",
  );

  onCleanup(() => {
    timeoutIds.forEach((id) => window.clearTimeout(id));
  });

  return {
    state,
    cursor,
    transform,
    setViewportRef,
    fitToViewport,
    scheduleFitToViewport,
    reset,
    zoomIn,
    zoomOut,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
