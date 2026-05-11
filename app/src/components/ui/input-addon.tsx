import { ark } from "@ark-ui/solid/factory";
import type { ComponentProps } from "solid-js";
import { styled } from "styled-system/jsx";
import { inputAddon } from "styled-system/recipes";
import { Input as DemoInput } from "./input";
import { Group as DemoGroup } from "./group";

export type InputAddonProps = ComponentProps<typeof InputAddon>;
export const InputAddon = styled(ark.div, inputAddon);

export interface InputAddonDemoProps {
  variantProps?: Record<string, string>;
}

export const InputAddonDemo = (props: InputAddonDemoProps) => {
  const sharedVariantProps = () => props.variantProps ?? {};

  return (
    <DemoGroup attached width="full" maxW="80">
      <InputAddon {...sharedVariantProps()}>€</InputAddon>
      <DemoInput {...sharedVariantProps()} placeholder="0.00" />
      <InputAddon {...sharedVariantProps()}>EUR</InputAddon>
    </DemoGroup>
  );
};
