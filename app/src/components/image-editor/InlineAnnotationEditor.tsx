import { createEffect, createSignal, onMount, Show } from "solid-js";
import type { JSX } from "solid-js";
import { Box } from "styled-system/jsx";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { getTextRenderColors, getTextRenderLayout } from "./image-editor.render";
import {
  type ArrowAnnotation,
  type BoxAnnotation,
  type StepAnnotation,
  type TextAnnotation,
} from "./image-editor.types";

export type EditableAnnotation =
  | TextAnnotation
  | StepAnnotation
  | ArrowAnnotation
  | BoxAnnotation;

export type InlineAnnotationEditorProps = {
  annotation: EditableAnnotation | undefined;
  style: JSX.CSSProperties;
  scale: number;
  onChange: (id: string, value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
};

export const InlineAnnotationEditor = (props: InlineAnnotationEditorProps) => {
  let inputRef: HTMLInputElement | undefined;
  let textareaRef: HTMLTextAreaElement | undefined;
  const [lastAnnotationId, setLastAnnotationId] = createSignal<string>();

  createEffect(() => {
    const annotation = props.annotation;

    if (!annotation || lastAnnotationId() === annotation.id) {
      return;
    }

    setLastAnnotationId(annotation.id);
    window.setTimeout(() => {
      if (isTextLikeAnnotation(annotation)) {
        textareaRef?.focus();
        textareaRef?.select();
      } else {
        inputRef?.focus();
        inputRef?.select();
      }
    }, 0);
  });

  onMount(() => {
    textareaRef?.focus();
    textareaRef?.select();
    inputRef?.focus();
    inputRef?.select();
  });

  const handleKeyDown = (event: KeyboardEvent) => {
    event.stopPropagation();

    if (event.key === "Escape") {
      event.preventDefault();
      props.onCancel();
      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      props.onCommit();
    }
  };

  return (
    <Show when={props.annotation}>
      {(annotation) => (
        <Box position="absolute" zIndex="20" overflow="visible" style={props.style}>
          <Show
            when={asTextLikeAnnotation(annotation())}
            fallback={
              <Show when={asStepAnnotation(annotation())}>
                {(stepAnnotation) => (
                  <Input
                    ref={inputRef}
                    aria-label="Edit step label"
                    value={stepAnnotation().label}
                    onInput={(event) =>
                      props.onChange(stepAnnotation().id, event.currentTarget.value)
                    }
                    onBlur={props.onCommit}
                    onKeyDown={handleKeyDown}
                    textAlign="center"
                    fontWeight="bold"
                    width="16"
                    bg="bg.default"
                    boxShadow="lg"
                  />
                )}
              </Show>
            }
          >
            {(textAnnotation) => (
              <Textarea
                ref={textareaRef}
                aria-label="Edit annotation text"
                value={textAnnotationValue(textAnnotation())}
                autoResize
                onInput={(event) =>
                  props.onChange(textAnnotation().id, event.currentTarget.value)
                }
                onBlur={props.onCommit}
                onKeyDown={handleKeyDown}
                wrap="soft"
                rows={1}
                cols={1}
                width="full"
                borderWidth="0"
                boxShadow="none"
                resize="none"
                overflow="hidden"
                style={textEditorStyle(textAnnotationStyleSource(textAnnotation()), props.scale)}
              />
            )}
          </Show>
        </Box>
      )}
    </Show>
  );
};

const asTextLikeAnnotation = (
  annotation: EditableAnnotation,
): TextAnnotation | ArrowAnnotation | BoxAnnotation | undefined =>
  annotation.type === "text" ||
  annotation.type === "arrow" ||
  annotation.type === "rectangle" ||
  annotation.type === "ellipse" ||
  annotation.type === "pixelate" ||
  annotation.type === "erase"
    ? annotation
    : undefined;

const isTextLikeAnnotation = (annotation: EditableAnnotation) =>
  asTextLikeAnnotation(annotation) !== undefined;

const asStepAnnotation = (
  annotation: EditableAnnotation,
): StepAnnotation | undefined =>
  annotation.type === "step" ? annotation : undefined;

const textAnnotationValue = (
  annotation: TextAnnotation | ArrowAnnotation | BoxAnnotation,
) => (annotation.type === "text" ? annotation.text : annotation.text?.text ?? "");

const textAnnotationStyleSource = (
  annotation: TextAnnotation | ArrowAnnotation | BoxAnnotation,
): TextAnnotation =>
  annotation.type === "text"
    ? annotation
    : {
        id: annotation.id,
        type: "text",
        createdAt: annotation.createdAt,
        opacity: annotation.opacity,
        x: annotation.text?.x ?? 0,
        y: annotation.text?.y ?? 0,
        text: annotation.text?.text ?? "",
        color: annotation.text?.color ?? "#0f172a",
        backgroundColor: annotation.text?.backgroundColor ?? "rgba(255, 255, 255, 0.94)",
        fontSize: annotation.text?.fontSize ?? 24,
        textStyle: annotation.text?.textStyle ?? "light-label",
        textAlign: annotation.text?.textAlign,
        verticalAlign: annotation.text?.verticalAlign,
        width: annotation.text?.width,
        height: annotation.text?.height,
      };

const textEditorStyle = (
  annotation: TextAnnotation,
  scale: number,
): JSX.CSSProperties => {
  const layout = getTextRenderLayout(annotation);
  const metrics = layout.metrics;
  const colors = getTextRenderColors(annotation);
  const visualScale = Math.max(0.01, scale);
  const shouldWrap = annotation.width !== undefined || layout.isAutoWidthCapped;
  const border =
    colors.borderColor === "rgba(255, 255, 255, 0)"
      ? "0"
      : `${Math.max(1, visualScale)}px solid ${colors.borderColor}`;

  return {
    color: colors.color,
    "background-color": colors.backgroundColor,
    opacity: annotation.opacity,
    "font-family": metrics.fontFamily,
    "font-size": `${annotation.fontSize * visualScale}px`,
    "font-weight": metrics.fontWeight,
    "line-height": `${metrics.lineHeight * visualScale}px`,
    "text-align": annotation.textAlign ?? "left",
    padding: `${layout.textStartY * visualScale}px ${metrics.paddingX * visualScale}px ${metrics.paddingY * visualScale}px ${layout.textStartX * visualScale}px`,
    border,
    "border-radius": `${metrics.borderRadius * visualScale}px`,
    "box-shadow": "none",
    outline: "none",
    resize: "none",
    overflow: "hidden",
    "box-sizing": "border-box",
    "caret-color": colors.color,
    "white-space": shouldWrap ? "pre-wrap" : "pre",
    "overflow-wrap": shouldWrap ? "break-word" : "normal",
    "word-break": "normal",
  };
};
