import { Dialog } from "@ark-ui/solid/dialog";
import { ark } from "@ark-ui/solid/factory";
import { For, createSignal, type ComponentProps } from "solid-js";
import { Box, HStack, VStack, createStyleContext } from "styled-system/jsx";
import { drawer } from "styled-system/recipes";
import { Button as DemoButton } from "./button";
import { CloseButton } from "./close-button";

const { withRootProvider, withContext } = createStyleContext(drawer);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withRootProvider(Dialog.Root, {
  defaultProps: () => ({ unmountOnExit: true, lazyMount: true }),
});
export const RootProvider = withRootProvider(Dialog.Root, {
  defaultProps: () => ({ unmountOnExit: true, lazyMount: true }),
});
export const Backdrop = withContext(Dialog.Backdrop, "backdrop");
export const Positioner = withContext(Dialog.Positioner, "positioner");
export const CloseTrigger = withContext(Dialog.CloseTrigger, "closeTrigger");
export const Content = withContext(Dialog.Content, "content");
export const Description = withContext(Dialog.Description, "description");
export const Title = withContext(Dialog.Title, "title");
export const Trigger = withContext(Dialog.Trigger, "trigger");

export const Body = withContext(ark.div, "body");
export const Header = withContext(ark.div, "header");
export const Footer = withContext(ark.div, "footer");

export { DialogContext as Context } from "@ark-ui/solid/dialog";

export interface DrawerDemoProps {
  variantProps?: Record<string, string>;
}

const drawerSizes = ["xs", "sm", "md", "lg", "xl", "full"] as const;
const drawerPlacements = ["start", "end", "top", "bottom"] as const;

export const DrawerDemo = (props: DrawerDemoProps) => {
  const [selectedSize, setSelectedSize] =
    createSignal<(typeof drawerSizes)[number]>("sm");
  const [selectedPlacement, setSelectedPlacement] =
    createSignal<(typeof drawerPlacements)[number]>("end");
  const [isModal, setIsModal] = createSignal(true);
  const [hasBackdrop, setHasBackdrop] = createSignal(true);

  const baseVariantProps = () => {
    const source = props.variantProps ?? {};
    const { size: _size, placement: _placement, ...rest } = source;
    return rest;
  };

  return (
    <HStack alignItems="start" gap="6" flexWrap="wrap" width="full" maxW="6xl">
      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">
          Playground
        </Box>
        <Box textStyle="xs" color="fg.muted">
          Tune size, placement, and modal behavior from one curated preview.
        </Box>
        <HStack gap="1" flexWrap="wrap">
          <For each={drawerSizes}>
            {(size) => (
              <DemoButton
                size="2xs"
                variant={selectedSize() === size ? "solid" : "outline"}
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </DemoButton>
            )}
          </For>
        </HStack>
        <HStack gap="1" flexWrap="wrap">
          <For each={drawerPlacements}>
            {(placement) => (
              <DemoButton
                size="2xs"
                variant={selectedPlacement() === placement ? "solid" : "outline"}
                onClick={() => setSelectedPlacement(placement)}
              >
                {placement}
              </DemoButton>
            )}
          </For>
        </HStack>
        <HStack gap="1" flexWrap="wrap">
          <DemoButton
            size="2xs"
            variant={isModal() ? "solid" : "outline"}
            onClick={() => setIsModal((value) => !value)}
          >
            modal {isModal() ? "on" : "off"}
          </DemoButton>
          <DemoButton
            size="2xs"
            variant={hasBackdrop() ? "solid" : "outline"}
            onClick={() => setHasBackdrop((value) => !value)}
          >
            backdrop {hasBackdrop() ? "on" : "off"}
          </DemoButton>
        </HStack>
        <Root
          {...baseVariantProps()}
          size={selectedSize()}
          placement={selectedPlacement()}
          modal={isModal()}
        >
          <Trigger
            asChild={(triggerProps) => (
              <DemoButton {...triggerProps()}>Open Drawer</DemoButton>
            )}
          />
          <Positioner>
            <Backdrop
              display={hasBackdrop() ? undefined : "none"}
              pointerEvents={hasBackdrop() ? undefined : "none"}
            />
            <Content>
              <Header>
                <Title>Drawer Title</Title>
                <Description>
                  {selectedSize()} / {selectedPlacement()} preview
                </Description>
              </Header>
              <Body>
                <Description>
                  Curated example with runtime controls instead of a giant grid.
                </Description>
              </Body>
              <Footer>
                <CloseTrigger
                  asChild={(closeProps) => (
                    <DemoButton variant="outline" {...closeProps()}>
                      Cancel
                    </DemoButton>
                  )}
                />
                <CloseTrigger
                  asChild={(closeProps) => (
                    <DemoButton {...closeProps()}>Save</DemoButton>
                  )}
                />
              </Footer>
              <CloseTrigger
                asChild={(closeProps) => <CloseButton {...closeProps()} />}
              />
            </Content>
          </Positioner>
        </Root>
      </VStack>
    </HStack>
  );
};
