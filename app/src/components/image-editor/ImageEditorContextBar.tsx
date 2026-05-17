import {
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  ChevronsDown,
  ChevronsUp,
  ClipboardCopy,
  ClipboardPaste,
  Copy,
  Edit3,
  Minus,
  Move,
  Palette,
  Plus,
  Save,
  Trash2,
} from "lucide-solid";
import { For, Show, createSignal, type JSX } from "solid-js";
import { Portal } from "solid-js/web";
import { Box, HStack, VStack } from "styled-system/jsx";
import { Button } from "~/components/ui/button";
import { IconButton } from "~/components/ui/icon-button";
import * as Menu from "~/components/ui/menu";
import * as Popover from "~/components/ui/popover";
import { SimplePopover } from "~/components/ui/simple-popover";
import { Tooltip } from "~/components/ui/tooltip";
import {
  colorToHexInput,
  isStylableTool,
  stylePresetDefinitions,
} from "./image-editor.styles";
import {
  type ArrowAnnotation,
  type AttachedText,
  type BoxAnnotation,
  type ArrowStyle,
  type BrandPalette,
  type EditorSettings,
  type ImageAnnotation,
  type ImageEditorTool,
  type RectangleStyle,
  type StepMarkerStyle,
  type StylePresetId,
  type StylableImageEditorTool,
  type TextHorizontalAlign,
  type TextAnnotationStyle,
  type TextVerticalAlign,
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

const strokeWidthPresets = [1, 2, 4, 8, 12, 16, 24] as const;
const fontSizePresets = [12, 16, 20, 24, 28, 36, 48, 64] as const;
const opacityPresets = [0.1, 0.25, 0.5, 0.75, 1] as const;

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
  settings: EditorSettings;
  recentColors: string[];
  recentFillColors: string[];
  customColors: string[];
  brandPalettes: BrandPalette[];
  canPasteStyle: boolean;
  onSettingsChange: (settings: Partial<EditorSettings>) => void;
  onStylePreset: (preset: StylePresetId) => void;
  onAttachedTextChange: (settings: Partial<AttachedText>) => void;
  onCustomColorChange: (color: string, target: "stroke" | "fill") => void;
  onMakeCurrentStyleDefault: () => void;
  onCopyStyle: () => void;
  onPasteStyle: () => void;
  onAlignSelection: (command: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  onDistributeSelection: (axis: "horizontal" | "vertical") => void;
  onStartInlineEdit: () => void;
  onDuplicateSelected: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onDeleteSelected: () => void;
};

export const ImageEditorContextBar = (props: ImageEditorContextBarProps) => {
  const [styleOpen, setStyleOpen] = createSignal(false);
  const hasSelection = () => props.selectedCount > 0;
  const styleTool = () =>
    annotationStyleTool(props.selectedAnnotation) ??
    (isStylableTool(props.activeTool) ? props.activeTool : undefined);
  const attachedText = () =>
    props.selectedAnnotation && isAnnotationWithAttachedText(props.selectedAnnotation)
      ? props.selectedAnnotation.text
      : undefined;
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
      flexWrap="nowrap"
      whiteSpace="nowrap"
      style={props.style}
    >
      <HStack gap="2" minW="0" flexShrink="0">
        <Box fontWeight="semibold" textStyle="sm" minW="0" maxW="28" overflow="hidden" textOverflow="ellipsis">
          {title()}
        </Box>
        <Show when={hasSelection()}>
          <LayerActionMenu
            canEdit={
              props.selectedCount === 1 &&
              props.selectedAnnotation !== undefined &&
              canInlineEditAnnotation(props.selectedAnnotation)
            }
            editLabel={inlineEditLabel(props.selectedAnnotation)}
            canPasteStyle={props.canPasteStyle}
            onStartInlineEdit={props.onStartInlineEdit}
            onSendBackward={props.onSendBackward}
            onBringForward={props.onBringForward}
            onDuplicateSelected={props.onDuplicateSelected}
            onDeleteSelected={props.onDeleteSelected}
          />
        </Show>
      </HStack>

      <Show when={props.selectedCount > 1}>
        <Menu.Root positioning={{ placement: "bottom-start" }} size="sm">
          <Menu.Trigger
            asChild={(triggerProps) => (
              <Button {...triggerProps()} size="2xs" variant="surface">
                <Move />
                Arrange
              </Button>
            )}
          />
          <Portal>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.ItemGroup>
                  <Menu.ItemGroupLabel>Align</Menu.ItemGroupLabel>
                  <Menu.Item value="align-left" onClick={() => props.onAlignSelection("left")}>
                    <Menu.ItemText>Left</Menu.ItemText>
                  </Menu.Item>
                  <Menu.Item value="align-center" onClick={() => props.onAlignSelection("center")}>
                    <Menu.ItemText>Center</Menu.ItemText>
                  </Menu.Item>
                  <Menu.Item value="align-right" onClick={() => props.onAlignSelection("right")}>
                    <Menu.ItemText>Right</Menu.ItemText>
                  </Menu.Item>
                  <Menu.Item value="align-top" onClick={() => props.onAlignSelection("top")}>
                    <Menu.ItemText>Top</Menu.ItemText>
                  </Menu.Item>
                  <Menu.Item value="align-middle" onClick={() => props.onAlignSelection("middle")}>
                    <Menu.ItemText>Middle</Menu.ItemText>
                  </Menu.Item>
                  <Menu.Item value="align-bottom" onClick={() => props.onAlignSelection("bottom")}>
                    <Menu.ItemText>Bottom</Menu.ItemText>
                  </Menu.Item>
                </Menu.ItemGroup>
                <Menu.Separator />
                <Menu.ItemGroup>
                  <Menu.ItemGroupLabel>Distribute</Menu.ItemGroupLabel>
                  <Menu.Item value="distribute-h" onClick={() => props.onDistributeSelection("horizontal")}>
                    <Menu.ItemText>Horizontal spacing</Menu.ItemText>
                  </Menu.Item>
                  <Menu.Item value="distribute-v" onClick={() => props.onDistributeSelection("vertical")}>
                    <Menu.ItemText>Vertical spacing</Menu.ItemText>
                  </Menu.Item>
                </Menu.ItemGroup>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      </Show>

      <Show when={styleTool()}>
        {(tool) => (
          <>
            <Divider />
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

            <Show when={attachedText()}>
              {(text) => (
                <AttachedTextControls
                  text={text()}
                  onChange={props.onAttachedTextChange}
                />
              )}
            </Show>

            <OpacityControls
              value={props.settings.opacity}
              onChange={(opacity) => props.onSettingsChange({ opacity })}
            />

            <SimplePopover
              open={styleOpen()}
              onClose={() => setStyleOpen(false)}
              placement="bottom-end"
              style={{ width: "min(560px, calc(100vw - 32px))" }}
              anchor={
                <CompactColorPreview
                  color={props.settings.color}
                  fillColor={props.settings.fillColor}
                  showFill={usesFill()}
                  onOpen={() => setStyleOpen(true)}
                />
              }
            >
              <Popover.Arrow />
              <Popover.Body>
                <Popover.Title>{toolLabels[tool()]} style</Popover.Title>
                <VStack alignItems="stretch" gap="3" maxW="xl">
                  <HStack gap="1" flexWrap="wrap">
                    <For each={stylePresetDefinitions}>
                      {(preset) => (
                        <Tooltip content={preset.label}>
                          <Button
                            size="xs"
                            variant="surface"
                            onClick={() => props.onStylePreset(preset.id)}
                          >
                            {preset.shortLabel}
                          </Button>
                        </Tooltip>
                      )}
                    </For>
                    <Tooltip content="Copy style">
                      <IconButton
                        aria-label="Copy style"
                        size="sm"
                        variant="surface"
                        onClick={props.onCopyStyle}
                      >
                        <ClipboardCopy />
                      </IconButton>
                    </Tooltip>
                    <Tooltip content="Paste style">
                      <IconButton
                        aria-label="Paste style"
                        size="sm"
                        variant="surface"
                        disabled={!props.canPasteStyle}
                        onClick={props.onPasteStyle}
                      >
                        <ClipboardPaste />
                      </IconButton>
                    </Tooltip>
                    <Tooltip content={`Make current ${toolLabels[tool()]} style the default`}>
                      <IconButton
                        aria-label="Make current style default"
                        size="sm"
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
                </VStack>
              </Popover.Body>
            </SimplePopover>
          </>
        )}
      </Show>
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
      <Show when={props.active}>*</Show>
    </Box>
    <Menu.ItemText>{props.children}</Menu.ItemText>
  </Menu.Item>
);

function LayerActionMenu(props: {
  canEdit: boolean;
  editLabel: string;
  canPasteStyle: boolean;
  onStartInlineEdit: () => void;
  onSendBackward: () => void;
  onBringForward: () => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
}) {
  return (
    <Menu.Root positioning={{ placement: "bottom-start" }} size="sm">
      <Menu.Trigger
        asChild={(triggerProps) => (
          <Button {...triggerProps()} size="2xs" variant="surface">
            <Move />
            Layer
          </Button>
        )}
      />
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <Show when={props.canEdit}>
              <Menu.Item value="edit" onClick={props.onStartInlineEdit}>
                <Edit3 />
                <Menu.ItemText>{props.editLabel}</Menu.ItemText>
              </Menu.Item>
              <Menu.Separator />
            </Show>
            <Menu.Item value="send-backward" onClick={props.onSendBackward}>
              <ChevronsDown />
              <Menu.ItemText>Send backward</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="bring-forward" onClick={props.onBringForward}>
              <ChevronsUp />
              <Menu.ItemText>Bring forward</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="duplicate" onClick={props.onDuplicateSelected}>
              <Copy />
              <Menu.ItemText>Duplicate</Menu.ItemText>
            </Menu.Item>
            <Menu.Separator />
            <Menu.Item value="delete" onClick={props.onDeleteSelected}>
              <Trash2 />
              <Menu.ItemText>Delete layer</Menu.ItemText>
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}

const StyleVariantControls = (props: {
  tool: StylableImageEditorTool;
  settings: EditorSettings;
  onSettingsChange: (settings: Partial<EditorSettings>) => void;
}) => (
  <VStack alignItems="start" gap="2">
    <Show when={props.tool === "arrow"}>
      <VariantButtonGroup
        label="Arrow"
        items={[...arrowStyleItems]}
        value={props.settings.arrowStyle}
        onChange={(value) => props.onSettingsChange({ arrowStyle: value as ArrowStyle })}
      />
    </Show>
    <Show when={props.tool === "rectangle"}>
      <VariantButtonGroup
        label="Box"
        items={[...rectangleStyleItems]}
        value={props.settings.rectangleStyle}
        onChange={(value) => props.onSettingsChange({ rectangleStyle: value as RectangleStyle })}
      />
    </Show>
    <Show when={props.tool === "text"}>
      <VariantButtonGroup
        label="Text"
        items={[...textStyleItems]}
        value={props.settings.textStyle}
        onChange={(value) => props.onSettingsChange({ textStyle: value as TextAnnotationStyle })}
      />
    </Show>
    <Show when={props.tool === "step"}>
      <VariantButtonGroup
        label="Step"
        items={[...stepStyleItems]}
        value={props.settings.stepStyle}
        onChange={(value) => props.onSettingsChange({ stepStyle: value as StepMarkerStyle })}
      />
    </Show>
  </VStack>
);

const VariantButtonGroup = (props: {
  label: string;
  items: readonly { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}) => (
  <HStack alignItems="center" gap="2" flexWrap="wrap">
    <Box textStyle="xs" color="fg.muted" minW="10">
      {props.label}
    </Box>
    <HStack gap="1" flexWrap="wrap">
      <For each={props.items}>
        {(item) => (
          <Button
            size="xs"
            variant={props.value === item.value ? "solid" : "surface"}
            colorPalette={props.value === item.value ? "blue" : "gray"}
            onClick={() => props.onChange(item.value)}
          >
            {item.label}
          </Button>
        )}
      </For>
    </HStack>
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
  <HStack gap="2" flexWrap="wrap" flexShrink="1" minW="0">
    <HStack gap="1" flexWrap="wrap">
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
      <HStack gap="1" flexWrap="wrap">
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
      <HStack gap="1.5" flexWrap="wrap">
        <For each={props.brandPalettes}>
          {(palette) => (
            <HStack gap="1" flexWrap="wrap">
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
  <HStack gap="0.5" flexShrink="0">
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
    <PresetValueMenu
      label="Stroke width"
      value={`${props.value}px`}
      options={strokeWidthPresets.map((value) => ({
        label: `${value}px`,
        value,
      }))}
      selectedValue={props.value}
      onChange={props.onChange}
    />
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
  <HStack gap="0.5" flexShrink="0">
    <Tooltip content="Smaller text">
      <IconButton
        aria-label="Smaller text"
        size="xs"
        variant="surface"
        onClick={() => props.onChange(Math.max(8, props.value - 2))}
      >
        <Minus />
      </IconButton>
    </Tooltip>
    <PresetValueMenu
      label="Text size"
      value={`${props.value}px`}
      options={fontSizePresets.map((value) => ({
        label: `${value}px`,
        value,
      }))}
      selectedValue={props.value}
      onChange={props.onChange}
    />
    <Tooltip content="Larger text">
      <IconButton
        aria-label="Larger text"
        size="xs"
        variant="surface"
        onClick={() => props.onChange(Math.min(96, props.value + 2))}
      >
        <Plus />
      </IconButton>
    </Tooltip>
  </HStack>
);

const AttachedTextControls = (props: {
  text: AttachedText;
  onChange: (settings: Partial<AttachedText>) => void;
}) => (
  <HStack gap="1" flexShrink="0">
    <Divider />
    <Box textStyle="xs" color="fg.muted">
      Label
    </Box>
    <FontSizeControls
      value={props.text.fontSize}
      onChange={(fontSize) => props.onChange({ fontSize })}
    />
    <LabelAlignmentMenu
      horizontalAlign={props.text.textAlign ?? "center"}
      verticalAlign={props.text.verticalAlign ?? "middle"}
      onHorizontalAlignChange={(textAlign) => props.onChange({ textAlign })}
      onVerticalAlignChange={(verticalAlign) => props.onChange({ verticalAlign })}
    />
  </HStack>
);

const horizontalAlignOptions = [
  {
    label: "Left",
    value: "left",
    icon: () => <AlignHorizontalJustifyStart />,
  },
  {
    label: "Center",
    value: "center",
    icon: () => <AlignHorizontalJustifyCenter />,
  },
  {
    label: "Right",
    value: "right",
    icon: () => <AlignHorizontalJustifyEnd />,
  },
] as const;

const verticalAlignOptions = [
  {
    label: "Top",
    value: "top",
    icon: () => <AlignVerticalJustifyStart />,
  },
  {
    label: "Middle",
    value: "middle",
    icon: () => <AlignVerticalJustifyCenter />,
  },
  {
    label: "Bottom",
    value: "bottom",
    icon: () => <AlignVerticalJustifyEnd />,
  },
] as const;

const LabelAlignmentMenu = (props: {
  horizontalAlign: TextHorizontalAlign;
  verticalAlign: TextVerticalAlign;
  onHorizontalAlignChange: (value: TextHorizontalAlign) => void;
  onVerticalAlignChange: (value: TextVerticalAlign) => void;
}) => (
  <Menu.Root positioning={{ placement: "bottom-start" }} size="sm">
    <Menu.Trigger
      asChild={(triggerProps) => (
        <Button {...triggerProps()} size="2xs" variant="surface">
          <AlignHorizontalJustifyCenter />
          Align
        </Button>
      )}
    />
    <Portal>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.ItemGroup>
            <Menu.ItemGroupLabel>Horizontal</Menu.ItemGroupLabel>
            <For each={horizontalAlignOptions}>
              {(option) => (
                <AlignmentMenuItem
                  active={props.horizontalAlign === option.value}
                  value={`label-align-x-${option.value}`}
                  onClick={() => props.onHorizontalAlignChange(option.value)}
                  icon={option.icon}
                >
                  {option.label}
                </AlignmentMenuItem>
              )}
            </For>
          </Menu.ItemGroup>
          <Menu.Separator />
          <Menu.ItemGroup>
            <Menu.ItemGroupLabel>Vertical</Menu.ItemGroupLabel>
            <For each={verticalAlignOptions}>
              {(option) => (
                <AlignmentMenuItem
                  active={props.verticalAlign === option.value}
                  value={`label-align-y-${option.value}`}
                  onClick={() => props.onVerticalAlignChange(option.value)}
                  icon={option.icon}
                >
                  {option.label}
                </AlignmentMenuItem>
              )}
            </For>
          </Menu.ItemGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Portal>
  </Menu.Root>
);

const AlignmentMenuItem = (props: {
  active: boolean;
  value: string;
  onClick: () => void;
  icon: () => JSX.Element;
  children: JSX.Element;
}) => (
  <Menu.Item value={props.value} onClick={props.onClick}>
    <Box display="inline-flex" alignItems="center" color="fg.muted">
      {props.icon()}
    </Box>
    <Menu.ItemText>{props.children}</Menu.ItemText>
    <Box as="span" aria-hidden="true" marginInlineStart="auto" color="blue.9">
      <Show when={props.active}>*</Show>
    </Box>
  </Menu.Item>
);

const OpacityControls = (props: {
  value: number;
  onChange: (value: number) => void;
}) => (
  <HStack gap="0.5" flexWrap="nowrap" flexShrink="0">
    <Tooltip content="Less opaque">
      <IconButton
        aria-label="Less opaque"
        size="xs"
        variant="surface"
        onClick={() => props.onChange(Math.max(0.1, roundToStep(props.value - 0.1)))}
      >
        <Minus />
      </IconButton>
    </Tooltip>
    <PresetValueMenu
      label="Opacity"
      value={`${Math.round(props.value * 100)}%`}
      options={opacityPresets.map((value) => ({
        label: `${Math.round(value * 100)}%`,
        value,
      }))}
      selectedValue={props.value}
      onChange={props.onChange}
    />
    <Tooltip content="More opaque">
      <IconButton
        aria-label="More opaque"
        size="xs"
        variant="surface"
        onClick={() => props.onChange(Math.min(1, roundToStep(props.value + 0.1)))}
      >
        <Plus />
      </IconButton>
    </Tooltip>
  </HStack>
);

const PresetValueMenu = (props: {
  label: string;
  value: string;
  options: { label: string; value: number }[];
  selectedValue: number;
  onChange: (value: number) => void;
}) => (
  <Menu.Root positioning={{ placement: "bottom-start" }} size="sm">
    <Menu.Trigger
      asChild={(triggerProps) => (
        <Box
          {...triggerProps()}
          as="button"
          aria-label={`${props.label}: ${props.value}`}
          minW="10"
          px="1.5"
          py="0.5"
          borderRadius="l1"
          borderWidth="1px"
          borderColor="border"
          bg="bg.subtle"
          cursor="pointer"
          textStyle="xs"
          textAlign="center"
          fontVariantNumeric="tabular-nums"
          _hover={{ borderColor: "blue.7", boxShadow: "sm" }}
        >
          {props.value}
        </Box>
      )}
    />
    <Portal>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.ItemGroup>
            <Menu.ItemGroupLabel>{props.label}</Menu.ItemGroupLabel>
            <For each={props.options}>
              {(option) => (
                <SnapMenuItem
                  active={props.selectedValue === option.value}
                  value={`${props.label}-${option.value}`}
                  onClick={() => props.onChange(option.value)}
                >
                  {option.label}
                </SnapMenuItem>
              )}
            </For>
          </Menu.ItemGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Portal>
  </Menu.Root>
);

const CompactColorPreview = (props: {
  color: string;
  fillColor: string;
  showFill: boolean;
  onOpen: () => void;
}) => (
  <Tooltip content="Style colors">
    <Box
      as="button"
      aria-label="Style colors"
      display="inline-flex"
      alignItems="center"
      gap="1"
      height="7"
      px="1.5"
      borderRadius="l2"
      borderWidth="1px"
      borderColor="border"
      bg="bg.subtle"
      cursor="pointer"
      _hover={{ borderColor: "blue.7", boxShadow: "sm" }}
      onClick={props.onOpen}
    >
      <ColorChip value={props.color} label="Stroke color" />
      <Show when={props.showFill}>
        <ColorChip value={props.fillColor} label="Fill color" />
      </Show>
    </Box>
  </Tooltip>
);

const ColorChip = (props: { value: string; label: string }) => (
  <Box
    aria-label={props.label}
    width="4"
    height="4"
    borderRadius="l1"
    borderWidth={props.value === "#ffffff" ? "1px" : "0"}
    borderColor="border"
    style={{ "background-color": props.value }}
  />
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

const roundToStep = (value: number) => Math.round(value * 10) / 10;

const Divider = () => <Box width="1px" height="7" bg="border" flexShrink="0" />;

const annotationStyleTool = (
  annotation: ImageAnnotation | undefined,
): StylableImageEditorTool | undefined => {
  if (!annotation || annotation.type === "image") {
    return undefined;
  }

  return annotation.type;
};

const isAnnotationWithAttachedText = (
  annotation: ImageAnnotation,
): annotation is ArrowAnnotation | BoxAnnotation =>
  annotation.type === "arrow" ||
  annotation.type === "rectangle" ||
  annotation.type === "ellipse" ||
  annotation.type === "pixelate" ||
  annotation.type === "erase";

const canInlineEditAnnotation = (annotation: ImageAnnotation) =>
  annotation.type === "text" ||
  annotation.type === "step" ||
  isAnnotationWithAttachedText(annotation);

const inlineEditLabel = (annotation: ImageAnnotation | undefined) =>
  annotation?.type === "text"
    ? "Edit text"
    : annotation?.type === "step"
      ? "Edit step"
      : "Edit label";

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
