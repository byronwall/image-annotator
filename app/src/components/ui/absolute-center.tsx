import { ark } from "@ark-ui/solid/factory";
import type { ComponentProps } from "solid-js";
import { styled } from "styled-system/jsx";
import { absoluteCenter } from "styled-system/recipes";
import { Badge as DemoBadge } from "./badge";
import { Box as DemoBox } from "styled-system/jsx";

export type AbsoluteCenterProps = ComponentProps<typeof AbsoluteCenter>;
export const AbsoluteCenter = styled(ark.div, absoluteCenter);

export interface AbsoluteCenterDemoProps {
  variantProps?: Record<string, string>;
}

export const AbsoluteCenterDemo = (props: AbsoluteCenterDemoProps) => {
  return (
    <DemoBox
      position="relative"
      width="72"
      height="20"
      borderWidth="1px"
      borderColor="border"
    >
      <AbsoluteCenter {...(props.variantProps ?? {})}>
        <DemoBadge>Centered</DemoBadge>
      </AbsoluteCenter>
    </DemoBox>
  );
};
