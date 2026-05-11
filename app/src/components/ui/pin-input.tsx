import { PinInput } from "@ark-ui/solid/pin-input";
import type { ComponentProps } from "solid-js";
import { createStyleContext } from "styled-system/jsx";
import { pinInput } from "styled-system/recipes";

const { withProvider, withContext } = createStyleContext(pinInput);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withProvider(PinInput.Root, "root", {
  forwardProps: ["mask"],
});
export const RootProvider = withProvider(PinInput.RootProvider, "root");
export const Control = withContext(PinInput.Control, "control");
export const HiddenInput = PinInput.HiddenInput;
export const Input = withContext(PinInput.Input, "input");
export const Label = withContext(PinInput.Label, "label");

export { PinInputContext as Context } from "@ark-ui/solid/pin-input";

export interface PinInputDemoProps {
  variantProps?: Record<string, string>;
  value?: string[];
}

export const PinInputDemo = (props: PinInputDemoProps) => {
  return (
    <Root
      {...(props.variantProps ?? {})}
      value={props.value ?? ["1", "2", "3", "4"]}
    >
      <Label>PIN</Label>
      <Control>
        <Input index={0} />
        <Input index={1} />
        <Input index={2} />
        <Input index={3} />
      </Control>
    </Root>
  );
};
