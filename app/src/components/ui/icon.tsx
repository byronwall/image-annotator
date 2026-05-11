import { ark } from "@ark-ui/solid/factory";
import type { ComponentProps } from "solid-js";
import { styled } from "styled-system/jsx";
import { icon } from "styled-system/recipes";

export type IconProps = ComponentProps<typeof Icon>;
export const Icon = styled(ark.svg, icon);

export interface IconDemoProps {
  variantProps?: Record<string, string>;
}

export const IconDemo = (props: IconDemoProps) => {
  return (
    <Icon
      {...(props.variantProps ?? {})}
      viewBox="0 0 24 24"
      aria-label="Icon preview"
    >
      <path
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="m12 3 2.9 5.88 6.5.95-4.7 4.57 1.1 6.47L12 18.73 6.2 20.87l1.1-6.47-4.7-4.57 6.5-.95z"
      />
    </Icon>
  );
};
