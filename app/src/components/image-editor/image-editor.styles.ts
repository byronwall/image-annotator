import {
  defaultEditorSettings,
  type BrandPalette,
  type EditorSettings,
  type ImageEditorProject,
  type ImageEditorTool,
  type StylePresetId,
  type StylableImageEditorTool,
} from "./image-editor.types";

export type StylePresetDefinition = {
  id: StylePresetId;
  label: string;
  shortLabel: string;
  settings: Partial<EditorSettings>;
  toolSettings?: Partial<Record<StylableImageEditorTool, Partial<EditorSettings>>>;
};

export type ImageEditorStylePreferences = {
  recentColors: string[];
  recentFillColors: string[];
  customColors: string[];
  brandPalettes: BrandPalette[];
  toolDefaults: Partial<Record<StylableImageEditorTool, EditorSettings>>;
};

const stylePreferencesStorageKey = "image-annotator.style-preferences.v1";
const maxRecentColors = 10;
const maxCustomColors = 12;

export const stylableTools = [
  "arrow",
  "line",
  "rectangle",
  "ellipse",
  "pen",
  "highlighter",
  "text",
  "step",
  "measure",
  "erase",
  "pixelate",
] as const satisfies readonly StylableImageEditorTool[];

export const defaultBrandPalettes: BrandPalette[] = [
  {
    id: "product",
    name: "Product",
    colors: ["#2563eb", "#0891b2", "#16a34a", "#111827"],
    fillColors: [
      "rgba(37, 99, 235, 0.12)",
      "rgba(8, 145, 178, 0.12)",
      "rgba(22, 163, 74, 0.12)",
    ],
  },
  {
    id: "bug-review",
    name: "Bug",
    colors: ["#dc2626", "#f59e0b", "#7c2d12", "#111827"],
    fillColors: [
      "rgba(220, 38, 38, 0.14)",
      "rgba(245, 158, 11, 0.18)",
      "rgba(124, 45, 18, 0.12)",
    ],
  },
  {
    id: "docs",
    name: "Docs",
    colors: ["#0f172a", "#475569", "#2563eb", "#ffffff"],
    fillColors: [
      "rgba(255, 255, 255, 0.94)",
      "rgba(15, 23, 42, 0.08)",
      "rgba(37, 99, 235, 0.1)",
    ],
  },
];

export const defaultToolStyleDefaults: Record<StylableImageEditorTool, EditorSettings> = {
  line: {
    ...defaultEditorSettings,
    arrowStyle: "line-only",
  },
  arrow: {
    ...defaultEditorSettings,
    arrowStyle: "straight",
  },
  rectangle: {
    ...defaultEditorSettings,
    rectangleStyle: "rounded",
  },
  ellipse: {
    ...defaultEditorSettings,
    rectangleStyle: "translucent",
  },
  pen: {
    ...defaultEditorSettings,
    color: "#7c3aed",
    strokeWidth: 3,
  },
  highlighter: {
    ...defaultEditorSettings,
    color: "#f59e0b",
    strokeWidth: 5,
    opacity: 0.5,
  },
  text: {
    ...defaultEditorSettings,
    color: "#0f172a",
    fillColor: "rgba(255, 255, 255, 0.94)",
    fontSize: 28,
    textStyle: "light-label",
  },
  step: {
    ...defaultEditorSettings,
    color: "#2563eb",
    fontSize: 28,
    stepStyle: "circle",
  },
  measure: {
    ...defaultEditorSettings,
    color: "#0ea5e9",
    strokeWidth: 3,
  },
  erase: {
    ...defaultEditorSettings,
    color: "#0f172a",
    fillColor: "rgba(255, 255, 255, 0)",
    strokeWidth: 4,
  },
  pixelate: {
    ...defaultEditorSettings,
    color: "#0f172a",
    fillColor: "rgba(255, 255, 255, 0)",
    strokeWidth: 4,
  },
};

export const stylePresetDefinitions: readonly StylePresetDefinition[] = [
  {
    id: "product-callout",
    label: "Product callout",
    shortLabel: "Product",
    settings: {
      color: "#2563eb",
      fillColor: "rgba(37, 99, 235, 0.12)",
      strokeWidth: 4,
      fontSize: 28,
      opacity: 1,
      arrowStyle: "soft-shadow",
      rectangleStyle: "rounded",
      textStyle: "pill",
      stepStyle: "circle",
    },
  },
  {
    id: "bug-highlight",
    label: "Bug highlight",
    shortLabel: "Bug",
    settings: {
      color: "#dc2626",
      fillColor: "rgba(220, 38, 38, 0.14)",
      strokeWidth: 5,
      fontSize: 30,
      opacity: 1,
      arrowStyle: "double-ended",
      rectangleStyle: "translucent",
      textStyle: "warning-label",
      stepStyle: "large-tutorial",
    },
    toolSettings: {
      highlighter: {
        color: "#f59e0b",
        strokeWidth: 5,
        opacity: 0.5,
      },
    },
  },
  {
    id: "docs-style",
    label: "Docs style",
    shortLabel: "Docs",
    settings: {
      color: "#0f172a",
      fillColor: "rgba(255, 255, 255, 0.94)",
      strokeWidth: 3,
      fontSize: 26,
      opacity: 1,
      arrowStyle: "elbow",
      rectangleStyle: "label-badge",
      textStyle: "light-label",
      stepStyle: "pill",
    },
  },
  {
    id: "hand-drawn-review",
    label: "Hand-drawn review",
    shortLabel: "Drawn",
    settings: {
      color: "#7c3aed",
      fillColor: "rgba(124, 58, 237, 0.1)",
      strokeWidth: 5,
      fontSize: 28,
      opacity: 0.95,
      arrowStyle: "hand-drawn",
      rectangleStyle: "rounded",
      textStyle: "pill",
      stepStyle: "circle",
    },
  },
  {
    id: "subtle-qa",
    label: "Subtle QA mark",
    shortLabel: "QA",
    settings: {
      color: "#0891b2",
      fillColor: "rgba(255, 255, 255, 0)",
      strokeWidth: 2,
      fontSize: 22,
      opacity: 0.72,
      arrowStyle: "line-only",
      rectangleStyle: "outline-only",
      textStyle: "none",
      stepStyle: "small-badge",
    },
  },
];

export const isStylableTool = (
  tool: ImageEditorTool,
): tool is StylableImageEditorTool =>
  stylableTools.includes(tool as StylableImageEditorTool);

export const defaultStylePreferences = (): ImageEditorStylePreferences => ({
  recentColors: [],
  recentFillColors: [],
  customColors: [],
  brandPalettes: defaultBrandPalettes,
  toolDefaults: defaultToolStyleDefaults,
});

export const toolDefaultSettings = (
  tool: StylableImageEditorTool,
  preferences: ImageEditorStylePreferences,
): EditorSettings => ({
  ...defaultToolStyleDefaults[tool],
  ...preferences.toolDefaults[tool],
});

export const settingsForStylePreset = (
  tool: StylableImageEditorTool,
  presetId: StylePresetId,
): Partial<EditorSettings> => {
  const preset = stylePresetDefinitions.find((definition) => definition.id === presetId);

  if (!preset) {
    return {};
  }

  return {
    ...preset.settings,
    ...preset.toolSettings?.[tool],
  };
};

export const loadStylePreferences = (
  project?: ImageEditorProject,
): ImageEditorStylePreferences => {
  const fallback = defaultStylePreferences();

  if (typeof localStorage === "undefined") {
    return mergeProjectStylePreferences(fallback, project);
  }

  try {
    const raw = localStorage.getItem(stylePreferencesStorageKey);

    if (!raw) {
      return mergeProjectStylePreferences(fallback, project);
    }

    const parsed = JSON.parse(raw) as Partial<ImageEditorStylePreferences>;

    return mergeProjectStylePreferences(
      {
        recentColors: sanitizeColorList(parsed.recentColors),
        recentFillColors: sanitizeColorList(parsed.recentFillColors),
        customColors: sanitizeColorList(parsed.customColors),
        brandPalettes: sanitizeBrandPalettes(parsed.brandPalettes) ?? fallback.brandPalettes,
        toolDefaults: sanitizeToolDefaults(parsed.toolDefaults),
      },
      project,
    );
  } catch {
    return mergeProjectStylePreferences(fallback, project);
  }
};

export const saveStylePreferences = (preferences: ImageEditorStylePreferences) => {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.setItem(stylePreferencesStorageKey, JSON.stringify(preferences));
  } catch {
    return;
  }
};

export const withRecentColor = (
  preferences: ImageEditorStylePreferences,
  color: string,
  kind: "stroke" | "fill",
): ImageEditorStylePreferences => {
  const listKey = kind === "stroke" ? "recentColors" : "recentFillColors";

  return {
    ...preferences,
    [listKey]: prependUniqueColor(preferences[listKey], color, maxRecentColors),
  };
};

export const withCustomColor = (
  preferences: ImageEditorStylePreferences,
  color: string,
): ImageEditorStylePreferences => ({
  ...preferences,
  customColors: prependUniqueColor(preferences.customColors, color, maxCustomColors),
});

export const mergeBrandPalettes = (
  preferences: ImageEditorStylePreferences,
  project?: ImageEditorProject,
): BrandPalette[] => {
  const projectPalettes = sanitizeBrandPalettes(project?.stylePalettes) ?? [];
  const merged = [...projectPalettes, ...preferences.brandPalettes];
  const seen = new Set<string>();

  return merged.filter((palette) => {
    const key = palette.id || palette.name;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

export const colorToHexInput = (color: string, fallback = "#2563eb") => {
  if (/^#[\da-f]{6}$/i.test(color)) {
    return color;
  }

  const rgba = color.match(
    /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+[\d.]+)?\s*\)/i,
  );

  if (!rgba) {
    return fallback;
  }

  const toHex = (value: string | undefined) =>
    Math.max(0, Math.min(255, Number(value ?? 0)))
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(rgba[1])}${toHex(rgba[2])}${toHex(rgba[3])}`;
};

export const hexToFillColor = (color: string, alpha = 0.16) => {
  const hex = colorToHexInput(color);
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const mergeProjectStylePreferences = (
  preferences: ImageEditorStylePreferences,
  project?: ImageEditorProject,
): ImageEditorStylePreferences => ({
  ...preferences,
  brandPalettes: mergeBrandPalettes(preferences, project),
  toolDefaults: {
    ...preferences.toolDefaults,
    ...sanitizeToolDefaults(project?.styleDefaults),
  },
});

const sanitizeColorList = (colors: unknown): string[] =>
  Array.isArray(colors)
    ? colors.filter((color): color is string => typeof color === "string").slice(0, 16)
    : [];

const sanitizeBrandPalettes = (palettes: unknown): BrandPalette[] | undefined => {
  if (!Array.isArray(palettes)) {
    return undefined;
  }

  return palettes
    .filter((palette): palette is BrandPalette => {
      if (!palette || typeof palette !== "object") {
        return false;
      }

      const candidate = palette as Partial<BrandPalette>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.name === "string" &&
        Array.isArray(candidate.colors)
      );
    })
    .map((palette) => ({
      id: palette.id,
      name: palette.name,
      colors: sanitizeColorList(palette.colors),
      fillColors: sanitizeColorList(palette.fillColors),
    }))
    .filter((palette) => palette.colors.length > 0);
};

const sanitizeToolDefaults = (
  toolDefaults: unknown,
): Partial<Record<StylableImageEditorTool, EditorSettings>> => {
  if (!toolDefaults || typeof toolDefaults !== "object") {
    return {};
  }

  return Object.fromEntries(
    stylableTools.flatMap((tool) => {
      const settings = (toolDefaults as Partial<Record<StylableImageEditorTool, unknown>>)[tool];

      if (!settings || typeof settings !== "object") {
        return [];
      }

      return [[tool, { ...defaultToolStyleDefaults[tool], ...settings }]];
    }),
  ) as Partial<Record<StylableImageEditorTool, EditorSettings>>;
};

const prependUniqueColor = (colors: string[], color: string, limit: number) => {
  const normalized = color.trim();

  if (!normalized) {
    return colors;
  }

  return [
    normalized,
    ...colors.filter((candidate) => candidate.toLowerCase() !== normalized.toLowerCase()),
  ].slice(0, limit);
};
