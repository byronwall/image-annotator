import { ark } from "@ark-ui/solid";
import {
  type ComponentProps,
  type JSX,
  createMemo,
  splitProps,
} from "solid-js";
import { createStyleContext } from "styled-system/jsx";
import { inputGroup } from "styled-system/recipes";
import { Input as DemoInput } from "./input";
import { Kbd as DemoKbd } from "./kbd";

const { withProvider, withContext } = createStyleContext(inputGroup);

type RootProps = ComponentProps<typeof Root>;
const Root = withProvider(ark.div, "root");
const Element = withContext(ark.div, "element");

export interface InputGroupProps extends RootProps {
  startElement?: JSX.Element | (() => JSX.Element) | undefined;
  endElement?: JSX.Element | (() => JSX.Element) | undefined;
}

export const InputGroup = (props: InputGroupProps) => {
  const [local, rest] = splitProps(props, [
    "startElement",
    "endElement",
    "children",
  ]);
  const resolveMaybeFnDeep = <T,>(value: T | (() => T)) => {
    let current = value as unknown;
    let guard = 0;

    while (typeof current === "function" && guard < 10) {
      current = (current as () => unknown)();
      guard += 1;
    }

    return current as T;
  };

  const resolvedChildren = createMemo(() =>
    resolveMaybeFnDeep(local.children as JSX.Element | (() => JSX.Element)),
  );
  const resolvedStart = createMemo(() =>
    resolveMaybeFnDeep(
      local.startElement as JSX.Element | (() => JSX.Element) | undefined,
    ),
  );
  const resolvedEnd = createMemo(() =>
    resolveMaybeFnDeep(
      local.endElement as JSX.Element | (() => JSX.Element) | undefined,
    ),
  );

  return (
    <Root {...rest}>
      {resolvedStart() ? (
        <Element insetInlineStart="0" top="0">
          {resolvedStart()}
        </Element>
      ) : null}
      {resolvedChildren()}
      {resolvedEnd() ? (
        <Element insetInlineEnd="0" top="0">
          {resolvedEnd()}
        </Element>
      ) : null}
    </Root>
  );
};

export interface InputGroupDemoProps {
  variantProps?: Record<string, string>;
}

export const InputGroupDemo = (props: InputGroupDemoProps) => {
  return (
    <Root {...(props.variantProps ?? {})} width="64">
      <DemoInput {...(props.variantProps ?? {})} placeholder="Search" />
      <Element insetInlineEnd="0" top="0">
        <DemoKbd>⌘K</DemoKbd>
      </Element>
    </Root>
  );
};
