import { ark } from "@ark-ui/solid/factory";
import type { ComponentProps } from "solid-js";
import { styled } from "styled-system/jsx";
import { group } from "styled-system/recipes";
import { Button as DemoButton } from "./button";

export type GroupProps = ComponentProps<typeof Group>;
export const Group = styled(ark.div, group);

export interface GroupDemoProps {
  variantProps?: Record<string, string>;
}

export const GroupDemo = (props: GroupDemoProps) => {
  return (
    <Group {...(props.variantProps ?? {})}>
      <DemoButton size="sm">Primary</DemoButton>
      <DemoButton size="sm" variant="outline">
        Secondary
      </DemoButton>
    </Group>
  );
};
