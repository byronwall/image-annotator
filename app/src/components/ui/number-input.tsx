import { NumberInput } from "@ark-ui/solid/number-input";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-solid";
import type { ComponentProps } from "solid-js";
import { createStyleContext } from "styled-system/jsx";
import { numberInput } from "styled-system/recipes";
import { Box as DemoBox, VStack as DemoVStack } from "styled-system/jsx";

const { withProvider, withContext } = createStyleContext(numberInput);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withProvider(NumberInput.Root, "root");
export const RootProvider = withProvider(NumberInput.RootProvider, "root");
export const DecrementTrigger = withContext(
  NumberInput.DecrementTrigger,
  "decrementTrigger",
  {
    defaultProps: () => ({ children: <ChevronDownIcon /> }),
  },
);
export const IncrementTrigger = withContext(
  NumberInput.IncrementTrigger,
  "incrementTrigger",
  {
    defaultProps: () => ({ children: <ChevronUpIcon /> }),
  },
);
export const Input = withContext(NumberInput.Input, "input");
export const Label = withContext(NumberInput.Label, "label");
export const Scrubber = withContext(NumberInput.Scrubber, "scrubber");
export const ValueText = withContext(NumberInput.ValueText, "valueText");
export const Control = withContext(NumberInput.Control, "control", {
  defaultProps: () => ({
    children: (
      <>
        <IncrementTrigger />
        <DecrementTrigger />
      </>
    ),
  }),
});

export { NumberInputContext as Context } from "@ark-ui/solid/number-input";

export interface NumberInputDemoProps {
  variantProps?: Record<string, string>;
  value?: string;
}

export const NumberInputDemo = (props: NumberInputDemoProps) => {
  return (
    <DemoVStack alignItems="stretch" gap="1" width="64">
      <DemoBox textStyle="sm" fontWeight="medium">
        Amount
      </DemoBox>
      <Root
        {...(props.variantProps ?? {})}
        value={props.value ?? "42"}
        width="64"
      >
        <Input />
        <Control />
      </Root>
    </DemoVStack>
  );
};
