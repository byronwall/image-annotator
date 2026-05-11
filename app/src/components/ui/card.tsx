import { ark } from "@ark-ui/solid/factory";
import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  type ComponentProps,
} from "solid-js";
import { Box, HStack, VStack, createStyleContext } from "styled-system/jsx";
import { card } from "styled-system/recipes";
import { Button as DemoButton } from "./button";

const { withProvider, withContext } = createStyleContext(card);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withProvider(ark.div, "root");
export const Header = withContext(ark.div, "header");
export const Body = withContext(ark.div, "body");
export const Footer = withContext(ark.div, "footer");
export const Title = withContext(ark.h3, "title");
export const Description = withContext(ark.div, "description");

export interface CardDemoProps {
  variantProps?: Record<string, string>;
}

const contentModes = ["summary", "details", "stats"] as const;
const [showMedia, setShowMedia] = createSignal(true);
const [showDescription, setShowDescription] = createSignal(true);
const [showFooter, setShowFooter] = createSignal(true);
const [interactive, setInteractive] = createSignal(false);
const [centered, setCentered] = createSignal(false);
const [contentMode, setContentMode] =
  createSignal<(typeof contentModes)[number]>("summary");

let nextCardDemoInstanceId = 0;
const [controlsOwnerId, setControlsOwnerId] = createSignal<number | null>(null);

export const CardDemo = (props: CardDemoProps) => {
  const instanceId = nextCardDemoInstanceId++;
  const isControlsOwner = () => controlsOwnerId() === instanceId;

  createEffect(() => {
    if (controlsOwnerId() == null) {
      setControlsOwnerId(instanceId);
    }
  });

  onCleanup(() => {
    if (controlsOwnerId() === instanceId) {
      setControlsOwnerId(null);
    }
  });

  const bodyContent = createMemo(() => {
    if (contentMode() === "details") {
      return (
        <VStack alignItems="start" gap="1">
          <Box textStyle="sm">Multi-section content layout preview.</Box>
          <Box textStyle="sm" color="fg.muted">
            Secondary line for dense card use cases.
          </Box>
          <Box textStyle="sm" color="fg.muted">
            Metadata: Updated 2h ago
          </Box>
        </VStack>
      );
    }

    if (contentMode() === "stats") {
      return (
        <HStack gap="5" alignItems="start">
          <VStack alignItems="start" gap="0">
            <Box textStyle="xl" fontWeight="semibold">
              24
            </Box>
            <Box textStyle="xs" color="fg.muted">
              Open tasks
            </Box>
          </VStack>
          <VStack alignItems="start" gap="0">
            <Box textStyle="xl" fontWeight="semibold">
              93%
            </Box>
            <Box textStyle="xs" color="fg.muted">
              Completion
            </Box>
          </VStack>
        </HStack>
      );
    }

    return <Box textStyle="md">Card content body</Box>;
  });

  return (
    <VStack alignItems="start" gap="3" width="full" maxW="96">
      <Root
        {...(props.variantProps ?? {})}
        width="full"
        cursor={interactive() ? "pointer" : undefined}
        transition={interactive() ? "common" : undefined}
        _hover={
          interactive()
            ? {
                transform: "translateY(-2px)",
                boxShadow: "lg",
              }
            : undefined
        }
      >
        <Show when={showMedia()}>
          <Box height="28" bg="gray.subtle.bg" borderBottomWidth="1px" />
        </Show>
        <Header alignItems={centered() ? "center" : "start"}>
          <Title>Card title</Title>
          <Show when={showDescription()}>
            <Description>
              Configurable preview for common card compositions.
            </Description>
          </Show>
        </Header>
        <Body alignItems={centered() ? "center" : "start"}>{bodyContent()}</Body>
        <Show when={showFooter()}>
          <Footer justifyContent={centered() ? "center" : "flex-end"}>
            <DemoButton size="xs" variant="outline">
              Cancel
            </DemoButton>
            <DemoButton size="xs">Save</DemoButton>
          </Footer>
        </Show>
      </Root>

      <Show when={isControlsOwner()}>
        <HStack gap="1" flexWrap="wrap">
          <For each={contentModes}>
            {(mode) => (
              <DemoButton
                size="2xs"
                variant={contentMode() === mode ? "solid" : "outline"}
                onClick={() => setContentMode(mode)}
              >
                {mode}
              </DemoButton>
            )}
          </For>
          <DemoButton
            size="2xs"
            variant={showMedia() ? "solid" : "outline"}
            onClick={() => setShowMedia((value) => !value)}
          >
            media {showMedia() ? "on" : "off"}
          </DemoButton>
          <DemoButton
            size="2xs"
            variant={showDescription() ? "solid" : "outline"}
            onClick={() => setShowDescription((value) => !value)}
          >
            description {showDescription() ? "on" : "off"}
          </DemoButton>
          <DemoButton
            size="2xs"
            variant={showFooter() ? "solid" : "outline"}
            onClick={() => setShowFooter((value) => !value)}
          >
            footer {showFooter() ? "on" : "off"}
          </DemoButton>
          <DemoButton
            size="2xs"
            variant={interactive() ? "solid" : "outline"}
            onClick={() => setInteractive((value) => !value)}
          >
            interactive {interactive() ? "on" : "off"}
          </DemoButton>
          <DemoButton
            size="2xs"
            variant={centered() ? "solid" : "outline"}
            onClick={() => setCentered((value) => !value)}
          >
            centered {centered() ? "on" : "off"}
          </DemoButton>
        </HStack>
      </Show>
    </VStack>
  );
};
