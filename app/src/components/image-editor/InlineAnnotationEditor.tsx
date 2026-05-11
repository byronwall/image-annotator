import { createEffect, createSignal, onMount, Show } from "solid-js";
import type { JSX } from "solid-js";
import { Box } from "styled-system/jsx";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { type StepAnnotation, type TextAnnotation } from "./image-editor.types";

export type EditableAnnotation = TextAnnotation | StepAnnotation;

export type InlineAnnotationEditorProps = {
  annotation: EditableAnnotation | undefined;
  style: JSX.CSSProperties;
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
      if (annotation.type === "text") {
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
        <Box position="absolute" zIndex="20" style={props.style}>
          <Show
            when={asTextAnnotation(annotation())}
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
                value={textAnnotation().text}
                autoResize={false}
                onInput={(event) =>
                  props.onChange(textAnnotation().id, event.currentTarget.value)
                }
                onBlur={props.onCommit}
                onKeyDown={handleKeyDown}
                minW="40"
                minH="12"
                bg="bg.default"
                boxShadow="lg"
                resize="none"
                overflow="hidden"
              />
            )}
          </Show>
        </Box>
      )}
    </Show>
  );
};

const asTextAnnotation = (
  annotation: EditableAnnotation,
): TextAnnotation | undefined =>
  annotation.type === "text" ? annotation : undefined;

const asStepAnnotation = (
  annotation: EditableAnnotation,
): StepAnnotation | undefined =>
  annotation.type === "step" ? annotation : undefined;
