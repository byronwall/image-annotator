import type { Accessor, JSX } from "solid-js";
import { Show, createSignal } from "solid-js";
import { splitProps } from "solid-js";
import { Portal } from "solid-js/web";
import { Box, HStack, VStack } from "styled-system/jsx";
import { Button } from "./button";
import * as Popover from "./popover";
import type { PopoverRootProps } from "@ark-ui/solid";
import { CloseButton } from "./close-button";

type Placement =
  | "bottom-start"
  | "bottom-end"
  | "top-start"
  | "top-end"
  | "right-start"
  | "right-end"
  | "left-start"
  | "left-end";

type PopoverProps = {
  open: boolean;
  onClose: () => void;
  anchor: JSX.Element;
  placement?: Placement;
  offset?: number;
  class?: string;
  style?: JSX.CSSProperties;
  children: JSX.Element;
  portalled?: boolean;
  portalRef?: HTMLElement | undefined;
};

export const SimplePopover = (props: PopoverProps) => {
  const [local] = splitProps(props, [
    "open",
    "onClose",
    "anchor",
    "placement",
    "offset",
    "class",
    "style",
    "children",
    "portalled",
    "portalRef",
  ]);

  const portalled = () => local.portalled ?? true;

  const positioning: Accessor<PopoverRootProps["positioning"]> = () => {
    const base = { placement: local.placement ?? "bottom-start" };
    if (typeof local.offset === "number") {
      return { ...base, offset: { mainAxis: local.offset } };
    }
    return base;
  };

  return (
    <Popover.Root
      open={local.open}
      onOpenChange={(details) => {
        if (!details.open) {
          local.onClose();
        }
      }}
      positioning={positioning()}
    >
      <Popover.Anchor style={{ display: "inline-flex", width: "fit-content" }}>
        {local.anchor}
      </Popover.Anchor>
      <Show
        when={portalled()}
        fallback={
          <Popover.Positioner>
            <Popover.Content class={local.class} style={local.style}>
              {local.children}
            </Popover.Content>
          </Popover.Positioner>
        }
      >
        <Portal mount={local.portalRef}>
          <Popover.Positioner>
            <Popover.Content class={local.class} style={local.style}>
              {local.children}
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Show>
    </Popover.Root>
  );
};

export type SimplePopoverDemoProps = {
  variantProps?: Record<string, string>;
};

export const SimplePopoverDemo = (_props: SimplePopoverDemoProps) => {
  const [basicOpen, setBasicOpen] = createSignal(false);
  const [controlledOpen, setControlledOpen] = createSignal(false);
  const [positionedOpen, setPositionedOpen] = createSignal(false);

  return (
    <HStack alignItems="start" gap="6" flexWrap="wrap" width="full" maxW="6xl">
      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">
          Basic
        </Box>
        <SimplePopover
          open={basicOpen()}
          onClose={() => setBasicOpen(false)}
          anchor={
            <Button style={{ width: "auto" }} onClick={() => setBasicOpen(true)}>
              Open Popover
            </Button>
          }
        >
          <Popover.Arrow />
          <Popover.Body>
            <Popover.Title>Title</Popover.Title>
            <Popover.Description>Description</Popover.Description>
          </Popover.Body>
          <Popover.CloseTrigger
            asChild={(triggerProps) => <CloseButton {...triggerProps()} />}
          />
        </SimplePopover>
      </VStack>

      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">
          Controlled
        </Box>
        <SimplePopover
          open={controlledOpen()}
          onClose={() => setControlledOpen(false)}
          anchor={
            <Button
              variant="outline"
              style={{ width: "auto" }}
              onClick={() => setControlledOpen(true)}
            >
              Open Popover
            </Button>
          }
        >
          <Popover.Arrow />
          <Popover.Body>
            <Popover.Title>Controlled Popover</Popover.Title>
            <Popover.Description>
              Visibility is managed by local state.
            </Popover.Description>
          </Popover.Body>
          <Popover.CloseTrigger
            asChild={(triggerProps) => <CloseButton {...triggerProps()} />}
          />
        </SimplePopover>
      </VStack>

      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">
          Placement + Offset
        </Box>
        <SimplePopover
          open={positionedOpen()}
          onClose={() => setPositionedOpen(false)}
          placement="right-start"
          offset={8}
          anchor={
            <Button
              variant="outline"
              style={{ width: "auto" }}
              onClick={() => setPositionedOpen(true)}
            >
              Open Popover
            </Button>
          }
        >
          <Popover.Arrow />
          <Popover.Body>
            <Popover.Title>Right Placement</Popover.Title>
            <Popover.Description>
              Uses placement and main-axis offset.
            </Popover.Description>
          </Popover.Body>
          <Popover.CloseTrigger
            asChild={(triggerProps) => <CloseButton {...triggerProps()} />}
          />
        </SimplePopover>
      </VStack>
    </HStack>
  );
};
