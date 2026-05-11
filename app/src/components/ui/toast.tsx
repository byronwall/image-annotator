import {
  Toaster as ArkToaster,
  createToaster,
  Toast,
  useToastContext,
} from "@ark-ui/solid/toast";
import {
  CheckCircleIcon,
  CircleAlertIcon,
  CircleXIcon,
  InfoIcon,
} from "lucide-solid";
import { For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { Box, createStyleContext, HStack, Stack, styled } from "styled-system/jsx";
import { toast } from "styled-system/recipes";
import { CloseButton } from "./close-button";
import { Icon, type IconProps } from "./icon";
import { Spinner } from "./spinner";
import { Button as DemoButton } from "./button";
import { VStack as DemoVStack } from "styled-system/jsx";

const { withProvider, withContext } = createStyleContext(toast);

const Root = withProvider(Toast.Root, "root");
const Title = withContext(Toast.Title, "title");
const Description = withContext(Toast.Description, "description");
const ActionTrigger = withContext(Toast.ActionTrigger, "actionTrigger");
const CloseTrigger = withContext(Toast.CloseTrigger, "closeTrigger");
const StyledToaster = styled(ArkToaster);

const iconMap: Record<string, any> = {
  warning: CircleAlertIcon,
  success: CheckCircleIcon,
  error: CircleXIcon,
  info: InfoIcon,
};

const paletteMap: Record<string, "green" | "red" | "orange" | "blue"> = {
  success: "green",
  error: "red",
  warning: "orange",
  info: "blue",
  loading: "blue",
};

const getToastPalette = (type?: string) => paletteMap[type ?? "info"] ?? "blue";

const Indicator = (props: IconProps) => {
  const toast = useToastContext();
  const StatusIcon = () => iconMap[toast().type];

  return (
    <Show when={StatusIcon()}>
      {(Icon_) => (
        <Icon
          data-type={toast().type}
          color="colorPalette.solid.bg"
          boxSize="6"
          overflow="visible"
          {...props}
        >
          <Icon_ />
        </Icon>
      )}
    </Show>
  );
};

export const toaster = createToaster({
  placement: "bottom-end",
  pauseOnPageIdle: true,
  overlap: true,
  max: 5,
});

export const Toaster = () => {
  return (
    <Portal>
      <StyledToaster toaster={toaster} insetInline={{ mdDown: "4" }}>
        {(toast) => {
          const colorPalette = getToastPalette(toast().type);

          return (
            <Root
              colorPalette={colorPalette}
              bg="gray.surface.bg"
              borderWidth="1px"
              borderColor="border"
              borderInlineStartWidth="2px"
              borderInlineStartColor="colorPalette.solid.bg"
            >
              <Show when={toast().type === "loading"} fallback={<Indicator />}>
                <Spinner color="colorPalette.solid.bg" />
              </Show>

              <Stack gap="3" alignItems="start">
                <Stack gap="1">
                  <Show when={toast().title}>
                    <Title color="colorPalette.solid.bg">{toast().title}</Title>
                  </Show>
                  <Show when={toast().description}>
                    <Description>{toast().description}</Description>
                  </Show>
                </Stack>
                <Show when={toast().action}>
                  {(action) => (
                    <ActionTrigger color="colorPalette.plain.fg">
                      {action().label}
                    </ActionTrigger>
                  )}
                </Show>
              </Stack>
              <Show when={toast().closable}>
                <CloseTrigger>
                  <CloseButton size="sm" />
                </CloseTrigger>
              </Show>
            </Root>
          );
        }}
      </StyledToaster>
    </Portal>
  );
};

export interface ToastDemoProps {
  variantProps?: Record<string, string>;
}

export const ToastDemo = (_props: ToastDemoProps) => {
  const statuses = ["success", "error", "warning", "info"] as const;

  return (
    <DemoVStack alignItems="start" gap="3">
      <Box textStyle="xs" color="fg.muted">
        Try status, action, async, and lifecycle toasts.
      </Box>

      <HStack gap="2" flexWrap="wrap">
        <For each={statuses}>
          {(status) => (
            <DemoButton
              size="xs"
              variant="outline"
              onClick={() =>
                toaster.create({
                  type: status,
                  title: `${status[0].toUpperCase()}${status.slice(1)} toast`,
                  description: "Status-specific feedback example.",
                })
              }
            >
              {status}
            </DemoButton>
          )}
        </For>
      </HStack>

      <HStack gap="2" flexWrap="wrap">
        <DemoButton
          size="xs"
          variant="outline"
          onClick={() =>
            toaster.create({
              title: "File uploaded",
              description: "Your report.pdf has been stored.",
              action: {
                label: "Undo",
                onClick: () =>
                  toaster.info({
                    title: "Upload reverted",
                    description: "The uploaded file was removed.",
                  }),
              },
              closable: true,
            })
          }
        >
          with action
        </DemoButton>

        <DemoButton
          size="xs"
          variant="outline"
          onClick={() => {
            const task = new Promise<void>((resolve) =>
              setTimeout(() => resolve(), 1800),
            );

            toaster.promise(task, {
              loading: {
                title: "Syncing changes...",
                description: "Please wait.",
              },
              success: {
                title: "Sync complete",
                description: "Everything is up to date.",
              },
              error: {
                title: "Sync failed",
                description: "Try again in a moment.",
              },
            });
          }}
        >
          async
        </DemoButton>

        <DemoButton
          size="xs"
          variant="outline"
          onClick={() =>
            toaster.create({
              type: "warning",
              title: "Review required",
              description: "This toast remains longer and is closable.",
              duration: 10000,
              closable: true,
            })
          }
        >
          long + closable
        </DemoButton>

        <DemoButton size="xs" onClick={() => toaster.dismiss()}>
          dismiss all
        </DemoButton>
      </HStack>

      <Toaster />
    </DemoVStack>
  );
};
