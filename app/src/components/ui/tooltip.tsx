import { Tooltip as ArkTooltip } from "@ark-ui/solid/tooltip";
import {
  For,
  type ComponentProps,
  createMemo,
  createSignal,
  type JSX,
  Show,
  splitProps,
} from "solid-js";
import { Portal } from "solid-js/web";
import { Box, HStack, VStack, createStyleContext } from "styled-system/jsx";
import { tooltip } from "styled-system/recipes";
import { Button as DemoButton } from "./button";

const { withRootProvider, withContext } = createStyleContext(tooltip);

type RootProps = ComponentProps<typeof Root>;
type ContentProps = ComponentProps<typeof Content>;
const Root = withRootProvider(ArkTooltip.Root, {
  defaultProps: () => ({ unmountOnExit: true, lazyMount: true }),
});
const Arrow = withContext(ArkTooltip.Arrow, "arrow");
const ArrowTip = withContext(ArkTooltip.ArrowTip, "arrowTip");
const Content = withContext(ArkTooltip.Content, "content");
const Positioner = withContext(ArkTooltip.Positioner, "positioner");
const Trigger = withContext(ArkTooltip.Trigger, "trigger");

export { TooltipContext as Context } from "@ark-ui/solid/tooltip";

export interface TooltipProps extends Omit<RootProps, "content"> {
  showArrow?: boolean;
  portalled?: boolean;
  portalRef?: HTMLElement | undefined;
  children: JSX.Element | undefined;
  content: JSX.Element | string;
  contentProps?: ContentProps;
  disabled?: boolean;
}

export const Tooltip = (props: TooltipProps) => {
  const [local, rootProps] = splitProps(props, [
    "showArrow",
    "children",
    "disabled",
    "portalled",
    "content",
    "contentProps",
    "portalRef",
  ]);

  const portalled = () => local.portalled ?? true;

  return (
    <Show when={!local.disabled} fallback={local.children}>
      <Root {...rootProps}>
        <Trigger
          asChild={(triggerProps) => (
            <span {...triggerProps()}>{local.children}</span>
          )}
        />
        <Show
          when={portalled()}
          fallback={
            <Positioner>
              <Content {...local.contentProps}>
                <Show when={local.showArrow}>
                  <Arrow>
                    <ArrowTip />
                  </Arrow>
                </Show>
                {local.content}
              </Content>
            </Positioner>
          }
        >
          <Portal mount={local.portalRef}>
            <Positioner>
              <Content {...local.contentProps}>
                <Show when={local.showArrow}>
                  <Arrow>
                    <ArrowTip />
                  </Arrow>
                </Show>
                {local.content}
              </Content>
            </Positioner>
          </Portal>
        </Show>
      </Root>
    </Show>
  );
};

export interface TooltipDemoProps {
  variantProps?: Record<string, string>;
}

const tooltipPlacements = [
  "top-start",
  "top",
  "top-end",
  "left",
  "right",
  "bottom-start",
  "bottom",
  "bottom-end",
] as const;
const tooltipDelayPresets = [
  { label: "instant", openDelay: 0, closeDelay: 0 },
  { label: "fast", openDelay: 150, closeDelay: 100 },
  { label: "slow", openDelay: 600, closeDelay: 250 },
] as const;
const placementGrid: Array<Array<(typeof tooltipPlacements)[number] | null>> = [
  ["top-start", "top", "top-end"],
  ["left", null, "right"],
  ["bottom-start", "bottom", "bottom-end"],
];

export const TooltipDemo = (props: TooltipDemoProps) => {
  const [selectedPlacement, setSelectedPlacement] =
    createSignal<(typeof tooltipPlacements)[number]>("top");
  const [selectedDelayLabel, setSelectedDelayLabel] =
    createSignal<(typeof tooltipDelayPresets)[number]["label"]>("fast");
  const [showArrow, setShowArrow] = createSignal(true);
  const [isInteractive, setIsInteractive] = createSignal(false);
  const [isDisabled, setIsDisabled] = createSignal(false);
  const [useOffset, setUseOffset] = createSignal(false);
  const [isPortalled, setIsPortalled] = createSignal(false);
  const [isControlledOpen, setIsControlledOpen] = createSignal(false);

  const selectedDelayPreset = createMemo(
    () =>
      tooltipDelayPresets.find(
        (preset) => preset.label === selectedDelayLabel(),
      ) ?? tooltipDelayPresets[1],
  );

  return (
    <HStack alignItems="start" gap="6" flexWrap="wrap" width="full" maxW="6xl">
      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">
          Playground
        </Box>
        <Box textStyle="xs" color="fg.muted">
          Mix placement, delays, and behavior flags.
        </Box>
        <VStack alignItems="start" gap="2">
          <Box textStyle="xs" color="fg.muted">
            Placement map
          </Box>
          <Box
            display="grid"
            gridTemplateColumns="repeat(3, max-content)"
            gap="1.5"
            alignItems="center"
          >
            <For each={placementGrid}>
              {(row) => (
                <For each={row}>
                  {(placement) => (
                    <Show
                      when={placement}
                      fallback={<Box width="40" height="9" />}
                    >
                      {(value) => (
                        <Tooltip
                          {...(props.variantProps ?? {})}
                          content={
                            isInteractive() ? (
                              <VStack alignItems="start" gap="1" maxW="56">
                                <Box fontWeight="semibold">
                                  {value()} placement
                                </Box>
                                <Box textStyle="xs">
                                  Pointer can move into this content without
                                  closing immediately.
                                </Box>
                              </VStack>
                            ) : (
                              `${value()} placement`
                            )
                          }
                          showArrow={showArrow()}
                          interactive={isInteractive()}
                          disabled={isDisabled()}
                          portalled={isPortalled()}
                          positioning={{
                            placement: value(),
                            offset: useOffset()
                              ? { mainAxis: 10, crossAxis: 10 }
                              : undefined,
                          }}
                          openDelay={selectedDelayPreset().openDelay}
                          closeDelay={selectedDelayPreset().closeDelay}
                        >
                          <DemoButton
                            size="2xs"
                            variant={
                              selectedPlacement() === value()
                                ? "solid"
                                : "outline"
                            }
                            onClick={() => setSelectedPlacement(value())}
                            onMouseEnter={() => setSelectedPlacement(value())}
                            onFocus={() => setSelectedPlacement(value())}
                          >
                            {value()}
                          </DemoButton>
                        </Tooltip>
                      )}
                    </Show>
                  )}
                </For>
              )}
            </For>
          </Box>
        </VStack>
        <HStack gap="1" flexWrap="wrap">
          <For each={tooltipDelayPresets}>
            {(preset) => (
              <DemoButton
                size="2xs"
                variant={
                  selectedDelayLabel() === preset.label ? "solid" : "outline"
                }
                onClick={() => setSelectedDelayLabel(preset.label)}
              >
                {preset.label}
              </DemoButton>
            )}
          </For>
        </HStack>
        <HStack gap="1" flexWrap="wrap">
          <DemoButton
            size="2xs"
            variant={showArrow() ? "solid" : "outline"}
            onClick={() => setShowArrow((value) => !value)}
          >
            arrow {showArrow() ? "on" : "off"}
          </DemoButton>
          <DemoButton
            size="2xs"
            variant={isInteractive() ? "solid" : "outline"}
            onClick={() => setIsInteractive((value) => !value)}
          >
            interactive {isInteractive() ? "on" : "off"}
          </DemoButton>
          <DemoButton
            size="2xs"
            variant={useOffset() ? "solid" : "outline"}
            onClick={() => setUseOffset((value) => !value)}
          >
            offset {useOffset() ? "on" : "off"}
          </DemoButton>
          <DemoButton
            size="2xs"
            variant={isPortalled() ? "solid" : "outline"}
            onClick={() => setIsPortalled((value) => !value)}
          >
            portalled {isPortalled() ? "on" : "off"}
          </DemoButton>
          <DemoButton
            size="2xs"
            variant={isDisabled() ? "solid" : "outline"}
            onClick={() => setIsDisabled((value) => !value)}
          >
            disabled {isDisabled() ? "on" : "off"}
          </DemoButton>
        </HStack>
      </VStack>

      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">
          Controlled
        </Box>
        <Box textStyle="xs" color="fg.muted">
          Use explicit `open` state with `onOpenChange`.
        </Box>
        <HStack gap="2">
          <DemoButton
            size="xs"
            variant={isControlledOpen() ? "solid" : "outline"}
            onClick={() => setIsControlledOpen((open) => !open)}
          >
            {isControlledOpen() ? "Hide" : "Show"}
          </DemoButton>
          <Tooltip
            {...(props.variantProps ?? {})}
            content="Controlled tooltip preview"
            open={isControlledOpen()}
            onOpenChange={(event) => setIsControlledOpen(event.open)}
            showArrow
            portalled={false}
            positioning={{ placement: "right" }}
          >
            <DemoButton size="sm" variant="outline">
              Controlled Target
            </DemoButton>
          </Tooltip>
        </HStack>
      </VStack>
    </HStack>
  );
};
