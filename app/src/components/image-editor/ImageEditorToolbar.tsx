import {
  ArrowUpRight,
  Circle,
  Copy,
  Crop,
  Download,
  Grid2X2,
  Highlighter,
  History,
  ListOrdered,
  Maximize2,
  MousePointer2,
  PenLine,
  Redo2,
  Square,
  Type,
  Undo2,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-solid";
import { For, type JSX } from "solid-js";
import { Box, HStack } from "styled-system/jsx";
import { Button } from "~/components/ui/button";
import { IconButton } from "~/components/ui/icon-button";
import { Tooltip } from "~/components/ui/tooltip";
import {
  type ImageEditorZoom,
  type ImageEditorTool,
  toolLabels,
} from "./image-editor.types";

const primaryTools: ImageEditorTool[] = [
  "select",
  "arrow",
  "rectangle",
  "ellipse",
  "pen",
  "highlighter",
  "text",
  "step",
  "pixelate",
  "crop",
];

const toolShortcuts: Record<ImageEditorTool, string> = {
  select: "V",
  arrow: "A",
  rectangle: "R",
  ellipse: "O",
  pen: "P",
  highlighter: "H",
  text: "T",
  step: "S",
  pixelate: "X",
  crop: "C",
};

export type ImageEditorToolbarProps = {
  activeTool: ImageEditorTool;
  hasProject: boolean;
  canUndo: boolean;
  canRedo: boolean;
  isExporting: boolean;
  isCopying: boolean;
  isHistoryOpen: boolean;
  zoom: ImageEditorZoom;
  onToolChange: (tool: ImageEditorTool) => void;
  onToggleHistory: () => void;
  onChooseFile: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onZoomReset: () => void;
  onExport: () => void;
  onCopy: () => void;
};

export const ImageEditorToolbar = (props: ImageEditorToolbarProps) => {
  const zoomLabel = () =>
    props.zoom === "fit" ? "Fit" : `${Math.round(props.zoom * 100)}%`;

  return (
    <HStack
      as="header"
      alignItems="center"
      justifyContent="space-between"
      gap="3"
      p="3"
      borderBottomWidth="1px"
      borderColor="border"
      bg="bg.default"
      flexWrap="wrap"
    >
      <HStack gap="2" minW="0" flex="1" flexWrap="wrap">
        <HStack gap="2" mr="1">
          <Tooltip content={props.isHistoryOpen ? "Hide history" : "Show history"}>
            <IconButton
              aria-label={props.isHistoryOpen ? "Hide history" : "Show history"}
              size="sm"
              variant={props.isHistoryOpen ? "solid" : "surface"}
              colorPalette={props.isHistoryOpen ? "blue" : "gray"}
              onClick={props.onToggleHistory}
            >
              <History />
            </IconButton>
          </Tooltip>
          <Box fontWeight="bold" whiteSpace="nowrap">
            Image Annotator
          </Box>
        </HStack>
        <HStack gap="1" flexWrap="wrap">
          <For each={primaryTools}>
            {(tool) => (
              <Tooltip content={`${toolLabels[tool]} (${toolShortcuts[tool]})`} openDelay={250}>
                <IconButton
                  aria-label={toolLabels[tool]}
                  size="sm"
                  variant={props.activeTool === tool ? "solid" : "surface"}
                  colorPalette={props.activeTool === tool ? "blue" : "gray"}
                  disabled={!props.hasProject && tool !== "select"}
                  onClick={() => props.onToolChange(tool)}
                >
                  {renderToolIcon(tool)}
                </IconButton>
              </Tooltip>
            )}
          </For>
        </HStack>
      </HStack>

      <HStack gap="2" flexWrap="wrap" justifyContent="end">
        <HStack gap="1">
          <Tooltip content="Zoom out (-)">
            <IconButton
              aria-label="Zoom out"
              size="sm"
              variant="surface"
              disabled={!props.hasProject}
              onClick={props.onZoomOut}
            >
              <ZoomOut />
            </IconButton>
          </Tooltip>
          <Tooltip content="Fit to screen (F)">
            <IconButton
              aria-label="Fit to screen"
              size="sm"
              variant={props.zoom === "fit" ? "solid" : "surface"}
              colorPalette={props.zoom === "fit" ? "blue" : "gray"}
              disabled={!props.hasProject}
              onClick={props.onZoomFit}
            >
              <Maximize2 />
            </IconButton>
          </Tooltip>
          <Button
            size="sm"
            variant="surface"
            disabled={!props.hasProject}
            minW="16"
            onClick={props.onZoomReset}
          >
            {zoomLabel()}
          </Button>
          <Tooltip content="Zoom in (+)">
            <IconButton
              aria-label="Zoom in"
              size="sm"
              variant="surface"
              disabled={!props.hasProject}
              onClick={props.onZoomIn}
            >
              <ZoomIn />
            </IconButton>
          </Tooltip>
        </HStack>
        <Tooltip content="Undo">
          <IconButton
            aria-label="Undo"
            size="sm"
            variant="surface"
            disabled={!props.canUndo}
            onClick={props.onUndo}
          >
            <Undo2 />
          </IconButton>
        </Tooltip>
        <Tooltip content="Redo">
          <IconButton
            aria-label="Redo"
            size="sm"
            variant="surface"
            disabled={!props.canRedo}
            onClick={props.onRedo}
          >
            <Redo2 />
          </IconButton>
        </Tooltip>
        <Button size="sm" variant="surface" onClick={props.onChooseFile}>
          <Upload />
          Import
        </Button>
        <Button
          size="sm"
          variant="surface"
          disabled={!props.hasProject}
          loading={props.isCopying}
          onClick={props.onCopy}
        >
          <Copy />
          Copy PNG
        </Button>
        <Button
          size="sm"
          colorPalette="blue"
          disabled={!props.hasProject}
          loading={props.isExporting}
          onClick={props.onExport}
        >
          <Download />
          Export PNG
        </Button>
      </HStack>
    </HStack>
  );
};

const renderToolIcon = (tool: ImageEditorTool): JSX.Element => {
  switch (tool) {
    case "select":
      return <MousePointer2 />;
    case "arrow":
      return <ArrowUpRight />;
    case "rectangle":
      return <Square />;
    case "ellipse":
      return <Circle />;
    case "pen":
      return <PenLine />;
    case "highlighter":
      return <Highlighter />;
    case "text":
      return <Type />;
    case "step":
      return <ListOrdered />;
    case "pixelate":
      return <Grid2X2 />;
    case "crop":
      return <Crop />;
  }
};

export const HistoryIcon = () => <History />;
