import { For, Show } from "solid-js";
import { Box, HStack, VStack } from "styled-system/jsx";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { HistoryIcon } from "./ImageEditorToolbar";
import { type HistoryEntry } from "./image-editor.types";

export type ImageEditorHistoryProps = {
  entries: HistoryEntry[];
  activeIndex: number;
  onJump: (index: number) => void;
};

export const ImageEditorHistory = (props: ImageEditorHistoryProps) => {
  return (
    <VStack
      alignItems="stretch"
      gap="3"
      p="4"
      width={{ base: "full", xl: "72" }}
      borderRightWidth={{ base: "0", xl: "1px" }}
      borderBottomWidth={{ base: "1px", xl: "0" }}
      borderColor="border"
      bg="bg.default"
      overflowY="auto"
    >
      <HStack alignItems="center" justifyContent="space-between">
        <HStack gap="2" alignItems="center">
          <HistoryIcon />
          <Box fontWeight="semibold">History</Box>
        </HStack>
        <Text color="fg.muted" textStyle="xs">
          {props.entries.length}
        </Text>
      </HStack>

      <Show
        when={props.entries.length > 0}
        fallback={
          <Text color="fg.muted" textStyle="sm">
            New operations will appear here.
          </Text>
        }
      >
        <VStack as="ol" alignItems="stretch" gap="2" m="0" p="0" listStyle="none">
          <For each={props.entries}>
            {(entry, index) => (
              <Box as="li">
                <Button
                  width="full"
                  minH="auto"
                  h="auto"
                  alignItems="start"
                  justifyContent="start"
                  variant={props.activeIndex === index() ? "solid" : "surface"}
                  colorPalette={props.activeIndex === index() ? "blue" : "gray"}
                  py="2.5"
                  px="3"
                  whiteSpace="normal"
                  onClick={() => props.onJump(index())}
                >
                  <VStack alignItems="start" gap="1" minW="0">
                    <Box textStyle="sm" fontWeight="semibold">
                      {entry.label}
                    </Box>
                    <Text
                      as="span"
                      textStyle="xs"
                      color={props.activeIndex === index() ? "blue.solid.fg" : "fg.muted"}
                    >
                      {formatHistoryTime(entry.timestamp)}
                    </Text>
                  </VStack>
                </Button>
              </Box>
            )}
          </For>
        </VStack>
      </Show>
    </VStack>
  );
};

const formatHistoryTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
};
