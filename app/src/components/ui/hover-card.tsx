import { HoverCard } from "@ark-ui/solid/hover-card";
import type { ComponentProps } from "solid-js";
import { Box, HStack, VStack, createStyleContext } from "styled-system/jsx";
import { hoverCard } from "styled-system/recipes";
import { Badge as DemoBadge } from "./badge";
import { Button as DemoButton } from "./button";
import { Link as DemoLink } from "./link";
import { Text as DemoText } from "./text";

const { withRootProvider, withContext } = createStyleContext(hoverCard);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withRootProvider(HoverCard.Root);
export const RootProvider = withRootProvider(HoverCard.RootProvider);
export const Arrow = withContext(HoverCard.Arrow, "arrow");
export const ArrowTip = withContext(HoverCard.ArrowTip, "arrowTip");
export const Content = withContext(HoverCard.Content, "content");
export const Positioner = withContext(HoverCard.Positioner, "positioner");
export const Trigger = withContext(HoverCard.Trigger, "trigger");

export { HoverCardContext as Context } from "@ark-ui/solid/hover-card";

export interface HoverCardDemoProps {
  variantProps?: Record<string, string>;
}

export const HoverCardDemo = (props: HoverCardDemoProps) => {
  return (
    <VStack alignItems="start" gap="4" width="full" maxW="5xl">
      <DemoText textStyle="xs" color="fg.muted">
        Hover any trigger to preview rich contextual content.
      </DemoText>
      <HStack alignItems="center" gap="6" flexWrap="wrap">
        <Root {...(props.variantProps ?? {})} openDelay={150}>
          <Trigger
            asChild={(triggerProps) => (
              <DemoLink {...triggerProps()}>@panda_park</DemoLink>
            )}
          />
          <Positioner>
            <Content gap="3">
              <HStack justifyContent="space-between" alignItems="start">
                <VStack alignItems="start" gap="0.5">
                  <DemoText fontWeight="semibold">Panda Park UI</DemoText>
                  <DemoText textStyle="xs" color="fg.muted">
                    Design system profile
                  </DemoText>
                </VStack>
                <DemoBadge>Pro</DemoBadge>
              </HStack>
              <DemoText textStyle="sm">
                Building reusable UI primitives with Panda + Park.
              </DemoText>
            </Content>
          </Positioner>
        </Root>

        <Root {...(props.variantProps ?? {})} positioning={{ placement: "right" }}>
          <Trigger
            asChild={(triggerProps) => (
              <DemoLink {...triggerProps()}>Weekly metrics</DemoLink>
            )}
          />
          <Positioner>
            <Content gap="3">
              <DemoText fontWeight="semibold">Team Health</DemoText>
              <HStack gap="4">
                <VStack alignItems="start" gap="0">
                  <Box textStyle="lg" fontWeight="semibold">
                    93%
                  </Box>
                  <DemoText textStyle="xs" color="fg.muted">
                    SLA
                  </DemoText>
                </VStack>
                <VStack alignItems="start" gap="0">
                  <Box textStyle="lg" fontWeight="semibold">
                    12
                  </Box>
                  <DemoText textStyle="xs" color="fg.muted">
                    Open items
                  </DemoText>
                </VStack>
              </HStack>
            </Content>
          </Positioner>
        </Root>

        <Root
          {...(props.variantProps ?? {})}
          openDelay={300}
          closeDelay={100}
          positioning={{ placement: "bottom-start" }}
        >
          <Trigger
            asChild={(triggerProps) => (
              <DemoLink {...triggerProps()}>Actions menu</DemoLink>
            )}
          />
          <Positioner>
            <Content gap="2">
              <DemoText fontWeight="semibold">Quick actions</DemoText>
              <HStack gap="2">
                <DemoButton size="xs" variant="outline">
                  View
                </DemoButton>
                <DemoButton size="xs">Open</DemoButton>
              </HStack>
            </Content>
          </Positioner>
        </Root>
      </HStack>
    </VStack>
  );
};
