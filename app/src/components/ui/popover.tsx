import { ark } from "@ark-ui/solid/factory";
import { Popover } from "@ark-ui/solid/popover";
import { createSignal, type ComponentProps } from "solid-js";
import { Portal } from "solid-js/web";
import { Box, HStack, VStack, createStyleContext } from "styled-system/jsx";
import { popover } from "styled-system/recipes";
import { Button as DemoButton } from "./button";
import { CloseButton } from "./close-button";
import * as Dialog from "./dialog";
import * as Field from "./field";
import { Input } from "./input";
import { Textarea } from "./textarea";

const { withRootProvider, withContext } = createStyleContext(popover);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withRootProvider(Popover.Root, {
  defaultProps: () => ({ unmountOnExit: true, lazyMount: true }),
});
export const RootProvider = withRootProvider(Popover.Root, {
  defaultProps: () => ({ unmountOnExit: true, lazyMount: true }),
});
export const Anchor = withContext(Popover.Anchor, "anchor");
export const ArrowTip = withContext(Popover.ArrowTip, "arrowTip");
export const Arrow = withContext(Popover.Arrow, "arrow", {
  defaultProps: () => ({ children: <ArrowTip /> }),
});
export const CloseTrigger = withContext(Popover.CloseTrigger, "closeTrigger");
export const Content = withContext(Popover.Content, "content");
export const Description = withContext(Popover.Description, "description");
export const Indicator = withContext(Popover.Indicator, "indicator");
export const Positioner = withContext(Popover.Positioner, "positioner");
export const Title = withContext(Popover.Title, "title");
export const Trigger = withContext(Popover.Trigger, "trigger");

export const Body = withContext(ark.div, "body");
export const Header = withContext(ark.div, "header");
export const Footer = withContext(ark.div, "footer");

export { PopoverContext as Context } from "@ark-ui/solid/popover";

export interface PopoverDemoProps {
  variantProps?: Record<string, string>;
}

export const PopoverDemo = (props: PopoverDemoProps) => {
  const [isControlledOpen, setIsControlledOpen] = createSignal(false);
  let initialFocusTextarea: HTMLTextAreaElement | undefined;

  const renderBasePanelContent = () => (
    <>
      <Arrow />
      <Body>
        <Title>Title</Title>
        <Description>Description</Description>
      </Body>
      <CloseTrigger asChild={(triggerProps) => <CloseButton {...triggerProps()} />} />
    </>
  );

  return (
    <HStack alignItems="start" gap="6" flexWrap="wrap" width="full" maxW="6xl">
      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">Basic</Box>
        <Box textStyle="xs" color="fg.muted">
          Default popover with title, description, arrow, and close trigger.
        </Box>
        <Root {...(props.variantProps ?? {})}>
          <Trigger
            asChild={(triggerProps) => (
              <DemoButton style={{ width: "auto" }} {...triggerProps()}>
                Open Popover
              </DemoButton>
            )}
          />
          <Portal>
            <Positioner>
              <Content>{renderBasePanelContent()}</Content>
            </Positioner>
          </Portal>
        </Root>
      </VStack>

      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">Controlled</Box>
        <Box textStyle="xs" color="fg.muted">
          Uses `open` and `onOpenChange` to manage visibility state.
        </Box>
        <Root
          {...(props.variantProps ?? {})}
          open={isControlledOpen()}
          onOpenChange={(event) => setIsControlledOpen(event.open)}
        >
          <Trigger
            asChild={(triggerProps) => (
              <DemoButton variant="outline" style={{ width: "auto" }} {...triggerProps()}>
                Open Popover
              </DemoButton>
            )}
          />
          <Portal>
            <Positioner>
              <Content>{renderBasePanelContent()}</Content>
            </Positioner>
          </Portal>
        </Root>
      </VStack>

      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">Lazy Mount</Box>
        <Box textStyle="xs" color="fg.muted">
          Content mounts only when opened (`lazyMount` + `unmountOnExit`).
        </Box>
        <Root {...(props.variantProps ?? {})} lazyMount unmountOnExit>
          <Trigger
            asChild={(triggerProps) => (
              <DemoButton variant="outline" style={{ width: "auto" }} {...triggerProps()}>
                Open Popover
              </DemoButton>
            )}
          />
          <Portal>
            <Positioner>
              <Content>{renderBasePanelContent()}</Content>
            </Positioner>
          </Portal>
        </Root>
      </VStack>

      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">Placement</Box>
        <Box textStyle="xs" color="fg.muted">
          Sets `positioning.placement` to render the popover on the right.
        </Box>
        <Root {...(props.variantProps ?? {})} positioning={{ placement: "right" }}>
          <Trigger
            asChild={(triggerProps) => (
              <DemoButton variant="outline" style={{ width: "auto" }} {...triggerProps()}>
                Open Popover
              </DemoButton>
            )}
          />
          <Portal>
            <Positioner>
              <Content>{renderBasePanelContent()}</Content>
            </Positioner>
          </Portal>
        </Root>
      </VStack>

      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">Offset</Box>
        <Box textStyle="xs" color="fg.muted">
          Uses explicit `positioning.offset` values for placement fine-tuning.
        </Box>
        <Root
          {...(props.variantProps ?? {})}
          positioning={{ offset: { crossAxis: 0, mainAxis: 0 } }}
        >
          <Trigger
            asChild={(triggerProps) => (
              <DemoButton variant="outline" style={{ width: "auto" }} {...triggerProps()}>
                Open Popover
              </DemoButton>
            )}
          />
          <Portal>
            <Positioner>
              <Content>
                <Body>
                  <Title>Title</Title>
                  <Description>Description</Description>
                </Body>
                <CloseTrigger
                  asChild={(triggerProps) => <CloseButton {...triggerProps()} />}
                />
              </Content>
            </Positioner>
          </Portal>
        </Root>
      </VStack>

      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">Same Width</Box>
        <Box textStyle="xs" color="fg.muted">
          Uses `positioning.sameWidth` so panel width matches the trigger width.
        </Box>
        <Root {...(props.variantProps ?? {})} positioning={{ sameWidth: true }}>
          <Trigger
            asChild={(triggerProps) => (
              <DemoButton
                variant="outline"
                minW="12rem"
                style={{ width: "auto" }}
                {...triggerProps()}
              >
                Open Popover
              </DemoButton>
            )}
          />
          <Portal>
            <Positioner>
              <Content width="auto">{renderBasePanelContent()}</Content>
            </Positioner>
          </Portal>
        </Root>
      </VStack>

      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">Nested</Box>
        <Box textStyle="xs" color="fg.muted">
          Demonstrates a popover opened from inside another popover.
        </Box>
        <Root {...(props.variantProps ?? {})}>
          <Trigger
            asChild={(triggerProps) => (
              <DemoButton variant="outline" style={{ width: "auto" }} {...triggerProps()}>
                Open Popover
              </DemoButton>
            )}
          />
          <Portal>
            <Positioner>
              <Content>
                <Arrow />
                <Body>
                  <Title>Title</Title>
                  <Description>Description</Description>
                </Body>
                <Footer>
                  <Root>
                    <Trigger
                      asChild={(triggerProps) => (
                        <DemoButton
                          variant="outline"
                          size="sm"
                          style={{ width: "auto" }}
                          {...triggerProps()}
                        >
                          Open Nested Popover
                        </DemoButton>
                      )}
                    />
                    <Positioner>
                      <Content>
                        <Arrow />
                        <Body>
                          <Title>Title</Title>
                          <Description>Description</Description>
                        </Body>
                      </Content>
                    </Positioner>
                  </Root>
                </Footer>
                <CloseTrigger
                  asChild={(triggerProps) => <CloseButton {...triggerProps()} />}
                />
              </Content>
            </Positioner>
          </Portal>
        </Root>
      </VStack>

      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">Form</Box>
        <Box textStyle="xs" color="fg.muted">
          Shows form fields and footer actions rendered inside popover content.
        </Box>
        <Root {...(props.variantProps ?? {})}>
          <Trigger
            asChild={(triggerProps) => (
              <DemoButton variant="outline" style={{ width: "auto" }} {...triggerProps()}>
                Open Popover
              </DemoButton>
            )}
          />
          <Portal>
            <Positioner>
              <Content>
                <Arrow />
                <Header>
                  <Title>Report an issue</Title>
                  <Description>Please fill out the form below.</Description>
                </Header>
                <Body gap="4">
                  <Field.Root>
                    <Field.Label>Title</Field.Label>
                    <Input placeholder="A descriptive title" />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Description</Field.Label>
                    <Textarea placeholder="Describe the issue" />
                  </Field.Root>
                </Body>
                <Footer>
                  <DemoButton width="full">Save</DemoButton>
                </Footer>
                <CloseTrigger
                  asChild={(triggerProps) => <CloseButton {...triggerProps()} />}
                />
              </Content>
            </Positioner>
          </Portal>
        </Root>
      </VStack>

      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">Initial Focus</Box>
        <Box textStyle="xs" color="fg.muted">
          Sets `initialFocusEl` so focus lands on the textarea when opened.
        </Box>
        <Root
          {...(props.variantProps ?? {})}
          initialFocusEl={() => initialFocusTextarea ?? null}
        >
          <Trigger
            asChild={(triggerProps) => (
              <DemoButton variant="outline" style={{ width: "auto" }} {...triggerProps()}>
                Open Popover
              </DemoButton>
            )}
          />
          <Portal>
            <Positioner>
              <Content>
                <Arrow />
                <Header>
                  <Title>Report an issue</Title>
                  <Description>Please fill out the form below.</Description>
                </Header>
                <Body gap="4">
                  <Field.Root>
                    <Field.Label>Title</Field.Label>
                    <Input placeholder="A descriptive title" />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Description</Field.Label>
                    <Textarea
                      ref={initialFocusTextarea}
                      placeholder="Describe the issue"
                    />
                  </Field.Root>
                </Body>
                <Footer>
                  <DemoButton width="full">Save</DemoButton>
                </Footer>
                <CloseTrigger
                  asChild={(triggerProps) => <CloseButton {...triggerProps()} />}
                />
              </Content>
            </Positioner>
          </Portal>
        </Root>
      </VStack>

      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">Custom Background</Box>
        <Box textStyle="xs" color="fg.muted">
          Applies `--popover-bg` to customize content and arrow background.
        </Box>
        <Root {...(props.variantProps ?? {})}>
          <Trigger
            asChild={(triggerProps) => (
              <DemoButton variant="outline" style={{ width: "auto" }} {...triggerProps()}>
                Open Popover
              </DemoButton>
            )}
          />
          <Portal>
            <Positioner>
              <Content style={{ "--popover-bg": "lightblue" }}>
                {renderBasePanelContent()}
              </Content>
            </Positioner>
          </Portal>
        </Root>
      </VStack>

      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">Within Dialog</Box>
        <Box textStyle="xs" color="fg.muted">
          Uses popover inside dialog with fixed strategy and detached hiding.
        </Box>
        <Dialog.Root scrollBehavior="inside">
          <Dialog.Trigger
            asChild={(triggerProps) => (
              <DemoButton variant="outline" style={{ width: "auto" }} {...triggerProps()}>
                Open Dialog
              </DemoButton>
            )}
          />
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.CloseTrigger
                  asChild={(triggerProps) => <CloseButton {...triggerProps()} />}
                />
                <Dialog.Header>
                  <Dialog.Title>Popover in Dialog</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  This popover is inside a dialog. Open the popover from the footer.
                </Dialog.Body>
                <Dialog.Footer>
                  <Dialog.ActionTrigger
                    asChild={(triggerProps) => (
                      <DemoButton variant="outline" {...triggerProps()}>
                        Close
                      </DemoButton>
                    )}
                  />
                  <Root
                    positioning={{ strategy: "fixed", hideWhenDetached: true }}
                  >
                    <Trigger
                      asChild={(triggerProps) => (
                        <DemoButton style={{ width: "auto" }} {...triggerProps()}>
                          Open Popover
                        </DemoButton>
                      )}
                    />
                    <Positioner>
                      <Content>{renderBasePanelContent()}</Content>
                    </Positioner>
                  </Root>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      </VStack>
    </HStack>
  );
};
