import { ark } from "@ark-ui/solid/factory";
import type { ComponentProps } from "solid-js";
import { styled } from "styled-system/jsx";
import { link } from "styled-system/recipes";

export type LinkProps = ComponentProps<typeof Link>;
export const Link = styled(ark.a, link);

export interface LinkDemoProps {
  variantProps?: Record<string, string>;
}

export const LinkDemo = (props: LinkDemoProps) => {
  return (
    <Link {...(props.variantProps ?? {})} href="#">
      Link Preview
    </Link>
  );
};
