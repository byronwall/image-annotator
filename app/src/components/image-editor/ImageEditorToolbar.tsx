import {
  ArrowUpRight,
  Circle,
  Columns2,
  Copy,
  Crop,
  Download,
  Eraser,
  Eye,
  Grid2X2,
  Highlighter,
  History,
  Keyboard,
  ListOrdered,
  Magnet,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  MousePointer2,
  Minus,
  PenLine,
  Redo2,
  Ruler,
  Save,
  ScanLine,
  Square,
  Type,
  Undo2,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-solid";
import { For, type JSX } from "solid-js";
import { Portal } from "solid-js/web";
import { Box, HStack } from "styled-system/jsx";
import { Button } from "~/components/ui/button";
import { IconButton } from "~/components/ui/icon-button";
import * as Menu from "~/components/ui/menu";
import { Tooltip } from "~/components/ui/tooltip";
import {
  type ImageEditorZoom,
  type ImageEditorTool,
  type MeasureMode,
  toolLabels,
} from "./image-editor.types";

type SnapMode = "off" | "both" | "horizontal" | "vertical";

const primaryTools: ImageEditorTool[] = [
  "select",
  "line",
  "arrow",
  "rectangle",
  "ellipse",
  "pen",
  "highlighter",
  "text",
  "step",
  "measure",
  "erase",
  "pixelate",
  "crop",
];

const toolShortcuts: Record<ImageEditorTool, string> = {
  select: "V",
  line: "L",
  arrow: "A",
  rectangle: "R",
  ellipse: "O",
  pen: "P",
  highlighter: "H",
  text: "T",
  step: "S",
  measure: "M",
  erase: "D",
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
  isSaving: boolean;
  isHistoryOpen: boolean;
  isBeforeAfterMode: boolean;
  selectedCount: number;
  snapMode: SnapMode;
  measureMode: MeasureMode;
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
  onExpandCanvas: () => void;
  onTrimCanvas: () => void;
  onSelectionView: (kind: "zoom" | "fit-region" | "top-left" | "bottom-right") => void;
  onSmartAdjustSelection: () => void;
  onSnapModeChange: (mode: SnapMode) => void;
  onMeasureModeChange: (mode: MeasureMode) => void;
  onToggleBeforeAfterMode: () => void;
  onPasteMeasureTestImage: () => void;
  onSave: () => void;
  onExport: () => void;
  onCopy: () => void;
  onShowShortcuts: () => void;
};

export const ImageEditorToolbar = (props: ImageEditorToolbarProps) => {
  const zoomLabel = () =>
    props.zoom === "fit" ? "Fit" : `${Math.round(props.zoom * 100)}%`;
  const hasSelection = () => props.selectedCount > 0;
  const snapLabel = () =>
    props.snapMode === "off"
      ? "Snap off"
      : props.snapMode === "both"
        ? "Snap XY"
        : props.snapMode === "horizontal"
          ? "Snap X"
          : "Snap Y";

  return (
    <HStack
      as="header"
      alignItems="center"
      justifyContent="space-between"
      gap="2"
      p="2.5"
      borderBottomWidth="1px"
      borderColor="border"
      bg="bg.default"
      flexShrink="0"
      flexWrap="nowrap"
      overflow="hidden"
    >
      <HStack gap="2" minW="0" flex="1 1 auto" flexWrap="nowrap">
        <HStack gap="2" mr="1">
          <Tooltip content={props.isHistoryOpen ? "Hide sidebar" : "Show sidebar"}>
            <IconButton
              aria-label={props.isHistoryOpen ? "Hide sidebar" : "Show sidebar"}
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
        <HStack gap="0.5" flexWrap="nowrap" overflowX="auto" minW="0">
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

      <HStack gap="1" flexWrap="nowrap" justifyContent="end" flex="0 0 auto" ml="auto">
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
        <Menu.Root positioning={{ placement: "bottom-end" }} size="sm">
          <Menu.Trigger
            asChild={(triggerProps) => (
            <Button
              {...triggerProps()}
              size="sm"
              variant="surface"
              disabled={!props.hasProject}
              minW="18"
            >
              <Eye />
              View
            </Button>
            )}
          />
          <Portal>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.Item value="zoom-out" onClick={props.onZoomOut}>
                  <ZoomOut />
                  <Menu.ItemText>Zoom out</Menu.ItemText>
                </Menu.Item>
                <Menu.Item value="fit-screen" onClick={props.onZoomFit}>
                  <Maximize2 />
                  <Menu.ItemText>Fit to screen</Menu.ItemText>
                </Menu.Item>
                <Menu.Item value="reset-zoom" onClick={props.onZoomReset}>
                  <Menu.ItemText>Reset to {zoomLabel()}</Menu.ItemText>
                </Menu.Item>
                <Menu.Item value="zoom-in" onClick={props.onZoomIn}>
                  <ZoomIn />
                  <Menu.ItemText>Zoom in</Menu.ItemText>
                </Menu.Item>
                <Menu.Separator />
                <Menu.Item
                  value="zoom-selection"
                  disabled={!hasSelection()}
                  onClick={() => props.onSelectionView("zoom")}
                >
                  <Menu.ItemText>Zoom to selection</Menu.ItemText>
                </Menu.Item>
                <Menu.Item
                  value="fit-region"
                  disabled={!hasSelection()}
                  onClick={() => props.onSelectionView("fit-region")}
                >
                  <Menu.ItemText>Fit selected region</Menu.ItemText>
                </Menu.Item>
                <Menu.Item
                  value="top-left"
                  disabled={!hasSelection()}
                  onClick={() => props.onSelectionView("top-left")}
                >
                  <Menu.ItemText>Focus selection top-left</Menu.ItemText>
                </Menu.Item>
                <Menu.Item
                  value="bottom-right"
                  disabled={!hasSelection()}
                  onClick={() => props.onSelectionView("bottom-right")}
                >
                  <Menu.ItemText>Focus selection bottom-right</Menu.ItemText>
                </Menu.Item>
                <Menu.Separator />
                <Menu.Item
                  value="smart-fit"
                  disabled={!hasSelection()}
                  onClick={props.onSmartAdjustSelection}
                >
                  <Menu.ItemText>Smart-fit selection</Menu.ItemText>
                </Menu.Item>
                <Menu.Separator />
                <Menu.Item value="expand-canvas" onClick={props.onExpandCanvas}>
                  <Maximize2 />
                  <Menu.ItemText>Expand canvas</Menu.ItemText>
                </Menu.Item>
                <Menu.Item value="trim-canvas" onClick={props.onTrimCanvas}>
                  <Minimize2 />
                  <Menu.ItemText>Trim to content</Menu.ItemText>
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
        <Menu.Root positioning={{ placement: "bottom-end" }} size="sm">
          <Menu.Trigger
            asChild={(triggerProps) => (
              <Button
                {...triggerProps()}
                size="sm"
                variant="surface"
                minW="22"
              >
                <Magnet />
                {snapLabel()}
              </Button>
            )}
          />
          <Portal>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.ItemGroup>
                  <Menu.ItemGroupLabel>Snapping</Menu.ItemGroupLabel>
                  <SnapMenuItem active={props.snapMode === "off"} value="snap-off" onClick={() => props.onSnapModeChange("off")}>
                    Snap off
                  </SnapMenuItem>
                  <SnapMenuItem active={props.snapMode === "horizontal"} value="snap-x" onClick={() => props.onSnapModeChange("horizontal")}>
                    X only
                  </SnapMenuItem>
                  <SnapMenuItem active={props.snapMode === "vertical"} value="snap-y" onClick={() => props.onSnapModeChange("vertical")}>
                    Y only
                  </SnapMenuItem>
                  <SnapMenuItem active={props.snapMode === "both"} value="snap-xy" onClick={() => props.onSnapModeChange("both")}>
                    X and Y
                  </SnapMenuItem>
                </Menu.ItemGroup>
                <Menu.Separator />
                <Menu.ItemGroup>
                  <Menu.ItemGroupLabel>Measurement</Menu.ItemGroupLabel>
                  <SnapMenuItem active={props.measureMode === "edge"} value="measure-edge" onClick={() => props.onMeasureModeChange("edge")}>
                    Edge
                  </SnapMenuItem>
                  <SnapMenuItem active={props.measureMode === "point"} value="measure-point" onClick={() => props.onMeasureModeChange("point")}>
                    Point
                  </SnapMenuItem>
                </Menu.ItemGroup>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
        <Button size="sm" variant="surface" onClick={props.onChooseFile}>
          <Upload />
          Import
        </Button>
        <Tooltip content="Load sample image">
          <IconButton
            aria-label="Load sample image"
            size="sm"
            variant="surface"
            onClick={props.onPasteMeasureTestImage}
          >
            <ScanLine />
          </IconButton>
        </Tooltip>
        <Button
          size="sm"
          variant="surface"
          disabled={!props.hasProject}
          loading={props.isSaving}
          onClick={props.onSave}
        >
          <Save />
          Save
        </Button>
        <Tooltip content="Copy PNG">
          <IconButton
            aria-label="Copy PNG"
            size="sm"
            variant="surface"
            disabled={!props.hasProject}
            loading={props.isCopying}
            onClick={props.onCopy}
          >
          <Copy />
        </IconButton>
      </Tooltip>
        <Tooltip content="Keyboard shortcuts (Shift ?)">
          <IconButton
            aria-label="Keyboard shortcuts"
            size="sm"
            variant="surface"
            onClick={props.onShowShortcuts}
          >
            <Keyboard />
          </IconButton>
        </Tooltip>
        <Menu.Root positioning={{ placement: "bottom-end" }} size="sm">
          <Menu.Trigger
            asChild={(triggerProps) => (
              <IconButton
                {...triggerProps()}
                aria-label="More actions"
                size="sm"
                variant="surface"
              >
                <MoreHorizontal />
              </IconButton>
            )}
          />
          <Portal>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.ItemGroup>
                  <Menu.ItemGroupLabel>Canvas</Menu.ItemGroupLabel>
                  <Menu.Item
                    value="before-after"
                    disabled={!props.hasProject}
                    onClick={props.onToggleBeforeAfterMode}
                  >
                    <Columns2 />
                    <Menu.ItemText>
                      {props.isBeforeAfterMode ? "Before/after enabled" : "Before/after paste"}
                    </Menu.ItemText>
                  </Menu.Item>
                </Menu.ItemGroup>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
        <Button
          size="sm"
          colorPalette="blue"
          disabled={!props.hasProject}
          loading={props.isExporting}
          onClick={props.onExport}
        >
          <Download />
          Export
        </Button>
      </HStack>
    </HStack>
  );
};

const SnapMenuItem = (props: {
  active: boolean;
  value: string;
  onClick: () => void;
  children: JSX.Element;
}) => (
  <Menu.Item value={props.value} onClick={props.onClick}>
    <Box as="span" aria-hidden="true" width="4" color="blue.9">
      {props.active ? "*" : ""}
    </Box>
    <Menu.ItemText>{props.children}</Menu.ItemText>
  </Menu.Item>
);

const renderToolIcon = (tool: ImageEditorTool): JSX.Element => {
  switch (tool) {
    case "select":
      return <MousePointer2 />;
    case "line":
      return <Minus />;
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
    case "measure":
      return <Ruler />;
    case "erase":
      return <Eraser />;
    case "pixelate":
      return <Grid2X2 />;
    case "crop":
      return <Crop />;
  }
};

export const HistoryIcon = () => <History />;
