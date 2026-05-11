import {
  ChevronsDown,
  ChevronsUp,
  Copy,
  Edit3,
  Minus,
  Plus,
  Trash2,
} from "lucide-solid";
import { For, Show, type JSX } from "solid-js";
import { Box, HStack } from "styled-system/jsx";
import { Button } from "~/components/ui/button";
import { IconButton } from "~/components/ui/icon-button";
import { Tooltip } from "~/components/ui/tooltip";
import {
  type EditorSettings,
  type ImageAnnotation,
  type ImageEditorTool,
  toolLabels,
} from "./image-editor.types";

const strokeSwatches = [
  { label: "Blue", value: "#2563eb" },
  { label: "Green", value: "#16a34a" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Red", value: "#dc2626" },
  { label: "Ink", value: "#111827" },
  { label: "White", value: "#ffffff" },
] as const;

const fillSwatches = [
  { label: "Blue fill", value: "rgba(37, 99, 235, 0.12)" },
  { label: "Green fill", value: "rgba(22, 163, 74, 0.12)" },
  { label: "Amber fill", value: "rgba(245, 158, 11, 0.18)" },
  { label: "Red fill", value: "rgba(220, 38, 38, 0.14)" },
  { label: "Clear fill", value: "rgba(255, 255, 255, 0)" },
] as const;

const strokeWidthSteps = [2, 4, 8, 12] as const;
const fontSizeSteps = [20, 28, 36, 48] as const;
const opacitySteps = [0.25, 0.5, 0.75, 1] as const;

export type ImageEditorContextBarProps = {
  style: JSX.CSSProperties;
  activeTool: ImageEditorTool;
  selectedAnnotation: ImageAnnotation | undefined;
  settings: EditorSettings;
  onSettingsChange: (settings: Partial<EditorSettings>) => void;
  onStartInlineEdit: () => void;
  onDuplicateSelected: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onDeleteSelected: () => void;
};

export const ImageEditorContextBar = (props: ImageEditorContextBarProps) => {
  const hasSelection = () => props.selectedAnnotation !== undefined;
  const title = () =>
    props.selectedAnnotation
      ? props.selectedAnnotation.type === "image"
        ? "Image"
        : toolLabels[props.selectedAnnotation.type]
      : `${toolLabels[props.activeTool]} style`;
  const usesFill = () =>
    props.activeTool === "rectangle" ||
    props.activeTool === "ellipse" ||
    props.activeTool === "text" ||
    props.selectedAnnotation?.type === "rectangle" ||
    props.selectedAnnotation?.type === "ellipse" ||
    props.selectedAnnotation?.type === "text";
  const usesFontSize = () =>
    props.activeTool === "text" ||
    props.activeTool === "step" ||
    props.selectedAnnotation?.type === "text" ||
    props.selectedAnnotation?.type === "step";

  return (
    <HStack
      alignItems="center"
      gap="2"
      position="absolute"
      zIndex="10"
      p="1.5"
      borderRadius="l2"
      borderWidth="1px"
      borderColor="border"
      bg="bg.default"
      boxShadow="lg"
      maxW="calc(100% - 24px)"
      overflowX="auto"
      whiteSpace="nowrap"
      style={props.style}
    >
      <HStack gap="2" minW="0" flexShrink="0">
        <Box fontWeight="semibold" textStyle="sm" minW="0" maxW="28" overflow="hidden" textOverflow="ellipsis">
          {title()}
        </Box>
        <Show when={hasSelection()}>
          <HStack gap="1">
            <Show when={props.selectedAnnotation?.type === "text" || props.selectedAnnotation?.type === "step"}>
              <Tooltip content="Edit in place">
                <IconButton
                  aria-label="Edit in place"
                  size="xs"
                  variant="plain"
                  onClick={props.onStartInlineEdit}
                >
                  <Edit3 />
                </IconButton>
              </Tooltip>
            </Show>
            <Tooltip content="Send backward">
              <IconButton
                aria-label="Send backward"
                size="xs"
                variant="plain"
                onClick={props.onSendBackward}
              >
                <ChevronsDown />
              </IconButton>
            </Tooltip>
            <Tooltip content="Bring forward">
              <IconButton
                aria-label="Bring forward"
                size="xs"
                variant="plain"
                onClick={props.onBringForward}
              >
                <ChevronsUp />
              </IconButton>
            </Tooltip>
            <Tooltip content="Duplicate">
              <IconButton
                aria-label="Duplicate"
                size="xs"
                variant="plain"
                onClick={props.onDuplicateSelected}
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
                onClick={props.onDeleteSelected}
              >
                <Trash2 />
              </IconButton>
            </Tooltip>
          </HStack>
        </Show>
      </HStack>

      <HStack gap="2" flexWrap="nowrap" flexShrink="0">
        <For each={strokeSwatches}>
          {(swatch) => (
            <Tooltip content={swatch.label}>
              <Box
                as="button"
                aria-label={swatch.label}
                width="7"
                height="7"
                borderRadius="l2"
                borderWidth={props.settings.color === swatch.value ? "3px" : "1px"}
                borderColor={props.settings.color === swatch.value ? "blue.9" : "border"}
                bg="bg.default"
                p="1"
                cursor="pointer"
                transitionProperty="box-shadow, border-color"
                transitionDuration="fast"
                _hover={{ boxShadow: "sm", borderColor: "blue.7" }}
                onClick={() => props.onSettingsChange({ color: swatch.value })}
              >
                <Box
                  width="full"
                  height="full"
                  borderRadius="l1"
                  borderWidth={swatch.value === "#ffffff" ? "1px" : "0"}
                  borderColor="border"
                  style={{ "background-color": swatch.value }}
                />
              </Box>
            </Tooltip>
          )}
        </For>

        <Show when={usesFill()}>
          <Box width="1px" height="7" bg="border" />
          <For each={fillSwatches}>
            {(swatch) => (
              <Tooltip content={swatch.label}>
                <Box
                  as="button"
                  aria-label={swatch.label}
                  width="7"
                  height="7"
                  borderRadius="l2"
                  borderWidth={props.settings.fillColor === swatch.value ? "3px" : "1px"}
                  borderColor={
                    props.settings.fillColor === swatch.value ? "blue.9" : "border"
                  }
                  bg="bg.default"
                  p="1"
                  cursor="pointer"
                  transitionProperty="box-shadow, border-color"
                  transitionDuration="fast"
                  _hover={{ boxShadow: "sm", borderColor: "blue.7" }}
                  onClick={() => props.onSettingsChange({ fillColor: swatch.value })}
                >
                  <Box
                    width="full"
                    height="full"
                    borderRadius="l1"
                    borderWidth="1px"
                    borderColor="border"
                    style={{ "background-color": swatch.value }}
                  />
                </Box>
              </Tooltip>
            )}
          </For>
        </Show>
      </HStack>

      <HStack gap="2" flexWrap="nowrap" flexShrink="0">
        <HStack gap="1">
          <Tooltip content="Thinner">
            <IconButton
              aria-label="Thinner stroke"
              size="xs"
              variant="surface"
              onClick={() =>
                props.onSettingsChange({
                  strokeWidth: Math.max(1, props.settings.strokeWidth - 1),
                })
              }
            >
              <Minus />
            </IconButton>
          </Tooltip>
          <For each={strokeWidthSteps}>
            {(value) => (
              <Button
                size="2xs"
                variant={props.settings.strokeWidth === value ? "solid" : "surface"}
                colorPalette={props.settings.strokeWidth === value ? "blue" : "gray"}
                onClick={() => props.onSettingsChange({ strokeWidth: value })}
              >
                {value}
              </Button>
            )}
          </For>
          <Tooltip content="Thicker">
            <IconButton
              aria-label="Thicker stroke"
              size="xs"
              variant="surface"
              onClick={() =>
                props.onSettingsChange({
                  strokeWidth: Math.min(36, props.settings.strokeWidth + 1),
                })
              }
            >
              <Plus />
            </IconButton>
          </Tooltip>
        </HStack>

        <Show when={usesFontSize()}>
          <Box width="1px" height="7" bg="border" />
          <For each={fontSizeSteps}>
            {(value) => (
              <Button
                size="2xs"
                variant={props.settings.fontSize === value ? "solid" : "surface"}
                colorPalette={props.settings.fontSize === value ? "blue" : "gray"}
                onClick={() => props.onSettingsChange({ fontSize: value })}
              >
                {value}
              </Button>
            )}
          </For>
        </Show>
      </HStack>

      <HStack gap="1" flexWrap="nowrap" flexShrink="0">
        <Box textStyle="xs" color="fg.muted" mr="1">
          Opacity
        </Box>
        <For each={opacitySteps}>
          {(value) => (
            <Button
              size="2xs"
              variant={props.settings.opacity === value ? "solid" : "surface"}
              colorPalette={props.settings.opacity === value ? "blue" : "gray"}
              onClick={() => props.onSettingsChange({ opacity: value })}
            >
              {Math.round(value * 100)}
            </Button>
          )}
        </For>
      </HStack>
    </HStack>
  );
};
