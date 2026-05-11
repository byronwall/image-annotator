import { Clipboard } from "@ark-ui/solid/clipboard";
import { CheckIcon, CopyIcon } from "lucide-solid";
import type { ComponentProps } from "solid-js";
import { createStyleContext } from "styled-system/jsx";
import { clipboard } from "styled-system/recipes";
import { Button as DemoButton } from "./button";
import { Input as DemoInput } from "./input";

const { withProvider, withContext } = createStyleContext(clipboard);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withProvider(Clipboard.Root, "root");
export const RootProvider = withProvider(Clipboard.RootProvider, "root");
export const Control = withContext(Clipboard.Control, "control");
export const Input = withContext(Clipboard.Input, "input");
export const Label = withContext(Clipboard.Label, "label");
export const Trigger = withContext(Clipboard.Trigger, "trigger");

export { ClipboardContext as Context } from "@ark-ui/solid/clipboard";

type IndicatorProps = ComponentProps<typeof StyledIndicator>;

const StyledIndicator = withContext(Clipboard.Indicator, "indicator");

export const Indicator = (props: IndicatorProps) => {
  return (
    <StyledIndicator copied={<CheckIcon />} {...props}>
      <CopyIcon />
    </StyledIndicator>
  );
};

export const CopyText = (props: IndicatorProps) => {
  return (
    <StyledIndicator copied="Copied" {...props}>
      Copy
    </StyledIndicator>
  );
};

export interface ClipboardDemoProps {
  variantProps?: Record<string, string>;
}

export const ClipboardDemo = (props: ClipboardDemoProps) => {
  return (
    <Root
      {...(props.variantProps ?? {})}
      value="https://park-ui.com"
      width="72"
    >
      <Label>Copy URL</Label>
      <Control>
        <DemoInput />
        <Trigger
          asChild={(props) => <DemoButton {...props()}>Copy</DemoButton>}
        />
      </Control>
    </Root>
  );
};
