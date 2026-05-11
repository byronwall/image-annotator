import { Box, HStack, Stack, VStack } from "styled-system/jsx";
import { Button } from "~/components/ui/button";
import { Code } from "~/components/ui/code";
import { Text } from "~/components/ui/text";

export function ErrorOverlayPlayground() {
  const dispatchWindowError = () => {
    window.dispatchEvent(
      new ErrorEvent("error", {
        message: "Dispatched window.error from playground",
        error: new Error("Dispatched window.error from playground"),
      }),
    );
  };

  const dispatchUnhandledRejection = () => {
    const reason = new Error("Dispatched window.unhandledrejection from playground");

    if (typeof PromiseRejectionEvent !== "undefined") {
      window.dispatchEvent(
        new PromiseRejectionEvent("unhandledrejection", {
          promise: Promise.resolve(),
          reason,
        }),
      );
      return;
    }

    const fallbackEvent = new Event("unhandledrejection");
    Object.defineProperty(fallbackEvent, "reason", { value: reason });
    window.dispatchEvent(fallbackEvent);
  };

  const throwSyncError = () => {
    throw new Error("Synchronous click handler exception");
  };

  const throwUnhandledAsyncException = () => {
    setTimeout(() => {
      throw new Error("Unhandled exception inside setTimeout");
    }, 0);
  };

  const throwUnhandledRejection = () => {
    void Promise.reject(new Error("Unhandled promise rejection"));
  };

  const throwMicrotaskRejection = () => {
    queueMicrotask(() => {
      void Promise.reject(new Error("Unhandled rejection in microtask"));
    });
  };

  const TriggerRow = (props: {
    label: string;
    onClick: () => void;
    colorPalette?: "green" | "red" | "orange" | "pink";
    variant?: "solid" | "outline";
    dev: string;
    prod: string;
  }) => (
    <HStack
      alignItems={{ base: "stretch", md: "center" }}
      justifyContent="space-between"
      gap="3"
      flexWrap="wrap"
      borderWidth="1px"
      borderColor="border"
      borderRadius="l2"
      p="2.5"
      bg="bg.default"
    >
      <Button
        size="sm"
        colorPalette={props.colorPalette}
        variant={props.variant}
        onClick={props.onClick}
      >
        {props.label}
      </Button>
      <VStack alignItems="stretch" gap="0.5" flex="1" minW={{ base: "full", md: "24rem" }}>
        <Text textStyle="xs" color="fg.muted">
          <Code>dev</Code>: {props.dev}
        </Text>
        <Text textStyle="xs" color="fg.muted">
          <Code>prod</Code>: {props.prod}
        </Text>
      </VStack>
    </HStack>
  );

  return (
    <Box>
      <VStack alignItems="stretch" gap="4">
        <Stack gap="1.5">
          <Text textStyle={{ base: "xl", md: "2xl" }} fontWeight="semibold">
            Error Overlay Playground
          </Text>
          <Text textStyle="sm" color="fg.muted">
            Trigger the global overlay using different failure paths.
          </Text>
        </Stack>

        <Box
          borderWidth="1px"
          borderColor="border"
          borderRadius="l2"
          p="3"
          bg="bg.subtle"
        >
          <Text textStyle="sm" color="fg.muted">
            Routes:
            {" "}
            <Code>window.error</Code>
            ,{" "}
            <Code>window.unhandledrejection</Code>
            , and ErrorBoundary fallback.
          </Text>
        </Box>

        <VStack alignItems="stretch" gap="2">
          <Text textStyle="xs" color="fg.subtle" fontWeight="semibold">
            Shows Solid dev overlay (in your current dev setup)
          </Text>
          <TriggerRow
            label="Dispatch window.error (no throw)"
            colorPalette="green"
            onClick={dispatchWindowError}
            dev="Shows Vite/Solid dev overlay and app GlobalErrorOverlay."
            prod="Shows only the app GlobalErrorOverlay."
          />
          <TriggerRow
            label="Throw (sync click handler)"
            colorPalette="red"
            onClick={throwSyncError}
            dev="Vite/Solid dev error overlay appears; app overlay may also appear."
            prod="No Vite overlay; app overlay appears via window error capture."
          />
          <TriggerRow
            label="Unhandled exception (setTimeout)"
            colorPalette="red"
            variant="outline"
            onClick={throwUnhandledAsyncException}
            dev="Vite/Solid dev error overlay appears; app overlay may also appear."
            prod="No Vite overlay; app overlay appears via window error capture."
          />

          <Text textStyle="xs" color="fg.subtle" fontWeight="semibold" pt="2">
            Does not show Solid dev overlay (in your current dev setup)
          </Text>
          <TriggerRow
            label="Dispatch unhandledrejection (no throw)"
            colorPalette="green"
            variant="outline"
            onClick={dispatchUnhandledRejection}
            dev="Shows only the app GlobalErrorOverlay."
            prod="Shows only the app GlobalErrorOverlay."
          />
          <TriggerRow
            label="Unhandled rejection"
            colorPalette="orange"
            variant="outline"
            onClick={throwUnhandledRejection}
            dev="Vite/Solid dev rejection overlay appears; app overlay may also appear."
            prod="No Vite overlay; app overlay appears via unhandledrejection."
          />
          <TriggerRow
            label="Unhandled rejection (microtask)"
            colorPalette="orange"
            variant="outline"
            onClick={throwMicrotaskRejection}
            dev="Vite/Solid dev rejection overlay appears; app overlay may also appear."
            prod="No Vite overlay; app overlay appears via unhandledrejection."
          />
        </VStack>
      </VStack>
    </Box>
  );
}
