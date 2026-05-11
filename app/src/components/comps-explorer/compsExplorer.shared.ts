export type Combo = Record<string, string>;
export type GridMode = "single" | "grid1d" | "grid2d";
export type AxisLayout = "horizontal" | "vertical";
export type AxisSelection = { one?: string; x?: string; y?: string };

export type RecipeLike = {
  variants?: Record<string, Record<string, unknown>>;
  defaultVariants?: Record<string, string>;
};

export type RecipeMeta = {
  key: string;
  label: string;
  variantMap: Record<string, string[]>;
  defaultVariants: Record<string, string>;
};

export const ERROR_OVERLAY_COMPONENT_KEY = "error-overlay";
export const COMPS_EXPLORER_BASE_PATH = "/_internal/comps";
export const DESIGN_SYSTEM_COLORS_KEY = "design-system-colors";
export const DESIGN_SYSTEM_LAYOUT_KEY = "design-system-layout";
export const DESIGN_SYSTEM_TYPOGRAPHY_KEY = "design-system-typography";
export const DESIGN_SYSTEM_MOTION_KEY = "design-system-motion";
export const DESIGN_SYSTEM_EFFECTS_KEY = "design-system-effects";
export const SIMPLE_DIALOG_COMPONENT_KEY = "simpleDialog";
export const SIMPLE_POPOVER_COMPONENT_KEY = "simplePopover";
export const SIMPLE_SELECT_COMPONENT_KEY = "simpleSelect";
export const CLOSE_BUTTON_COMPONENT_KEY = "closeButton";
export const DISPLAY_VALUE_COMPONENT_KEY = "displayValue";
export const ICON_BUTTON_COMPONENT_KEY = "iconButton";
export const MARKDOWN_RENDERER_COMPONENT_KEY = "markdownRenderer";

export type ExplorerComponentLink = {
  key: string;
  label: string;
};

export const SIMPLE_COMPONENT_LINKS: ExplorerComponentLink[] = [
  { key: SIMPLE_DIALOG_COMPONENT_KEY, label: "Simple Dialog" },
  { key: SIMPLE_POPOVER_COMPONENT_KEY, label: "Simple Popover" },
  { key: SIMPLE_SELECT_COMPONENT_KEY, label: "Simple Select" },
];

export const DOCS_ONLY_COMPONENT_LINKS: ExplorerComponentLink[] = [
  { key: CLOSE_BUTTON_COMPONENT_KEY, label: "Close Button" },
  { key: DISPLAY_VALUE_COMPONENT_KEY, label: "Display Value" },
  { key: ICON_BUTTON_COMPONENT_KEY, label: "Icon Button" },
  { key: MARKDOWN_RENDERER_COMPONENT_KEY, label: "Markdown Renderer" },
];

export const friendlyName = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (letter) => letter.toUpperCase());

export const getVariantMap = (recipe: RecipeLike): Record<string, string[]> => {
  const variants = recipe.variants ?? {};

  return Object.fromEntries(
    Object.entries(variants)
      .map(([axis, options]) => [axis, Object.keys(options)])
      .filter(([, options]) => options.length > 0),
  );
};

export const resolveCombo = (recipe: RecipeMeta, selected: Combo): Combo => {
  const next: Combo = {};

  for (const [axis, options] of Object.entries(recipe.variantMap)) {
    const selectedValue = selected[axis];
    const defaultValue = recipe.defaultVariants[axis];

    if (selectedValue && options.includes(selectedValue)) {
      next[axis] = selectedValue;
      continue;
    }

    if (defaultValue && options.includes(defaultValue)) {
      next[axis] = defaultValue;
      continue;
    }

    if (options[0]) {
      next[axis] = options[0];
    }
  }

  return next;
};

export const compsExplorerPath = (componentKey?: string) =>
  componentKey
    ? `${COMPS_EXPLORER_BASE_PATH}/${componentKey}`
    : COMPS_EXPLORER_BASE_PATH;
