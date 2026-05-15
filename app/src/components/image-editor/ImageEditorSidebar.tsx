import {
  ChevronsDown,
  ChevronsUp,
  Copy,
  Eye,
  EyeOff,
  Layers3,
  Trash2,
} from "lucide-solid";
import { createMemo, For, Show } from "solid-js";
import { Box, HStack, VStack } from "styled-system/jsx";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { IconButton } from "~/components/ui/icon-button";
import { Image } from "~/components/ui/image";
import { Link } from "~/components/ui/link";
import { Text } from "~/components/ui/text";
import { Tooltip } from "~/components/ui/tooltip";
import { HistoryIcon } from "./ImageEditorToolbar";
import {
  type HistoryEntry,
  type ImageAnnotation,
  toolLabels,
} from "./image-editor.types";

export type ImageEditorSidebarProps = {
  annotations: ImageAnnotation[];
  selectedId: string | undefined;
  historyEntries: HistoryEntry[];
  activeHistoryIndex: number;
  onSelectLayer: (id: string) => void;
  onToggleLayerVisibility: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onBringLayerForward: (id: string) => void;
  onSendLayerBackward: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onJumpHistory: (index: number) => void;
  savedImages: SavedImageSummary[];
  onRefreshSavedImages: () => void;
};

export type SavedImageSummary = {
  id: string;
  name: string;
  createdAt: string;
  size: number;
  width: number;
  height: number;
  url: string;
};

export const ImageEditorSidebar = (props: ImageEditorSidebarProps) => {
  const layerEntries = createMemo(() =>
    props.annotations
      .map((annotation, index) => ({ annotation, index }))
      .reverse(),
  );
  const visibleLayerCount = createMemo(
    () => props.annotations.filter((annotation) => !annotation.hidden).length,
  );

  return (
    <VStack
      alignItems="stretch"
      gap="5"
      p="4"
      width={{ base: "full", lg: "80" }}
      maxH={{ base: "45dvh", lg: "none" }}
      minH="0"
      flexShrink="0"
      borderRightWidth={{ base: "0", lg: "1px" }}
      borderBottomWidth={{ base: "1px", lg: "0" }}
      borderColor="border"
      bg="bg.default"
      overflowY="auto"
    >
      <VStack alignItems="stretch" gap="3">
        <HStack alignItems="center" justifyContent="space-between">
          <HStack gap="2" alignItems="center">
            <Layers3 size={18} />
            <Box fontWeight="semibold">Layers</Box>
          </HStack>
          <Badge variant="subtle" colorPalette="gray">
            {visibleLayerCount()} / {props.annotations.length}
          </Badge>
        </HStack>

        <Show
          when={layerEntries().length > 0}
          fallback={
            <Text color="fg.muted" textStyle="sm">
              Annotations will appear here.
            </Text>
          }
        >
          <VStack alignItems="stretch" gap="1.5">
            <For each={layerEntries()}>
              {(entry) => (
                <LayerRow
                  annotation={entry.annotation}
                  layerIndex={entry.index}
                  layerCount={props.annotations.length}
                  selected={props.selectedId === entry.annotation.id}
                  onSelect={props.onSelectLayer}
                  onToggleVisibility={props.onToggleLayerVisibility}
                  onDuplicate={props.onDuplicateLayer}
                  onBringForward={props.onBringLayerForward}
                  onSendBackward={props.onSendLayerBackward}
                  onDelete={props.onDeleteLayer}
                />
              )}
            </For>
          </VStack>
        </Show>
      </VStack>

      <VStack alignItems="stretch" gap="3">
        <HStack alignItems="center" justifyContent="space-between">
          <HStack gap="2" alignItems="center">
            <HistoryIcon />
            <Box fontWeight="semibold">History</Box>
          </HStack>
          <Text color="fg.muted" textStyle="xs">
            {props.historyEntries.length}
          </Text>
        </HStack>

        <Show
          when={props.historyEntries.length > 0}
          fallback={
            <Text color="fg.muted" textStyle="sm">
              New operations will appear here.
            </Text>
          }
        >
          <VStack as="ol" alignItems="stretch" gap="1.5" m="0" p="0" listStyle="none">
            <For each={props.historyEntries}>
              {(entry, index) => (
                <Box as="li">
                  <Button
                    width="full"
                    minH="auto"
                    h="auto"
                    alignItems="start"
                    justifyContent="start"
                    variant={
                      props.activeHistoryIndex === index() ? "solid" : "surface"
                    }
                    colorPalette={
                      props.activeHistoryIndex === index() ? "blue" : "gray"
                    }
                    py="2"
                    px="2.5"
                    whiteSpace="normal"
                    onClick={() => props.onJumpHistory(index())}
                  >
                    <VStack alignItems="start" gap="0.5" minW="0">
                      <Box textStyle="sm" fontWeight="semibold">
                        {entry.label}
                      </Box>
                      <Text
                        as="span"
                        textStyle="xs"
                        color={
                          props.activeHistoryIndex === index()
                            ? "blue.solid.fg"
                            : "fg.muted"
                        }
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

      <VStack alignItems="stretch" gap="3">
        <HStack alignItems="center" justifyContent="space-between">
          <Box fontWeight="semibold">Saved images</Box>
          <Button size="2xs" variant="surface" onClick={props.onRefreshSavedImages}>
            Refresh
          </Button>
        </HStack>

        <Show
          when={props.savedImages.length > 0}
          fallback={
            <Text color="fg.muted" textStyle="sm">
              Server-saved PNGs will appear here.
            </Text>
          }
        >
          <VStack alignItems="stretch" gap="2">
            <For each={props.savedImages}>
              {(image) => (
                <Box
                  borderWidth="1px"
                  borderColor="border"
                  borderRadius="l2"
                  bg="bg.subtle"
                  overflow="hidden"
                >
                  <Link
                    href={image.url}
                    target="_blank"
                    rel="noreferrer"
                    display="block"
                    bg="bg.default"
                  >
                    <Image
                      src={image.url}
                      alt={image.name}
                      width="full"
                      height="24"
                      fit="contain"
                    />
                  </Link>
                  <VStack alignItems="stretch" gap="1" p="2">
                    <Box
                      textStyle="sm"
                      fontWeight="semibold"
                      overflow="hidden"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap"
                    >
                      {image.name}
                    </Box>
                    <Text as="span" color="fg.muted" textStyle="xs">
                      {image.width} x {image.height} / {formatFileSize(image.size)}
                    </Text>
                  </VStack>
                </Box>
              )}
            </For>
          </VStack>
        </Show>
      </VStack>
    </VStack>
  );
};

type LayerRowProps = {
  annotation: ImageAnnotation;
  layerIndex: number;
  layerCount: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onDuplicate: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onDelete: (id: string) => void;
};

const LayerRow = (props: LayerRowProps) => (
  <HStack
    gap="1"
    p="1"
    borderWidth="1px"
    borderColor={props.selected ? "blue.7" : "border"}
    borderRadius="l2"
    bg={props.selected ? "blue.2" : "bg.subtle"}
    opacity={props.annotation.hidden ? 0.62 : 1}
    transitionProperty="box-shadow, border-color, background-color"
    transitionDuration="fast"
    _hover={{ boxShadow: "sm", borderColor: "blue.7" }}
  >
    <Box
      as="button"
      flex="1"
      minW="0"
      textAlign="left"
      px="2"
      py="1.5"
      borderRadius="l1"
      cursor="pointer"
      onClick={() => props.onSelect(props.annotation.id)}
    >
      <HStack justifyContent="space-between" gap="2" minW="0">
        <VStack alignItems="start" gap="0" minW="0">
          <Box
            textStyle="sm"
            fontWeight="semibold"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
            maxW="36"
          >
            {layerLabel(props.annotation)}
          </Box>
          <Text as="span" textStyle="xs" color="fg.muted">
            {annotationTypeLabel(props.annotation)} #{props.layerIndex + 1}
          </Text>
        </VStack>
      </HStack>
    </Box>

    <HStack gap="0">
      <Tooltip content={props.annotation.hidden ? "Show layer" : "Hide layer"}>
        <IconButton
          aria-label={props.annotation.hidden ? "Show layer" : "Hide layer"}
          size="xs"
          variant="plain"
          onClick={() => props.onToggleVisibility(props.annotation.id)}
        >
          {props.annotation.hidden ? <EyeOff /> : <Eye />}
        </IconButton>
      </Tooltip>
      <Tooltip content="Send backward">
        <IconButton
          aria-label="Send layer backward"
          size="xs"
          variant="plain"
          disabled={props.layerIndex === 0}
          onClick={() => props.onSendBackward(props.annotation.id)}
        >
          <ChevronsDown />
        </IconButton>
      </Tooltip>
      <Tooltip content="Bring forward">
        <IconButton
          aria-label="Bring layer forward"
          size="xs"
          variant="plain"
          disabled={props.layerIndex === props.layerCount - 1}
          onClick={() => props.onBringForward(props.annotation.id)}
        >
          <ChevronsUp />
        </IconButton>
      </Tooltip>
      <Tooltip content="Duplicate">
        <IconButton
          aria-label="Duplicate layer"
          size="xs"
          variant="plain"
          onClick={() => props.onDuplicate(props.annotation.id)}
        >
          <Copy />
        </IconButton>
      </Tooltip>
      <Tooltip content="Delete">
        <IconButton
          aria-label="Delete layer"
          size="xs"
          variant="plain"
          colorPalette="red"
          onClick={() => props.onDelete(props.annotation.id)}
        >
          <Trash2 />
        </IconButton>
      </Tooltip>
    </HStack>
  </HStack>
);

const layerLabel = (annotation: ImageAnnotation) => {
  switch (annotation.type) {
    case "text":
      return annotation.text.trim().split(/\s+/).slice(0, 5).join(" ") || "Text";
    case "step":
      return `Step ${annotation.label}`;
    case "image":
      return "Image layer";
    default:
      return toolLabels[annotation.type];
  }
};

const annotationTypeLabel = (annotation: ImageAnnotation) =>
  annotation.type === "image" ? "Image" : toolLabels[annotation.type];

const formatHistoryTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
