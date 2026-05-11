import { ark } from "@ark-ui/solid/factory";
import type { ComponentProps } from "solid-js";
import { styled } from "styled-system/jsx";
import { kbd } from "styled-system/recipes";

export type KbdProps = ComponentProps<typeof Kbd>;
export const Kbd = styled(ark.kbd, kbd);

export interface KbdDemoProps {
  variantProps?: Record<string, string>;
}

export const KbdDemo = (props: KbdDemoProps) => {
  return <Kbd {...(props.variantProps ?? {})}>cmd + p</Kbd>;
};
