import { Collapsible } from "@ark-ui/solid/collapsible";
import type { ComponentProps } from "solid-js";
import { Box, HStack, VStack, createStyleContext } from "styled-system/jsx";
import { collapsible } from "styled-system/recipes";
import { Button as DemoButton } from "./button";

const { withProvider, withContext } = createStyleContext(collapsible);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withProvider(Collapsible.Root, "root");
export const RootProvider = withProvider(Collapsible.RootProvider, "root");
export const Content = withContext(Collapsible.Content, "content");
export const Indicator = withContext(Collapsible.Indicator, "indicator");
export const Trigger = withContext(Collapsible.Trigger, "trigger");

export { CollapsibleContext as Context } from "@ark-ui/solid/collapsible";

export interface CollapsibleDemoProps {
  variantProps?: Record<string, string>;
}

export const CollapsibleDemo = (props: CollapsibleDemoProps) => {
  return (
    <HStack alignItems="start" gap="6" flexWrap="wrap" width="full" maxW="6xl">
      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">
          Basic
        </Box>
        <Box textStyle="xs" color="fg.muted">
          Standard expand/collapse behavior with animated content.
        </Box>
        <Root {...(props.variantProps ?? {})} defaultOpen style={{ width: "18rem" }}>
          <Trigger
            asChild={(triggerProps) => (
              <DemoButton variant="outline" style={{ width: "auto" }} {...triggerProps()}>
                Toggle
              </DemoButton>
            )}
          />
          <Content>
            <Box p="4" mt="3" borderWidth="1px">
              Park UI beautifully-designed, accessible components system.
            </Box>
          </Content>
        </Root>
      </VStack>

      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">
          Lazy Mount
        </Box>
        <Box textStyle="xs" color="fg.muted">
          Content mounts only when opened for the first time.
        </Box>
        <Root {...(props.variantProps ?? {})} lazyMount style={{ width: "18rem" }}>
          <Trigger
            asChild={(triggerProps) => (
              <DemoButton variant="outline" style={{ width: "auto" }} {...triggerProps()}>
                Toggle
              </DemoButton>
            )}
          />
          <Content>
            <Box p="4" mt="3" borderWidth="1px">
              Content is mounted on demand, which can reduce initial render cost.
            </Box>
          </Content>
        </Root>
      </VStack>

      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">
          Unmount on Exit
        </Box>
        <Box textStyle="xs" color="fg.muted">
          Content unmounts each time the section is closed.
        </Box>
        <Root {...(props.variantProps ?? {})} unmountOnExit style={{ width: "18rem" }}>
          <Trigger
            asChild={(triggerProps) => (
              <DemoButton variant="outline" style={{ width: "auto" }} {...triggerProps()}>
                Toggle
              </DemoButton>
            )}
          />
          <Content>
            <Box p="4" mt="3" borderWidth="1px">
              Useful when hidden content contains heavy logic or side effects.
            </Box>
          </Content>
        </Root>
      </VStack>
    </HStack>
  );
};
