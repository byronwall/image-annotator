import type { ComponentProps } from "solid-js";
import { For } from "solid-js";
import { Box, HStack, VStack, styled } from "styled-system/jsx";
import { type HeadingVariantProps, heading } from "styled-system/recipes";
import type { StyledComponent } from "styled-system/types";

type Props = HeadingVariantProps & { as?: any };

export type HeadingProps = ComponentProps<typeof Heading>;
export const Heading = styled("h2", heading) as StyledComponent<"h2", Props>;

export interface HeadingDemoProps {
  variantProps?: Record<string, string>;
}

const headingScale = [
  { label: "xs", style: "xs" },
  { label: "sm", style: "sm" },
  { label: "md", style: "md" },
  { label: "lg", style: "lg" },
  { label: "xl", style: "xl" },
] as const;

export const HeadingDemo = (props: HeadingDemoProps) => {
  return (
    <VStack alignItems="stretch" gap="3" width="full" maxW="80">
      <For each={headingScale}>
        {(item) => (
          <HStack alignItems="baseline" gap="3">
            <Box textStyle="xs" color="fg.muted" minW="8">
              {item.label}
            </Box>
            <Heading {...(props.variantProps ?? {})} textStyle={item.style}>
              Heading Preview
            </Heading>
          </HStack>
        )}
      </For>
    </VStack>
  );
};
