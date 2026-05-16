import {
  ChevronsDown,
  ChevronsUp,
  ClipboardCopy,
  ClipboardPaste,
  Copy,
  Edit3,
  Minus,
  Palette,
  Plus,
  Save,
  Trash2,
} from "lucide-solid";
import { For, Show, type JSX } from "solid-js";
import { Box, HStack } from "styled-system/jsx";
import { Button } from "~/components/ui/button";
import { IconButton } from "~/components/ui/icon-button";
import { SimpleSelect } from "~/components/ui/simple-select";
import { Tooltip } from "~/components/ui/tooltip";
import {
  colorToHexInput,
  isStylableTool,
  stylePresetDefinitions,
} from "./image-editor.styles";
import {
  type ArrowStyle,
  type BrandPalette,
  type EditorSettings,
  type ImageAnnotation,
  type ImageEditorTool,
  type MeasureMode,
  type RectangleStyle,
  type StepMarkerStyle,
  type StylePresetId,
  type StylableImageEditorTool,
  type TextAnnotationStyle,
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

const arrowStyleItems = [
  { label: "Straight", value: "straight" },
  { label: "Elbow", value: "elbow" },
  { label: "Curved", value: "curved" },
  { label: "Double-ended", value: "double-ended" },
  { label: "Line only", value: "line-only" },
  { label: "Soft shadow", value: "soft-shadow" },
  { label: "Hand-drawn", value: "hand-drawn" },
] as const;

const rectangleStyleItems = [
  { label: "Square", value: "square" },
  { label: "Rounded", value: "rounded" },
  { label: "Filled", value: "filled" },
  { label: "Outline only", value: "outline-only" },
  { label: "Translucent", value: "translucent" },
  { label: "Label badge", value: "label-badge" },
] as const;

const textStyleItems = [
  { label: "No background", value: "none" },
  { label: "Pill background", value: "pill" },
  { label: "Dark label", value: "dark-label" },
  { label: "Light label", value: "light-label" },
  { label: "Warning label", value: "warning-label" },
  { label: "Code label", value: "code-label" },
  { label: "Numbered callout", value: "numbered-callout" },
] as const;

const stepStyleItems = [
  { label: "Circle", value: "circle" },
  { label: "Square", value: "square" },
  { label: "Pill", value: "pill" },
  { label: "Small badge", value: "small-badge" },
  { label: "Large tutorial", value: "large-tutorial" },
] as const;

type ColorOption = {
  label: string;
  value: string;
};

export type ImageEditorContextBarProps = {
  style: JSX.CSSProperties;
  activeTool: ImageEditorTool;
  selectedAnnotation: ImageAnnotation | undefined;
  selectedCount: number;
  snapMode: "off" | "both" | "horizontal" | "vertical";
  measureMode: MeasureMode;
  settings: EditorSettings;
  recentColors: string[];
  recentFillColors: string[];
  customColors: string[];
  brandPalettes: BrandPalette[];
  canPasteStyle: boolean;
  onSettingsChange: (settings: Partial<EditorSettings>) => void;
  onStylePreset: (preset: StylePresetId) => void;
  onCustomColorChange: (color: string, target: "stroke" | "fill") => void;
  onMakeCurrentStyleDefault: () => void;
  onCopyStyle: () => void;
  onPasteStyle: () => void;
  onMeasureModeChange: (mode: MeasureMode) => void;
  onSnapModeChange: (mode: "off" | "both" | "horizontal" | "vertical") => void;
  onAlignSelection: (command: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  onDistributeSelection: (axis: "horizontal" | "vertical") => void;
  onSmartAdjustSelection: () => void;
  onSelectionView: (kind: "zoom" | "fit-region" | "top-left" | "bottom-right") => void;
  onStartInlineEdit: () => void;
  onDuplicateSelected: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onDeleteSelected: () => void;
};

export const ImageEditorContextBar = (props: ImageEditorContextBarProps) => {
  const hasSelection = () => props.selectedCount > 0;
  const styleTool = () =>
    annotationStyleTool(props.selectedAnnotation) ??
    (isStylableTool(props.activeTool) ? props.activeTool : undefined);
  const title = () =>
    props.selectedCount > 1
      ? `${props.selectedCount} layers`
      : props.selectedAnnotation
        ? props.selectedAnnotation.type === "image"
          ? "Image"
          : toolLabels[props.selectedAnnotation.type]
        : `${toolLabels[props.activeTool]} style`;
  const usesFill = () => {
    const tool = styleTool();

    return (
      tool === "rectangle" ||
      tool === "ellipse" ||
      tool === "pixelate" ||
      tool === "text"
    );
  };
  const usesFontSize = () => {
    const tool = styleTool();
    return tool === "text" || tool === "step";
  };
  const usesStrokeWidth = () => {
    const tool = styleTool();

    return (
      tool === "arrow" ||
      tool === "rectangle" ||
      tool === "ellipse" ||
      tool === "pen" ||
      tool === "highlighter" ||
      tool === "measure" ||
      tool === "pixelate"
    );
  };
  const usesMeasureMode = () =>
    props.activeTool === "measure" || props.selectedAnnotation?.type === "measure";
  const strokeOptions = () =>
    uniqueColorOptions([
      ...strokeSwatches,
      ...props.recentColors.map((color) => ({ label: "Recent color", value: color })),
      ...props.customColors.map((color) => ({ label: "Custom color", value: color })),
    ]);
  const fillOptions = () =>
    uniqueColorOptions([
      ...fillSwatches,
      ...props.recentFillColors.map((color) => ({ label: "Recent fill", value: color })),
      ...props.customColors.map((color) => ({ label: "Custom fill", value: color })),
    ]);

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
            <Show
              when={
                props.selectedCount === 1 &&
                (props.selectedAnnotation?.type === "text" ||
                  props.selectedAnnotation?.type === "step")
              }
            >
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
            <Tooltip content="Copy style">
              <IconButton
                aria-label="Copy style"
                size="xs"
                variant="plain"
                onClick={props.onCopyStyle}
              >
                <ClipboardCopy />
              </IconButton>
            </Tooltip>
            <Tooltip content="Paste style">
              <IconButton
                aria-label="Paste style"
                size="xs"
                variant="plain"
                disabled={!props.canPasteStyle}
                onClick={props.onPasteStyle}
              >
                <ClipboardPaste />
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

      <Show when={hasSelection()}>
        <HStack gap="1" flexWrap="nowrap" flexShrink="0">
          <Tooltip content="Zoom to selection">
            <Button size="2xs" variant="surface" onClick={() => props.onSelectionView("zoom")}>
              Zoom
            </Button>
          </Tooltip>
          <Tooltip content="Fit selected region">
            <Button size="2xs" variant="surface" onClick={() => props.onSelectionView("fit-region")}>
              Fit
            </Button>
          </Tooltip>
          <Tooltip content="Focus top-left of selection">
            <Button size="2xs" variant="surface" onClick={() => props.onSelectionView("top-left")}>
              TL
            </Button>
          </Tooltip>
          <Tooltip content="Focus bottom-right of selection">
            <Button size="2xs" variant="surface" onClick={() => props.onSelectionView("bottom-right")}>
              BR
            </Button>
          </Tooltip>
          <Tooltip content="Smart-fit to nearby monotone UI block">
            <Button size="2xs" variant="surface" onClick={props.onSmartAdjustSelection}>
              Auto
            </Button>
          </Tooltip>
        </HStack>
      </Show>

      <Show when={props.selectedCount > 1}>
        <HStack gap="1" flexWrap="nowrap" flexShrink="0">
          <Tooltip content="Align left">
            <Button size="2xs" variant="surface" onClick={() => props.onAlignSelection("left")}>
              L
            </Button>
          </Tooltip>
          <Tooltip content="Align center">
            <Button size="2xs" variant="surface" onClick={() => props.onAlignSelection("center")}>
              C
            </Button>
          </Tooltip>
          <Tooltip content="Align right">
            <Button size="2xs" variant="surface" onClick={() => props.onAlignSelection("right")}>
              R
            </Button>
          </Tooltip>
          <Tooltip content="Align top">
            <Button size="2xs" variant="surface" onClick={() => props.onAlignSelection("top")}>
              T
            </Button>
          </Tooltip>
          <Tooltip content="Align middle">
            <Button size="2xs" variant="surface" onClick={() => props.onAlignSelection("middle")}>
              M
            </Button>
          </Tooltip>
          <Tooltip content="Align bottom">
            <Button size="2xs" variant="surface" onClick={() => props.onAlignSelection("bottom")}>
              B
            </Button>
          </Tooltip>
          <Tooltip content="Distribute horizontal spacing">
            <Button size="2xs" variant="surface" onClick={() => props.onDistributeSelection("horizontal")}>
              DH
            </Button>
          </Tooltip>
          <Tooltip content="Distribute vertical spacing">
            <Button size="2xs" variant="surface" onClick={() => props.onDistributeSelection("vertical")}>
              DV
            </Button>
          </Tooltip>
        </HStack>
      </Show>

      <SnapControls
        mode={props.snapMode}
        onChange={props.onSnapModeChange}
      />

      <Show when={usesMeasureMode()}>
        <MeasureControls
          mode={props.measureMode}
          onChange={props.onMeasureModeChange}
        />
      </Show>

      <Show when={styleTool()}>
        {(tool) => (
          <>
            <Divider />
            <HStack gap="1" flexWrap="nowrap" flexShrink="0">
              <For each={stylePresetDefinitions}>
                {(preset) => (
                  <Tooltip content={preset.label}>
                    <Button
                      size="2xs"
                      variant="surface"
                      onClick={() => props.onStylePreset(preset.id)}
                    >
                      {preset.shortLabel}
                    </Button>
                  </Tooltip>
                )}
              </For>
              <Tooltip content={`Make current ${toolLabels[tool()]} style the default`}>
                <IconButton
                  aria-label="Make current style default"
                  size="xs"
                  variant="surface"
                  onClick={props.onMakeCurrentStyleDefault}
                >
                  <Save />
                </IconButton>
              </Tooltip>
            </HStack>

            <StyleVariantControls
              tool={tool()}
              settings={props.settings}
              onSettingsChange={props.onSettingsChange}
            />

            <ColorControls
              settings={props.settings}
              strokeOptions={strokeOptions()}
              fillOptions={fillOptions()}
              brandPalettes={props.brandPalettes}
              showFill={usesFill()}
              onSettingsChange={props.onSettingsChange}
              onCustomColorChange={props.onCustomColorChange}
            />

            <Show when={usesStrokeWidth()}>
              <StrokeControls
                value={props.settings.strokeWidth}
                onChange={(strokeWidth) => props.onSettingsChange({ strokeWidth })}
              />
            </Show>

            <Show when={usesFontSize()}>
              <FontSizeControls
                value={props.settings.fontSize}
                onChange={(fontSize) => props.onSettingsChange({ fontSize })}
              />
            </Show>
          </>
        )}
      </Show>

      <OpacityControls
        value={props.settings.opacity}
        onChange={(opacity) => props.onSettingsChange({ opacity })}
      />
    </HStack>
  );
};

const SnapControls = (props: {
  mode: "off" | "both" | "horizontal" | "vertical";
  onChange: (mode: "off" | "both" | "horizontal" | "vertical") => void;
}) => (
  <HStack
    role="radiogroup"
    aria-label="Object snapping"
    gap="0"
    p="0.5"
    borderRadius="l2"
    borderWidth="1px"
    borderColor="border"
    bg="bg.subtle"
    flexShrink="0"
  >
    <Button
      role="radio"
      aria-checked={props.mode === "off"}
      size="2xs"
      variant={props.mode === "off" ? "solid" : "plain"}
      colorPalette={props.mode === "off" ? "blue" : "gray"}
      onClick={() => props.onChange("off")}
    >
      Snap off
    </Button>
    <Button
      role="radio"
      aria-checked={props.mode === "horizontal"}
      size="2xs"
      variant={props.mode === "horizontal" ? "solid" : "plain"}
      colorPalette={props.mode === "horizontal" ? "blue" : "gray"}
      onClick={() => props.onChange("horizontal")}
    >
      X
    </Button>
    <Button
      role="radio"
      aria-checked={props.mode === "vertical"}
      size="2xs"
      variant={props.mode === "vertical" ? "solid" : "plain"}
      colorPalette={props.mode === "vertical" ? "blue" : "gray"}
      onClick={() => props.onChange("vertical")}
    >
      Y
    </Button>
    <Button
      role="radio"
      aria-checked={props.mode === "both"}
      size="2xs"
      variant={props.mode === "both" ? "solid" : "plain"}
      colorPalette={props.mode === "both" ? "blue" : "gray"}
      onClick={() => props.onChange("both")}
    >
      XY
    </Button>
  </HStack>
);

const MeasureControls = (props: {
  mode: MeasureMode;
  onChange: (mode: MeasureMode) => void;
}) => (
  <HStack
    role="radiogroup"
    aria-label="Measurement mode"
    gap="0"
    p="0.5"
    borderRadius="l2"
    borderWidth="1px"
    borderColor="border"
    bg="bg.subtle"
    flexShrink="0"
  >
    <Button
      role="radio"
      aria-checked={props.mode === "edge"}
      size="2xs"
      variant={props.mode === "edge" ? "solid" : "plain"}
      colorPalette={props.mode === "edge" ? "blue" : "gray"}
      onClick={() => props.onChange("edge")}
    >
      Edge
    </Button>
    <Button
      role="radio"
      aria-checked={props.mode === "point"}
      size="2xs"
      variant={props.mode === "point" ? "solid" : "plain"}
      colorPalette={props.mode === "point" ? "blue" : "gray"}
      onClick={() => props.onChange("point")}
    >
      Point
    </Button>
  </HStack>
);

const StyleVariantControls = (props: {
  tool: StylableImageEditorTool;
  settings: EditorSettings;
  onSettingsChange: (settings: Partial<EditorSettings>) => void;
}) => (
  <HStack gap="2" flexShrink="0">
    <Show when={props.tool === "arrow"}>
      <SimpleSelect
        items={[...arrowStyleItems]}
        value={props.settings.arrowStyle}
        onChange={(value) => props.onSettingsChange({ arrowStyle: value as ArrowStyle })}
        label="Arrow"
        labelPlacement="inline"
        size="xs"
        minW="36"
        sameWidth={false}
        skipPortal={false}
      />
    </Show>
    <Show when={props.tool === "rectangle"}>
      <SimpleSelect
        items={[...rectangleStyleItems]}
        value={props.settings.rectangleStyle}
        onChange={(value) => props.onSettingsChange({ rectangleStyle: value as RectangleStyle })}
        label="Box"
        labelPlacement="inline"
        size="xs"
        minW="36"
        sameWidth={false}
        skipPortal={false}
      />
    </Show>
    <Show when={props.tool === "text"}>
      <SimpleSelect
        items={[...textStyleItems]}
        value={props.settings.textStyle}
        onChange={(value) => props.onSettingsChange({ textStyle: value as TextAnnotationStyle })}
        label="Text"
        labelPlacement="inline"
        size="xs"
        minW="40"
        sameWidth={false}
        skipPortal={false}
      />
    </Show>
    <Show when={props.tool === "step"}>
      <SimpleSelect
        items={[...stepStyleItems]}
        value={props.settings.stepStyle}
        onChange={(value) => props.onSettingsChange({ stepStyle: value as StepMarkerStyle })}
        label="Step"
        labelPlacement="inline"
        size="xs"
        minW="38"
        sameWidth={false}
        skipPortal={false}
      />
    </Show>
  </HStack>
);

const ColorControls = (props: {
  settings: EditorSettings;
  strokeOptions: ColorOption[];
  fillOptions: ColorOption[];
  brandPalettes: BrandPalette[];
  showFill: boolean;
  onSettingsChange: (settings: Partial<EditorSettings>) => void;
  onCustomColorChange: (color: string, target: "stroke" | "fill") => void;
}) => (
  <HStack gap="2" flexWrap="nowrap" flexShrink="0">
    <HStack gap="1" flexWrap="nowrap">
      <For each={props.strokeOptions}>
        {(swatch) => (
          <SwatchButton
            label={swatch.label}
            value={swatch.value}
            selected={props.settings.color === swatch.value}
            onClick={() => props.onSettingsChange({ color: swatch.value })}
          />
        )}
      </For>
      <CustomColorInput
        label="Custom stroke color"
        value={colorToHexInput(props.settings.color)}
        onChange={(color) => props.onCustomColorChange(color, "stroke")}
      />
    </HStack>

    <Show when={props.showFill}>
      <Divider />
      <HStack gap="1" flexWrap="nowrap">
        <For each={props.fillOptions}>
          {(swatch) => (
            <SwatchButton
              label={swatch.label}
              value={swatch.value}
              selected={props.settings.fillColor === swatch.value}
              onClick={() => props.onSettingsChange({ fillColor: swatch.value })}
            />
          )}
        </For>
        <CustomColorInput
          label="Custom fill color"
          value={colorToHexInput(props.settings.fillColor)}
          onChange={(color) => props.onCustomColorChange(color, "fill")}
        />
      </HStack>
    </Show>

    <Show when={props.brandPalettes.length > 0}>
      <Divider />
      <HStack gap="1.5" flexWrap="nowrap">
        <For each={props.brandPalettes}>
          {(palette) => (
            <HStack gap="1" flexWrap="nowrap">
              <Box textStyle="xs" color="fg.muted">
                {palette.name}
              </Box>
              <For each={palette.colors}>
                {(color) => (
                  <SwatchButton
                    label={`${palette.name} color`}
                    value={color}
                    selected={props.settings.color === color}
                    onClick={() => props.onSettingsChange({ color })}
                  />
                )}
              </For>
              <Show when={props.showFill}>
                <For each={palette.fillColors ?? []}>
                  {(color) => (
                    <SwatchButton
                      label={`${palette.name} fill`}
                      value={color}
                      selected={props.settings.fillColor === color}
                      onClick={() => props.onSettingsChange({ fillColor: color })}
                    />
                  )}
                </For>
              </Show>
            </HStack>
          )}
        </For>
      </HStack>
    </Show>
  </HStack>
);

const StrokeControls = (props: {
  value: number;
  onChange: (value: number) => void;
}) => (
  <HStack gap="1" flexShrink="0">
    <Tooltip content="Thinner">
      <IconButton
        aria-label="Thinner stroke"
        size="xs"
        variant="surface"
        onClick={() => props.onChange(Math.max(1, props.value - 1))}
      >
        <Minus />
      </IconButton>
    </Tooltip>
    <For each={strokeWidthSteps}>
      {(value) => (
        <Button
          size="2xs"
          variant={props.value === value ? "solid" : "surface"}
          colorPalette={props.value === value ? "blue" : "gray"}
          onClick={() => props.onChange(value)}
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
        onClick={() => props.onChange(Math.min(36, props.value + 1))}
      >
        <Plus />
      </IconButton>
    </Tooltip>
  </HStack>
);

const FontSizeControls = (props: {
  value: number;
  onChange: (value: number) => void;
}) => (
  <HStack gap="1" flexShrink="0">
    <For each={fontSizeSteps}>
      {(value) => (
        <Button
          size="2xs"
          variant={props.value === value ? "solid" : "surface"}
          colorPalette={props.value === value ? "blue" : "gray"}
          onClick={() => props.onChange(value)}
        >
          {value}
        </Button>
      )}
    </For>
  </HStack>
);

const OpacityControls = (props: {
  value: number;
  onChange: (value: number) => void;
}) => (
  <HStack gap="1" flexWrap="nowrap" flexShrink="0">
    <Box textStyle="xs" color="fg.muted" mr="1">
      Opacity
    </Box>
    <For each={opacitySteps}>
      {(value) => (
        <Button
          size="2xs"
          variant={props.value === value ? "solid" : "surface"}
          colorPalette={props.value === value ? "blue" : "gray"}
          onClick={() => props.onChange(value)}
        >
          {Math.round(value * 100)}
        </Button>
      )}
    </For>
  </HStack>
);

const SwatchButton = (props: {
  label: string;
  value: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <Tooltip content={props.label}>
    <Box
      as="button"
      aria-label={props.label}
      width="7"
      height="7"
      borderRadius="l2"
      borderWidth={props.selected ? "3px" : "1px"}
      borderColor={props.selected ? "blue.9" : "border"}
      bg="bg.default"
      p="1"
      cursor="pointer"
      transitionProperty="box-shadow, border-color"
      transitionDuration="fast"
      _hover={{ boxShadow: "sm", borderColor: "blue.7" }}
      onClick={props.onClick}
    >
      <Box
        width="full"
        height="full"
        borderRadius="l1"
        borderWidth={props.value === "#ffffff" ? "1px" : "0"}
        borderColor="border"
        style={{ "background-color": props.value }}
      />
    </Box>
  </Tooltip>
);

const CustomColorInput = (props: {
  label: string;
  value: string;
  onChange: (color: string) => void;
}) => (
  <Tooltip content={props.label}>
    <Box
      as="label"
      aria-label={props.label}
      width="7"
      height="7"
      display="inline-grid"
      placeItems="center"
      borderRadius="l2"
      borderWidth="1px"
      borderColor="border"
      bg="bg.subtle"
      color="fg.muted"
      cursor="pointer"
      overflow="hidden"
      position="relative"
      _hover={{ boxShadow: "sm", borderColor: "blue.7" }}
    >
      <Palette size={14} />
      <input
        aria-label={props.label}
        type="color"
        value={props.value}
        style={{
          position: "absolute",
          inset: "0",
          opacity: 0,
          cursor: "pointer",
          width: "100%",
          height: "100%",
        }}
        onInput={(event) => props.onChange(event.currentTarget.value)}
      />
    </Box>
  </Tooltip>
);

const Divider = () => <Box width="1px" height="7" bg="border" flexShrink="0" />;

const annotationStyleTool = (
  annotation: ImageAnnotation | undefined,
): StylableImageEditorTool | undefined => {
  if (!annotation || annotation.type === "image") {
    return undefined;
  }

  return annotation.type;
};

const uniqueColorOptions = (options: readonly ColorOption[]) => {
  const seen = new Set<string>();

  return options.filter((option) => {
    const key = option.value.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};
