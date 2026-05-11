import { ark } from "@ark-ui/solid/factory";
import type { ComponentProps } from "solid-js";
import { styled } from "styled-system/jsx";
import { code } from "styled-system/recipes";

export type CodeProps = ComponentProps<typeof Code>;
export const Code = styled(ark.code, code);

export interface CodeDemoProps {
  variantProps?: Record<string, string>;
}

export const CodeDemo = (props: CodeDemoProps) => {
  return <Code {...(props.variantProps ?? {})}>const preview = true</Code>;
};
