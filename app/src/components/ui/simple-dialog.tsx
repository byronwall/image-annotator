import { Show, createSignal, type JSX } from "solid-js";
import { Portal } from "solid-js/web";
import { css } from "styled-system/css";
import { Box, HStack, VStack } from "styled-system/jsx";
import * as Dialog from "./dialog";
import { WrapWhen } from "./WrapWhen";
import { CloseButton } from "./close-button";
import { Button } from "./button";
import * as Field from "./field";
import { Input } from "./input";

type SimpleDialogProps = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  title?: string;
  description?: string;
  header?: JSX.Element;
  footer?: JSX.Element;
  children?: JSX.Element;
  maxW?: string;
  contentClass?: string;
  showClose?: boolean;
  closeLabel?: string;
  skipPortal?: boolean;
  initialFocusEl?: () => HTMLElement | null;
  restoreFocus?: boolean;
  preventScroll?: boolean;
  scrollBehavior?: "inside" | "outside";
};

export function SimpleDialog(props: SimpleDialogProps) {
  const handleOpenChange = (details: { open?: boolean }) => {
    if (typeof details?.open !== "boolean") return;
    props.onOpenChange?.(details.open);
    if (details.open === false) props.onClose?.();
  };

  const shouldShowClose = () => props.showClose !== false;

  const contentClass = () => {
    const classes: string[] = [];
    const maxW = props.maxW ?? "720px";
    classes.push(
      css({
        maxW,
        "--dialog-base-margin": "24px",
        maxH: "calc(100vh - (var(--dialog-base-margin) * 2))",
        boxSizing: "border-box",
        overflow: "visible",
        display: "flex",
        flexDirection: "column",
        "& .dialog__closeTrigger": {
          top: "12px",
          insetEnd: "12px",
          w: "28px",
          h: "28px",
          minW: "28px",
          minH: "28px",
          borderRadius: "4px",
          boxShadow: "none",
        },
      }),
    );
    if (props.contentClass) classes.push(props.contentClass);
    return classes.join(" ");
  };

  const hasHeader = () =>
    props.header !== undefined || !!props.title || !!props.description;

  const headerContent = () =>
    props.header ?? (
      <>
        <Show when={props.title}>
          {(title) => <Dialog.Title>{title()}</Dialog.Title>}
        </Show>
        <Show when={props.description}>
          {(description) => (
            <Dialog.Description>{description()}</Dialog.Description>
          )}
        </Show>
      </>
    );

  return (
    <Dialog.Root
      open={props.open}
      onOpenChange={handleOpenChange}
      initialFocusEl={props.initialFocusEl}
      restoreFocus={props.restoreFocus}
      preventScroll={props.preventScroll}
      scrollBehavior={props.scrollBehavior}
    >
      <WrapWhen when={props.skipPortal !== true} component={Portal}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content class={contentClass()}>
            <Show when={hasHeader()}>
              <Dialog.Header>{headerContent()}</Dialog.Header>
            </Show>
            <Show when={shouldShowClose()}>
              <Dialog.CloseTrigger
                aria-label={props.closeLabel ?? "Close dialog"}
                asChild={(triggerProps) => (
                  <CloseButton {...triggerProps()} />
                )}
              />
            </Show>
            <Dialog.Body
              class={css({
                flex: "1",
                minH: "0",
                overflowY: "auto",
              })}
            >
              {props.children}
            </Dialog.Body>
            <Show when={props.footer}>
              {(footer) => <Dialog.Footer>{footer()}</Dialog.Footer>}
            </Show>
          </Dialog.Content>
        </Dialog.Positioner>
      </WrapWhen>
    </Dialog.Root>
  );
}

export type SimpleDialogDemoProps = {
  variantProps?: Record<string, string>;
};

export const SimpleDialogDemo = (_props: SimpleDialogDemoProps) => {
  const [basicOpen, setBasicOpen] = createSignal(false);
  const [controlledOpen, setControlledOpen] = createSignal(false);
  const [focusOpen, setFocusOpen] = createSignal(false);
  let focusInput: HTMLInputElement | undefined;

  return (
    <HStack alignItems="start" gap="6" flexWrap="wrap" width="full" maxW="6xl">
      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">
          Basic
        </Box>
        <Button style={{ width: "auto" }} onClick={() => setBasicOpen(true)}>
          Open Dialog
        </Button>
        <SimpleDialog
          open={basicOpen()}
          onOpenChange={setBasicOpen}
          title="Title"
          description="Simple wrapper with title and footer actions."
          footer={
            <HStack>
              <Button variant="outline" onClick={() => setBasicOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setBasicOpen(false)}>Confirm</Button>
            </HStack>
          }
        >
          <Box>Dialog body content.</Box>
        </SimpleDialog>
      </VStack>

      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">
          Controlled
        </Box>
        <Button
          variant="outline"
          style={{ width: "auto" }}
          onClick={() => setControlledOpen(true)}
        >
          Open Dialog
        </Button>
        <SimpleDialog
          open={controlledOpen()}
          onOpenChange={setControlledOpen}
          title="Controlled Dialog"
          description="State is managed externally in the demo."
          onClose={() => setControlledOpen(false)}
          footer={
            <HStack>
              <Button variant="outline" onClick={() => setControlledOpen(false)}>
                Close
              </Button>
            </HStack>
          }
        >
          <Box>Close from any action to sync controlled state.</Box>
        </SimpleDialog>
      </VStack>

      <VStack as="section" alignItems="start" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">
          Initial Focus
        </Box>
        <Button
          variant="outline"
          style={{ width: "auto" }}
          onClick={() => setFocusOpen(true)}
        >
          Open Profile Dialog
        </Button>
        <SimpleDialog
          open={focusOpen()}
          onOpenChange={setFocusOpen}
          title="Profile"
          description="Focus should land on the last-name field."
          initialFocusEl={() => focusInput ?? null}
          footer={
            <HStack>
              <Button variant="outline" onClick={() => setFocusOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setFocusOpen(false)}>Save</Button>
            </HStack>
          }
        >
          <VStack alignItems="stretch" gap="4">
            <Field.Root>
              <Field.Label>First Name</Field.Label>
              <Input placeholder="First Name" />
            </Field.Root>
            <Field.Root>
              <Field.Label>Last Name</Field.Label>
              <Input ref={focusInput} placeholder="Last Name" />
            </Field.Root>
          </VStack>
        </SimpleDialog>
      </VStack>
    </HStack>
  );
};
