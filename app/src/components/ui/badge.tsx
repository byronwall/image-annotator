import { ark } from "@ark-ui/solid/factory";
import type { ComponentProps } from "solid-js";
import { styled } from "styled-system/jsx";
import { badge } from "styled-system/recipes";

export type BadgeProps = ComponentProps<typeof Badge>;
export const Badge = styled(ark.div, badge);

export interface BadgeDemoProps {
  variantProps?: Record<string, string>;
}

export const BadgeDemo = (props: BadgeDemoProps) => {
  return <Badge {...(props.variantProps ?? {})}>Badge</Badge>;
};
