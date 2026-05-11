import { Dialog, useDialogContext } from "@ark-ui/solid/dialog";
import { ark } from "@ark-ui/solid/factory";
import { For, createSignal, type ComponentProps } from "solid-js";
import { Portal } from "solid-js/web";
import {
  Box,
  HStack,
  VStack,
  createStyleContext,
  styled,
} from "styled-system/jsx";
import { dialog } from "styled-system/recipes";
import { Button as DemoButton } from "./button";
import { CloseButton } from "./close-button";
import * as Field from "./field";
import { Input } from "./input";

const { withRootProvider, withContext } = createStyleContext(dialog);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withRootProvider(Dialog.Root, {
  defaultProps: () => ({ unmountOnExit: true, lazyMount: true }),
});
export const RootProvider = withRootProvider(Dialog.RootProvider, {
  defaultProps: () => ({ unmountOnExit: true, lazyMount: true }),
});
export const Backdrop = withContext(Dialog.Backdrop, "backdrop");
export const CloseTrigger = withContext(Dialog.CloseTrigger, "closeTrigger");
export const Content = withContext(Dialog.Content, "content");
export const Description = withContext(Dialog.Description, "description");
export const Positioner = withContext(Dialog.Positioner, "positioner");
export const Title = withContext(Dialog.Title, "title");
export const Trigger = withContext(Dialog.Trigger, "trigger");
export const Body = withContext(ark.div, "body");
export const Header = withContext(ark.div, "header");
export const Footer = withContext(ark.div, "footer");

const StyledButton = styled(ark.button);

export const ActionTrigger = (props: ComponentProps<typeof StyledButton>) => {
  const dialog = useDialogContext();

  return <StyledButton {...props} onClick={() => dialog().setOpen(false)} />;
};

export { DialogContext as Context } from "@ark-ui/solid/dialog";

export interface DialogDemoProps {
  variantProps?: Record<string, string>;
}

const dialogSizes = ["xs", "sm", "md", "lg", "xl", "full"] as const;
const dialogPlacements = ["top", "center", "bottom"] as const;

export const DialogDemo = (props: DialogDemoProps) => {
  const [isControlledOpen, setIsControlledOpen] = createSignal(false);
  const [selectedSize, setSelectedSize] =
    createSignal<(typeof dialogSizes)[number]>("md");
  const [selectedPlacement, setSelectedPlacement] =
    createSignal<(typeof dialogPlacements)[number]>("center");
  const baseVariantProps = () => {
    const source = props.variantProps ?? {};
    const { size: _size, placement: _placement, ...rest } = source;
    return rest;
  };

  let initialFocusInput: HTMLInputElement | undefined;

  return (
    <HStack alignItems="start" gap="6" flexWrap="wrap" width="full" maxW="6xl">
      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">
          Basic
        </Box>
        <Box textStyle="xs" color="fg.muted">
          Choose size and placement, then open the dialog with that config.
        </Box>
        <HStack gap="1" flexWrap="wrap">
          <For each={dialogSizes}>
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
          <For each={dialogPlacements}>
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
        <Root
          {...baseVariantProps()}
          size={selectedSize()}
          placement={selectedPlacement()}
          unmountOnExit
        >
          <Trigger
            asChild={(triggerProps) => (
              <DemoButton style={{ width: "auto" }} {...triggerProps()}>
                Open {selectedSize()} / {selectedPlacement()}
              </DemoButton>
            )}
          />
          <Portal>
            <Backdrop />
            <Positioner>
              <Content>
                <Header>
                  <Title>Title</Title>
                  <Description>
                    Size: {selectedSize()} | Placement: {selectedPlacement()}
                  </Description>
                </Header>
                <Body minH="24" gap="3">
                  <Box textStyle="xs" color="fg.muted">
                    In-dialog controls
                  </Box>
                  <HStack gap="1" flexWrap="wrap">
                    <For each={dialogSizes}>
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
                    <For each={dialogPlacements}>
                      {(placement) => (
                        <DemoButton
                          size="2xs"
                          variant={
                            selectedPlacement() === placement ? "solid" : "outline"
                          }
                          onClick={() => setSelectedPlacement(placement)}
                        >
                          {placement}
                        </DemoButton>
                      )}
                    </For>
                  </HStack>
                  <Box>Dialog body content.</Box>
                </Body>
                <Footer>
                  <ActionTrigger
                    asChild={(triggerProps) => (
                      <DemoButton variant="outline" {...triggerProps()}>
                        Cancel
                      </DemoButton>
                    )}
                  />
                  <ActionTrigger
                    asChild={(triggerProps) => (
                      <DemoButton {...triggerProps()}>Save</DemoButton>
                    )}
                  />
                </Footer>
                <CloseTrigger
                  asChild={(triggerProps) => (
                    <CloseButton {...triggerProps()} />
                  )}
                />
              </Content>
            </Positioner>
          </Portal>
        </Root>
      </VStack>

      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">
          Controlled
        </Box>
        <Box textStyle="xs" color="fg.muted">
          Uses `open` and `onOpenChange` to control dialog visibility.
        </Box>
        <Root
          {...baseVariantProps()}
          open={isControlledOpen()}
          onOpenChange={(event) => setIsControlledOpen(event.open)}
        >
          <Trigger
            asChild={(triggerProps) => (
              <DemoButton
                variant="outline"
                style={{ width: "auto" }}
                {...triggerProps()}
              >
                Open Dialog
              </DemoButton>
            )}
          />
          <Portal>
            <Backdrop />
            <Positioner>
              <Content>
                <Header>
                  <Title>Controlled Dialog</Title>
                  <Description>
                    State is managed externally by the demo.
                  </Description>
                </Header>
                <Body>Close from any action to update controlled state.</Body>
                <Footer>
                  <ActionTrigger
                    asChild={(triggerProps) => (
                      <DemoButton variant="outline" {...triggerProps()}>
                        Cancel
                      </DemoButton>
                    )}
                  />
                  <ActionTrigger
                    asChild={(triggerProps) => (
                      <DemoButton {...triggerProps()}>Confirm</DemoButton>
                    )}
                  />
                </Footer>
                <CloseTrigger
                  asChild={(triggerProps) => (
                    <CloseButton {...triggerProps()} />
                  )}
                />
              </Content>
            </Positioner>
          </Portal>
        </Root>
      </VStack>

      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">
          Initial Focus
        </Box>
        <Box textStyle="xs" color="fg.muted">
          Focus moves to a target field on open via `initialFocusEl`.
        </Box>
        <Root
          {...baseVariantProps()}
          initialFocusEl={() => initialFocusInput ?? null}
        >
          <Trigger
            asChild={(triggerProps) => (
              <DemoButton
                variant="outline"
                style={{ width: "auto" }}
                {...triggerProps()}
              >
                Open Dialog
              </DemoButton>
            )}
          />
          <Portal>
            <Backdrop />
            <Positioner>
              <Content>
                <Header>
                  <Title>Profile</Title>
                  <Description>Focus should land on last name.</Description>
                </Header>
                <Body gap="4">
                  <Field.Root>
                    <Field.Label>First Name</Field.Label>
                    <Input placeholder="First Name" />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Last Name</Field.Label>
                    <Input ref={initialFocusInput} placeholder="Last Name" />
                  </Field.Root>
                </Body>
                <Footer>
                  <ActionTrigger
                    asChild={(triggerProps) => (
                      <DemoButton variant="outline" {...triggerProps()}>
                        Cancel
                      </DemoButton>
                    )}
                  />
                  <ActionTrigger
                    asChild={(triggerProps) => (
                      <DemoButton {...triggerProps()}>Save</DemoButton>
                    )}
                  />
                </Footer>
                <CloseTrigger
                  asChild={(triggerProps) => (
                    <CloseButton {...triggerProps()} />
                  )}
                />
              </Content>
            </Positioner>
          </Portal>
        </Root>
      </VStack>

      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">
          Alert Dialog
        </Box>
        <Box textStyle="xs" color="fg.muted">
          Uses `role=&quot;alertdialog&quot;` for destructive confirmations.
        </Box>
        <Root {...baseVariantProps()} role="alertdialog">
          <Trigger
            asChild={(triggerProps) => (
              <DemoButton
                variant="outline"
                style={{ width: "auto" }}
                {...triggerProps()}
              >
                Open Dialog
              </DemoButton>
            )}
          />
          <Portal>
            <Backdrop />
            <Positioner>
              <Content>
                <Header>
                  <Title>Are you sure?</Title>
                  <Description>
                    This action cannot be undone and will permanently remove
                    data.
                  </Description>
                </Header>
                <Footer>
                  <ActionTrigger
                    asChild={(triggerProps) => (
                      <DemoButton
                        colorPalette="gray"
                        variant="outline"
                        {...triggerProps()}
                      >
                        Cancel
                      </DemoButton>
                    )}
                  />
                  <ActionTrigger
                    asChild={(triggerProps) => (
                      <DemoButton colorPalette="red" {...triggerProps()}>
                        Delete
                      </DemoButton>
                    )}
                  />
                </Footer>
                <CloseTrigger
                  asChild={(triggerProps) => (
                    <CloseButton {...triggerProps()} />
                  )}
                />
              </Content>
            </Positioner>
          </Portal>
        </Root>
      </VStack>

      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">
          Nested
        </Box>
        <Box textStyle="xs" color="fg.muted">
          Opens a secondary dialog from inside a primary dialog.
        </Box>
        <Root {...baseVariantProps()}>
          <Trigger
            asChild={(triggerProps) => (
              <DemoButton
                variant="outline"
                style={{ width: "auto" }}
                {...triggerProps()}
              >
                Open Parent
              </DemoButton>
            )}
          />
          <Portal>
            <Backdrop />
            <Positioner>
              <Content>
                <Header>
                  <Title>Parent Dialog</Title>
                  <Description>
                    Open a nested dialog from the footer action.
                  </Description>
                </Header>
                <Footer>
                  <Root size="sm">
                    <Trigger
                      asChild={(triggerProps) => (
                        <DemoButton
                          style={{ width: "auto" }}
                          {...triggerProps()}
                        >
                          Open Nested
                        </DemoButton>
                      )}
                    />
                    <Portal>
                      <Backdrop />
                      <Positioner>
                        <Content>
                          <Header>
                            <Title>Nested Dialog</Title>
                            <Description>
                              Secondary modal in the same flow.
                            </Description>
                          </Header>
                          <CloseTrigger
                            asChild={(triggerProps) => (
                              <CloseButton {...triggerProps()} />
                            )}
                          />
                        </Content>
                      </Positioner>
                    </Portal>
                  </Root>
                </Footer>
                <CloseTrigger
                  asChild={(triggerProps) => (
                    <CloseButton {...triggerProps()} />
                  )}
                />
              </Content>
            </Positioner>
          </Portal>
        </Root>
      </VStack>

      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">
          Non-Modal
        </Box>
        <Box textStyle="xs" color="fg.muted">
          Demonstrates non-modal behavior with outside interaction enabled.
        </Box>
        <Root
          {...baseVariantProps()}
          modal={false}
          closeOnInteractOutside={false}
        >
          <Trigger
            asChild={(triggerProps) => (
              <DemoButton
                variant="outline"
                style={{ width: "auto" }}
                {...triggerProps()}
              >
                Open Non-Modal
              </DemoButton>
            )}
          />
          <Portal>
            <Positioner pointerEvents="none">
              <Content>
                <Header>
                  <Title>Non-Modal Dialog</Title>
                  <Description>
                    Background remains interactive while open.
                  </Description>
                </Header>
                <Footer>
                  <ActionTrigger
                    asChild={(triggerProps) => (
                      <DemoButton variant="outline" {...triggerProps()}>
                        Close
                      </DemoButton>
                    )}
                  />
                </Footer>
                <CloseTrigger
                  asChild={(triggerProps) => (
                    <CloseButton {...triggerProps()} />
                  )}
                />
              </Content>
            </Positioner>
          </Portal>
        </Root>
      </VStack>
    </HStack>
  );
};
