import { ErrorBoundary } from "solid-js";
import { Box, VStack } from "styled-system/jsx";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { ImageEditor } from "~/components/image-editor/ImageEditor";

export default function HomeRoute() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <Box minH="100dvh" display="grid" placeItems="center" bg="bg.canvas" p="6">
          <VStack
            alignItems="start"
            gap="4"
            maxW="lg"
            p="6"
            borderWidth="1px"
            borderColor="border"
            borderRadius="l2"
            bg="bg.default"
          >
            <Box fontWeight="bold">Image editor failed to load</Box>
            <Text color="fg.muted">
              {error instanceof Error ? error.message : "Unexpected editor error."}
            </Text>
            <Button onClick={reset}>Reload Editor</Button>
          </VStack>
        </Box>
      )}
    >
      <ImageEditor />
    </ErrorBoundary>
  );
}
