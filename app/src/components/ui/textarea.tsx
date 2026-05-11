import { Field } from "@ark-ui/solid/field";
import { createEffect, splitProps } from "solid-js";
import type { ComponentProps, JSX } from "solid-js";
import { styled } from "styled-system/jsx";
import { textarea } from "styled-system/recipes";

const StyledTextarea = styled(Field.Textarea, textarea);

export type TextareaProps = ComponentProps<typeof StyledTextarea> & {
  autoResize?: boolean;
};

export function Textarea(props: TextareaProps) {
  let textareaRef: HTMLTextAreaElement | undefined;
  const [local, rest] = splitProps(props, ["autoResize", "onInput", "ref", "value"]);
  const autoResize = () => local.autoResize ?? true;

  const resizeTextarea = () => {
    if (!autoResize() || !textareaRef) {
      return;
    }

    textareaRef.style.height = "auto";
    textareaRef.style.height = `${textareaRef.scrollHeight}px`;
  };

  createEffect(() => {
    local.value;
    resizeTextarea();
  });

  const assignRef = (element: HTMLTextAreaElement) => {
    textareaRef = element;
    const ref = local.ref;
    if (typeof ref === "function") {
      ref(element);
    }
  };

  return (
    <StyledTextarea
      {...rest}
      ref={assignRef}
      value={local.value}
      onInput={(event) => {
        const onInput = local.onInput;
        if (Array.isArray(onInput)) {
          onInput[0](onInput[1], event);
        } else {
          (onInput as JSX.InputEventHandler<HTMLTextAreaElement, InputEvent> | undefined)?.(
            event as Parameters<JSX.InputEventHandler<HTMLTextAreaElement, InputEvent>>[0],
          );
        }
        resizeTextarea();
      }}
    />
  );
}

export interface TextareaDemoProps {
  variantProps?: Record<string, string>;
  value?: string;
}

export const TextareaDemo = (props: TextareaDemoProps) => {
  return (
    <Textarea
      {...(props.variantProps ?? {})}
      value={props.value ?? "Textarea preview"}
      readOnly
    />
  );
};
