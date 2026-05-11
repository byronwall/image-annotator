import { For, Show, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { css } from "styled-system/css";
import { Box, HStack, VStack } from "styled-system/jsx";
import { token } from "styled-system/tokens";
import { Button } from "~/components/ui/button";
import * as Collapsible from "~/components/ui/collapsible";
import * as Table from "~/components/ui/table";
import { Tooltip } from "~/components/ui/tooltip";
import { recipes } from "~/theme/recipes";

type RecipeLike = {
  variants?: Record<string, Record<string, unknown>>;
};

type ParsedColorToken = {
  cssVar: string;
  palette: string;
  key: string;
  tokenPath: string;
};
type ResolvedColorInfo = {
  raw: string;
  computedRgb: string;
  hex: string;
  hsl: string;
};

type SizeMetric = {
  token: string;
  rawValue: string;
  pxValue: number | null;
  remValue: number | null;
  isTextual: boolean;
};

type SizeDisplayUnit = "rem" | "px";

type TypographyCssVars = {
  fonts: string[];
  fontSizes: string[];
  fontWeights: string[];
  lineHeights: string[];
  letterSpacings: string[];
};
type ThemeCategory = {
  key: string;
  label: string;
  group: "layout" | "motion" | "effects";
  tokenCategory: string;
  tokens: Array<{
    token: string;
    value: string | number;
    numericValue: number | null;
    isAlias: boolean;
  }>;
};

const THEME_CATEGORY_CONFIG = [
  {
    key: "radii",
    label: "Radii",
    prefix: "--radii-",
    tokenCategory: "radii",
    group: "layout",
  },
  {
    key: "shadows",
    label: "Shadows",
    prefix: "--shadows-",
    tokenCategory: "shadows",
    group: "effects",
  },
  {
    key: "durations",
    label: "Durations",
    prefix: "--durations-",
    tokenCategory: "durations",
    group: "motion",
  },
  {
    key: "zIndex",
    label: "Z Index",
    prefix: "--z-index-",
    tokenCategory: "zIndex",
    group: "layout",
  },
  {
    key: "easings",
    label: "Easings",
    prefix: "--easings-",
    tokenCategory: "easings",
    group: "motion",
  },
  {
    key: "animations",
    label: "Animations",
    prefix: "--animations-",
    tokenCategory: "animations",
    group: "motion",
  },
  {
    key: "breakpoints",
    label: "Breakpoints",
    prefix: "--breakpoints-",
    tokenCategory: "breakpoints",
    group: "layout",
  },
  {
    key: "aspectRatios",
    label: "Aspect Ratios",
    prefix: "--aspect-ratios-",
    tokenCategory: "aspectRatios",
    group: "layout",
  },
  {
    key: "blurs",
    label: "Blurs",
    prefix: "--blurs-",
    tokenCategory: "blurs",
    group: "effects",
  },
  {
    key: "borders",
    label: "Borders",
    prefix: "--borders-",
    tokenCategory: "borders",
    group: "layout",
  },
  {
    key: "spacing",
    label: "Spacing",
    prefix: "--spacing-",
    tokenCategory: "spacing",
    group: "layout",
  },
] as const;

const SIZE_REFERENCE_PATTERN = /(?:\{|token\()?\s*sizes\.([a-zA-Z0-9.-]+)/g;

const toSortedList = (values: Iterable<string>) =>
  Array.from(new Set(values)).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );

const collectCssVarsFromComputedStyle = (target: Element) => {
  const styles = getComputedStyle(target);
  const vars: string[] = [];
  for (let index = 0; index < styles.length; index += 1) {
    const propName = styles.item(index);
    if (propName.startsWith("--")) vars.push(propName);
  }
  return vars;
};


const collectStringValues = (value: unknown, result: string[]) => {
  if (typeof value === "string") {
    result.push(value);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectStringValues(item, result);
    return;
  }

  if (value && typeof value === "object") {
    for (const nested of Object.values(value)) {
      collectStringValues(nested, result);
    }
  }
};

const collectTokenReferences = (pattern: RegExp): string[] => {
  const stringValues: string[] = [];
  collectStringValues(recipes, stringValues);

  const matches: string[] = [];
  for (const value of stringValues) {
    for (const match of value.matchAll(pattern)) {
      const tokenKey = match[1];
      if (tokenKey) matches.push(tokenKey);
    }
  }

  return toSortedList(matches);
};

const getTokenValue = (path: string) =>
  token(path as Parameters<typeof token>[0], path);

const parseCssVarToken = (cssVar: string, prefix: string) =>
  cssVar.replace(prefix, "").replaceAll("\\.", ".");

const parseColorCssVar = (cssVar: string): ParsedColorToken => {
  const raw = parseCssVarToken(cssVar, "--colors-");
  const parts = raw.split("-");

  if (parts[0] === "color" && parts[1] === "palette") {
    const key = parts.slice(2).join(".") || "default";
    return {
      cssVar,
      palette: "colorPalette",
      key,
      tokenPath: key === "default" ? "colorPalette" : `colorPalette.${key}`,
    };
  }

  const palette = parts[0] ?? "misc";
  const key = parts.slice(1).join(".") || "default";

  return {
    cssVar,
    palette,
    key,
    tokenPath: key === "default" ? palette : `${palette}.${key}`,
  };
};

const isNumericShade = (value: string) => /^(?:[1-9]|1[0-2])$/.test(value);
const isAlphaShade = (value: string) => /^a(?:[1-9]|1[0-2])$/.test(value);
const isTextualSizeValue = (value: string) =>
  /(content|auto|fit-content|min-content|max-content)/.test(value);
const parseNumericTokenValue = (value: unknown) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : Number.NaN;
  }
  if (typeof value !== "string") {
    return Number.NaN;
  }

  const match = value.match(/-?\d*\.?\d+/);
  if (!match) return Number.NaN;
  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const parseAspectRatioValue = (value: string) => {
  const match = value.match(/(-?\d*\.?\d+)\s*\/\s*(-?\d*\.?\d+)/);
  if (!match) return Number.NaN;
  const numerator = Number.parseFloat(match[1]);
  const denominator = Number.parseFloat(match[2]);
  if (
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator === 0
  ) {
    return Number.NaN;
  }
  return numerator / denominator;
};

const parseThemeNumericValue = (
  tokenCategory: string,
  value: string | number,
) => {
  if (typeof value === "number")
    return Number.isFinite(value) ? value : Number.NaN;
  if (typeof value !== "string") return Number.NaN;
  if (tokenCategory === "aspectRatios") return parseAspectRatioValue(value);
  if (value.includes("var(")) return Number.NaN;
  return parseNumericTokenValue(value);
};

const toColorGroupId = (palette: string) =>
  `color-group-${palette.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

const ROLE_GROUP_ORDER = [
  "solid",
  "plain",
  "outline",
  "subtle",
  "surface",
  "ghost",
  "accent",
] as const;

const COLOR_TIGHT_SWATCH_GRID = css({
  display: "grid",
  gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
  gap: "1",
});

const COLOR_TIGHT_ROLE_SWATCH_GRID = css({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(16px, 1fr))",
  gap: "1",
});

const sortRoleGroupName = (a: string, b: string) => {
  const aIndex = ROLE_GROUP_ORDER.indexOf(a as (typeof ROLE_GROUP_ORDER)[number]);
  const bIndex = ROLE_GROUP_ORDER.indexOf(b as (typeof ROLE_GROUP_ORDER)[number]);
  if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
  if (aIndex !== -1) return -1;
  if (bIndex !== -1) return 1;
  return a.localeCompare(b, undefined, { numeric: true });
};

const ROLE_DETAIL_PRIMARY_ORDER = [
  "bg",
  "fg",
  "border",
  "focus-ring",
  "focusRing",
] as const;

const getRoleGroupKey = (tokenKey: string) => tokenKey.split(".")[0] ?? "misc";
  const splitNamedRoleKey = (tokenKey: string) => {
  const [variant, ...rest] = tokenKey.split(".");
  return {
    variant: variant ?? "misc",
    detail: rest.join(".") || "default",
  };
};
const escapeMarkdownCell = (value: string) => value.replaceAll("|", "\\|");
const toTitleCase = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const sortRoleDetailName = (a: string, b: string) => {
  const [aRoot] = a.split(".");
  const [bRoot] = b.split(".");
  const aIndex = ROLE_DETAIL_PRIMARY_ORDER.indexOf(
    aRoot as (typeof ROLE_DETAIL_PRIMARY_ORDER)[number],
  );
  const bIndex = ROLE_DETAIL_PRIMARY_ORDER.indexOf(
    bRoot as (typeof ROLE_DETAIL_PRIMARY_ORDER)[number],
  );

  if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
  if (aIndex !== -1) return -1;
  if (bIndex !== -1) return 1;
  return a.localeCompare(b, undefined, { numeric: true });
};
const SWATCH_TOOLTIP_CONTENT_PROPS = {
  bg: "bg.default",
  color: "fg.default",
  borderWidth: "1px",
  borderColor: "border",
  borderRadius: "l2",
  boxShadow: "md",
  p: "2",
  width: "fit-content",
  minW: "560px",
  maxW: "min(96vw, 760px)",
} as const;

const colorInfoCache = new Map<string, ResolvedColorInfo | null>();
const parseRgbChannels = (value: string) => {
  const match = value.match(
    /rgba?\(\s*([\d.]+)(?:\s*,\s*|\s+)([\d.]+)(?:\s*,\s*|\s+)([\d.]+)/i,
  );
  if (!match) return null;
  const r = Number.parseFloat(match[1]);
  const g = Number.parseFloat(match[2]);
  const b = Number.parseFloat(match[3]);
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b))
    return null;
  return {
    r: Math.max(0, Math.min(255, Math.round(r))),
    g: Math.max(0, Math.min(255, Math.round(g))),
    b: Math.max(0, Math.min(255, Math.round(b))),
  };
};
const toHex = (value: number) => value.toString(16).padStart(2, "0");
const rgbToHex = (r: number, g: number, b: number) =>
  `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
const rgbToHsl = (r: number, g: number, b: number) => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
};
const resolveColorInfo = (cssVar: string): ResolvedColorInfo | null => {
  if (typeof window === "undefined") return null;
  if (colorInfoCache.has(cssVar)) return colorInfoCache.get(cssVar) ?? null;

  const raw = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  if (!raw) {
    colorInfoCache.set(cssVar, null);
    return null;
  }

  const probe = document.createElement("span");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.color = raw;
  document.body.appendChild(probe);
  const computedRgb = getComputedStyle(probe).color;
  probe.remove();

  const channels = parseRgbChannels(computedRgb);
  if (!channels) {
    colorInfoCache.set(cssVar, null);
    return null;
  }

  const resolved = {
    raw,
    computedRgb,
    hex: rgbToHex(channels.r, channels.g, channels.b),
    hsl: rgbToHsl(channels.r, channels.g, channels.b),
  };
  colorInfoCache.set(cssVar, resolved);
  return resolved;
};

type ColorSwatchTooltipProps = {
  item: ParsedColorToken;
};

const ColorSwatchTooltip = (props: ColorSwatchTooltipProps) => {
  const [copiedKey, setCopiedKey] = createSignal<string | null>(null);
  const colorInfo = createMemo(() => resolveColorInfo(props.item.cssVar));
  const copyValue = async (copyKey: string, value: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(value);
    setCopiedKey(copyKey);
    window.setTimeout(() => setCopiedKey((current) => (current === copyKey ? null : current)), 1200);
  };
  const rowClass = css({
    display: "grid",
    gridTemplateColumns: "64px minmax(0, 1fr)",
    gap: "1",
    alignItems: "center",
  });
  const copyValueClass = css({
    textStyle: "2xs",
    fontFamily: "mono",
    textAlign: "left",
    borderWidth: "1px",
    borderColor: "transparent",
    borderRadius: "l1",
    px: "1",
    py: "0.5",
    color: "fg.default",
    cursor: "copy",
    _hover: { bg: "bg.subtle", borderColor: "border" },
    _active: { bg: "bg.muted" },
  });

  return (
    <VStack alignItems="stretch" gap="1">
      <HStack justifyContent="space-between" alignItems="center">
        <Box textStyle="xs" fontWeight="semibold" fontFamily="mono">
          {props.item.key}
        </Box>
        <Box
          h="6"
          w="6"
          borderRadius="l1"
          borderWidth="1px"
          borderColor="border"
          style={{ "background-color": `var(${props.item.cssVar})` }}
        />
      </HStack>

      <VStack alignItems="stretch" gap="0.5">
        <Box class={rowClass}>
          <Box textStyle="2xs" color="fg.muted">Name</Box>
          <button
            type="button"
            class={copyValueClass}
            onClick={() => void copyValue("name", `colors.${props.item.tokenPath}`)}
          >
            <Box whiteSpace="nowrap">
              colors.{props.item.tokenPath}
            </Box>
            <Show when={copiedKey() === "name"}>
              <Box as="span" ml="1" color="fg.muted">Copied</Box>
            </Show>
          </button>
        </Box>
        <Box class={rowClass}>
          <Box textStyle="2xs" color="fg.muted">CSS Var</Box>
          <button
            type="button"
            class={copyValueClass}
            onClick={() => void copyValue("var", props.item.cssVar)}
          >
            <Box whiteSpace="nowrap">{props.item.cssVar}</Box>
            <Show when={copiedKey() === "var"}>
              <Box as="span" ml="1" color="fg.muted">Copied</Box>
            </Show>
          </button>
        </Box>
        <Show when={colorInfo()}>
          {(info) => (
            <>
              <Box class={rowClass}>
                <Box textStyle="2xs" color="fg.muted">HEX</Box>
                <button
                  type="button"
                  class={copyValueClass}
                  onClick={() => void copyValue("hex", info().hex)}
                >
                  {info().hex}
                  <Show when={copiedKey() === "hex"}>
                    <Box as="span" ml="1" color="fg.muted">Copied</Box>
                  </Show>
                </button>
              </Box>
              <Box class={rowClass}>
                <Box textStyle="2xs" color="fg.muted">RGB</Box>
                <button
                  type="button"
                  class={copyValueClass}
                  onClick={() => void copyValue("rgb", info().computedRgb)}
                >
                  {info().computedRgb}
                  <Show when={copiedKey() === "rgb"}>
                    <Box as="span" ml="1" color="fg.muted">Copied</Box>
                  </Show>
                </button>
              </Box>
              <Box class={rowClass}>
                <Box textStyle="2xs" color="fg.muted">HSL</Box>
                <button
                  type="button"
                  class={copyValueClass}
                  onClick={() => void copyValue("hsl", info().hsl)}
                >
                  {info().hsl}
                  <Show when={copiedKey() === "hsl"}>
                    <Box as="span" ml="1" color="fg.muted">Copied</Box>
                  </Show>
                </button>
              </Box>
            </>
          )}
        </Show>
      </VStack>
    </VStack>
  );
};

export type DesignSystemSection =
  | "colors"
  | "layout"
  | "typography"
  | "motion"
  | "effects";

type DesignSystemOverviewProps = {
  section: DesignSystemSection;
};

export const DesignSystemOverview = (props: DesignSystemOverviewProps) => {
  const [colorCssVars, setColorCssVars] = createSignal<string[]>([]);
  const [sizeCssVars, setSizeCssVars] = createSignal<string[]>([]);
  const [sizeMetrics, setSizeMetrics] = createSignal<SizeMetric[]>([]);
  const [sizeDisplayUnit, setSizeDisplayUnit] =
    createSignal<SizeDisplayUnit>("rem");
  const [semanticMarkdownCopied, setSemanticMarkdownCopied] =
    createSignal(false);
  const [typographyCssVars, setTypographyCssVars] =
    createSignal<TypographyCssVars>({
      fonts: [],
      fontSizes: [],
      fontWeights: [],
      lineHeights: [],
      letterSpacings: [],
    });
  const [themeCategories, setThemeCategories] = createSignal<ThemeCategory[]>(
    [],
  );

  const sizeTokens = createMemo(() => {
    const generatedSizes = sizeCssVars().map((cssVar) =>
      parseCssVarToken(cssVar, "--sizes-"),
    );

    const candidates = [
      ...generatedSizes,
      ...collectTokenReferences(SIZE_REFERENCE_PATTERN),
    ];

    return toSortedList(candidates);
  });

  onMount(() => {
    const DEBUG_PREFIX = "[DesignSystemOverview][vars]";
    let didLogThemeCatalog = false;
    let pollCount = 0;
    const maxPolls = 120;
    const pollMs = 250;

    const collectAndApplyCssVars = () => {
      const rootVars = collectCssVarsFromComputedStyle(document.documentElement);
      const allVars = toSortedList(rootVars);

      const nextColorVars = toSortedList(
        allVars.filter((propName) => propName.startsWith("--colors-")),
      );
      const nextSizeVars = toSortedList(
        allVars.filter((propName) => propName.startsWith("--sizes-")),
      );

      setColorCssVars(nextColorVars);
      setSizeCssVars(nextSizeVars);
      setTypographyCssVars({
        fonts: toSortedList(
          allVars.filter((propName) => propName.startsWith("--fonts-")),
        ),
        fontSizes: toSortedList(
          allVars.filter((propName) => propName.startsWith("--font-sizes-")),
        ),
        fontWeights: toSortedList(
          allVars.filter((propName) => propName.startsWith("--font-weights-")),
        ),
        lineHeights: toSortedList(
          allVars.filter((propName) => propName.startsWith("--line-heights-")),
        ),
        letterSpacings: toSortedList(
          allVars.filter((propName) => propName.startsWith("--letter-spacings-")),
        ),
      });
      const nextThemeCategories = THEME_CATEGORY_CONFIG.map((config) => {
        const tokenNames = toSortedList(
          allVars
            .filter((propName) => propName.startsWith(config.prefix))
            .map((propName) => parseCssVarToken(propName, config.prefix)),
        );

        const tokens = tokenNames
          .map((tokenName) => {
            const value = getTokenValue(`${config.tokenCategory}.${tokenName}`);
            const numericValue = parseThemeNumericValue(
              config.tokenCategory,
              value,
            );
            const isAlias = typeof value === "string" && value.includes("var(");
            return {
              token: tokenName,
              value,
              numericValue: Number.isFinite(numericValue) ? numericValue : null,
              isAlias,
            };
          })
          .sort((a, b) => {
            const aValue = a.numericValue;
            const bValue = b.numericValue;
            if (aValue !== null && bValue !== null) return aValue - bValue;
            if (aValue !== null) return -1;
            if (bValue !== null) return 1;
            if (a.isAlias && !b.isAlias) return 1;
            if (!a.isAlias && b.isAlias) return -1;
            return a.token.localeCompare(b.token, undefined, { numeric: true });
          });

        return {
          key: config.key,
          label: config.label,
          group: config.group,
          tokenCategory: config.tokenCategory,
          tokens,
        };
      }).filter((category) => category.tokens.length > 0);

      setThemeCategories(nextThemeCategories);

      const themeLogEntries = nextThemeCategories.map((category) => ({
        key: category.key,
        label: category.label,
        tokenCategory: category.tokenCategory,
        count: category.tokens.length,
        tokens: category.tokens.map((tokenName) => {
          const value = tokenName.value;
          return {
            token: tokenName.token,
            fullToken: `${category.tokenCategory}.${tokenName.token}`,
            value,
            numericValue: tokenName.numericValue,
            isAlias: tokenName.isAlias,
          };
        }),
      }));

      if (!didLogThemeCatalog && allVars.length > 0) {
        didLogThemeCatalog = true;
        console.info("[DesignSystemOverview] theme token catalog", {
          categoryCount: themeLogEntries.length,
          tokenCount: themeLogEntries.reduce((sum, entry) => sum + entry.count, 0),
          categories: themeLogEntries.map((entry) => ({
            key: entry.key,
            label: entry.label,
            count: entry.count,
          })),
        });
        console.info(
          "[DesignSystemOverview] theme token catalog (detailed)",
          themeLogEntries,
        );
      }

      const resolvedSizeTokens = sizeTokens();

      queueMicrotask(() => {
        const measureHost = document.createElement("div");
        measureHost.style.position = "absolute";
        measureHost.style.visibility = "hidden";
        measureHost.style.pointerEvents = "none";
        measureHost.style.inset = "-9999px";
        measureHost.style.width = "1024px";
        measureHost.style.height = "0";
        measureHost.style.overflow = "hidden";
        document.body.appendChild(measureHost);

        const rootFontSize = Number.parseFloat(
          getComputedStyle(document.documentElement).fontSize,
        );

        const nextMetrics = resolvedSizeTokens
          .map((sizeToken) => {
            const rawValue = getTokenValue(`sizes.${sizeToken}`);
            const textual = isTextualSizeValue(rawValue);
            const probe = document.createElement("div");
            probe.style.width = `var(--sizes-${sizeToken.replaceAll(".", "\\.")})`;
            measureHost.appendChild(probe);
            const computedWidth = getComputedStyle(probe).width;
            probe.remove();

            const parsedPx = Number.parseFloat(computedWidth);
            const pxValue =
              textual || !Number.isFinite(parsedPx) ? null : parsedPx;
            const parsedRem = Number.parseFloat(rawValue);
            const remValue = rawValue.endsWith("rem")
              ? Number.isFinite(parsedRem)
                ? parsedRem
                : null
              : pxValue !== null &&
                  Number.isFinite(rootFontSize) &&
                  rootFontSize > 0
                ? pxValue / rootFontSize
                : null;

            return {
              token: sizeToken,
              rawValue,
              pxValue,
              remValue,
              isTextual: textual,
            };
          })
          .sort((a, b) => {
            if (a.isTextual && !b.isTextual) return -1;
            if (!a.isTextual && b.isTextual) return 1;
            if (a.isTextual && b.isTextual) {
              return a.token.localeCompare(b.token, undefined, { numeric: true });
            }
            if (a.pxValue !== null && b.pxValue !== null) {
              return a.pxValue - b.pxValue;
            }
            if (a.pxValue !== null) return -1;
            if (b.pxValue !== null) return 1;
            return a.token.localeCompare(b.token, undefined, { numeric: true });
          });

        setSizeMetrics(nextMetrics);
        measureHost.remove();
      });

      return nextColorVars.length > 0;
    };

    const runCollection = () => {
      const foundRuntimeVars = collectAndApplyCssVars();
      if (foundRuntimeVars && colorCssVars().length > 0) return true;
      return false;
    };

    runCollection();
    const intervalId = window.setInterval(() => {
      pollCount += 1;
      const done = runCollection();
      if (done || pollCount >= maxPolls) {
        window.clearInterval(intervalId);
      }
    }, pollMs);

    onCleanup(() => {
      window.clearInterval(intervalId);
    });
  });

  const recipeList = createMemo(() =>
    Object.values(recipes).map((recipe) => recipe as RecipeLike),
  );

  const recipeColorPalettes = createMemo(() =>
    toSortedList(
      recipeList()
        .flatMap((recipe) => Object.entries(recipe.variants ?? {}))
        .filter(([axis]) => axis === "colorPalette")
        .flatMap(([, options]) => Object.keys(options)),
    ),
  );

  const parsedColors = createMemo(() => colorCssVars().map(parseColorCssVar));
  const colorPaletteSemanticTokens = createMemo(() =>
    parsedColors()
      .filter((item) => item.palette === "colorPalette")
      .filter((item) => !isNumericShade(item.key) && !isAlphaShade(item.key)),
  );
  const semanticVariantRows = createMemo(() => {
    const grouped = new Map<
      string,
      {
        variant: string;
        details: string[];
      }
    >();

    for (const item of colorPaletteSemanticTokens()) {
      const { variant, detail } = splitNamedRoleKey(item.key);
      const existing = grouped.get(variant);
      if (existing) {
        if (!existing.details.includes(detail)) existing.details.push(detail);
        continue;
      }
      grouped.set(variant, {
        variant,
        details: [detail],
      });
    }

    return Array.from(grouped.values())
      .map((row) => ({
        ...row,
        details: row.details.sort(sortRoleDetailName),
      }))
      .sort((a, b) => sortRoleGroupName(a.variant, b.variant));
  });
  const semanticSettingCount = createMemo(
    () =>
      semanticVariantRows().reduce(
        (total, variantRow) => total + variantRow.details.length,
        0,
      ),
  );

  const paletteGroups = createMemo(() => {
    const grouped = new Map<string, ParsedColorToken[]>();

    for (const entry of parsedColors()) {
      const list = grouped.get(entry.palette) ?? [];
      list.push(entry);
      grouped.set(entry.palette, list);
    }

    const recipePalettes = new Set(recipeColorPalettes());
    const semanticOrder = ["bg", "fg", "border", "error", "black", "white"];

    return Array.from(grouped.entries())
      .map(([palette, items]) => {
        const shades = items
          .filter((item) => isNumericShade(item.key))
          .sort((a, b) =>
            a.key.localeCompare(b.key, undefined, { numeric: true }),
          );
        const alphas = items
          .filter((item) => isAlphaShade(item.key))
          .sort((a, b) =>
            a.key.localeCompare(b.key, undefined, { numeric: true }),
          );
        const roles = items
          .filter(
            (item) => !isNumericShade(item.key) && !isAlphaShade(item.key),
          )
          .sort((a, b) =>
            a.key.localeCompare(b.key, undefined, { numeric: true }),
          );

        return { palette, shades, alphas, roles };
      })
      .sort((a, b) => {
        const aRecipe = recipePalettes.has(a.palette);
        const bRecipe = recipePalettes.has(b.palette);
        if (aRecipe && !bRecipe) return -1;
        if (!aRecipe && bRecipe) return 1;

        const aSemantic = semanticOrder.indexOf(a.palette);
        const bSemantic = semanticOrder.indexOf(b.palette);
        if (aSemantic !== -1 && bSemantic !== -1) return aSemantic - bSemantic;
        if (aSemantic !== -1) return -1;
        if (bSemantic !== -1) return 1;

        return a.palette.localeCompare(b.palette);
      });
  });
  const paletteList = createMemo(() =>
    paletteGroups().map((group) => group.palette).join(", "),
  );
  const semanticCssMarkdownTable = createMemo(() => {
    const lines = [
      "| Variant | Available Settings | Token Path | CSS Var |",
      "| --- | --- | --- | --- |",
      `| Colors | ${escapeMarkdownCell(
        paletteList() || "-",
      )} | colors.<palette>.<key> | --colors-<palette>-<key> |`,
      ...semanticVariantRows().map((row) => {
        const settings = row.details.join(", ");
        return `| ${toTitleCase(row.variant)} | ${escapeMarkdownCell(
          settings,
        )} | colors.colorPalette.${row.variant}.<setting> | --colors-color-palette-${row.variant}-<setting> |`;
      }),
    ];
    return lines.join("\n");
  });
  const copySemanticMarkdownTable = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(semanticCssMarkdownTable());
    setSemanticMarkdownCopied(true);
    window.setTimeout(() => setSemanticMarkdownCopied(false), 1200);
  };
  const twelveStepPalettes = createMemo(() =>
    paletteGroups()
      .flatMap((group) => {
        if (group.shades.length === 12)
          return [{ ...group, primarySteps: group.shades, primaryKind: "Scale" }];
        if (group.alphas.length === 12)
          return [{ ...group, primarySteps: group.alphas, primaryKind: "Alpha" }];
        return [];
      })
      .sort((a, b) => a.palette.localeCompare(b.palette)),
  );
  const semanticPaletteGroups = createMemo(() =>
    paletteGroups().filter((group) => group.roles.length > 0),
  );
  const namedGridPaletteColumns = createMemo(() =>
    semanticPaletteGroups().slice(6),
  );
  const namedGridRoleRows = createMemo(() => {
    const keys = new Set<string>();
    for (const group of namedGridPaletteColumns()) {
      for (const role of group.roles) keys.add(role.key);
    }

    return Array.from(keys)
      .map((key) => ({
        key,
        ...splitNamedRoleKey(key),
      }))
      .sort((a, b) => {
        const variantOrder = sortRoleGroupName(a.variant, b.variant);
        if (variantOrder !== 0) return variantOrder;
        return a.detail.localeCompare(b.detail, undefined, { numeric: true });
      });
  });
  const namedGridRoleRowGroups = createMemo(() => {
    const grouped = new Map<string, ReturnType<typeof namedGridRoleRows>[number][]>();
    for (const row of namedGridRoleRows()) {
      const bucket = grouped.get(row.variant) ?? [];
      bucket.push(row);
      grouped.set(row.variant, bucket);
    }

    return Array.from(grouped.entries())
      .map(([variant, rows]) => ({ variant, rows }))
      .sort((a, b) => sortRoleGroupName(a.variant, b.variant));
  });
  const namedGridMaxRoleCount = createMemo(() =>
    namedGridPaletteColumns().reduce(
      (max, group) => Math.max(max, group.roles.length),
      0,
    ),
  );
  const sparseNamedGridPalettes = createMemo(() =>
    namedGridPaletteColumns()
      .filter((group) => group.roles.length < namedGridMaxRoleCount())
      .map((group) => `${group.palette} (${group.roles.length})`),
  );

  const textualSizes = createMemo(() =>
    sizeMetrics().filter((metric) => metric.isTextual),
  );
  const measuredSizes = createMemo(() =>
    sizeMetrics().filter((metric) => !metric.isTextual),
  );
  const maxMeasuredPx = createMemo(() =>
    measuredSizes().reduce(
      (max, metric) =>
        metric.pxValue !== null ? Math.max(max, metric.pxValue) : max,
      0,
    ),
  );

  const fontFamilyTokens = createMemo(() =>
    typographyCssVars().fonts.map((cssVar) =>
      parseCssVarToken(cssVar, "--fonts-"),
    ),
  );
  const fontSizeTokens = createMemo(() =>
    typographyCssVars().fontSizes.map((cssVar) =>
      parseCssVarToken(cssVar, "--font-sizes-"),
    ),
  );
  const fontWeightTokens = createMemo(() =>
    typographyCssVars().fontWeights.map((cssVar) =>
      parseCssVarToken(cssVar, "--font-weights-"),
    ),
  );
  const lineHeightTokens = createMemo(() =>
    typographyCssVars().lineHeights.map((cssVar) =>
      parseCssVarToken(cssVar, "--line-heights-"),
    ),
  );
  const letterSpacingTokens = createMemo(() =>
    typographyCssVars().letterSpacings.map((cssVar) =>
      parseCssVarToken(cssVar, "--letter-spacings-"),
    ),
  );

  const sortedFontWeightTokens = createMemo(() =>
    [...fontWeightTokens()].sort((a, b) => {
      const aValue = parseNumericTokenValue(getTokenValue(`fontWeights.${a}`));
      const bValue = parseNumericTokenValue(getTokenValue(`fontWeights.${b}`));
      if (Number.isFinite(aValue) && Number.isFinite(bValue))
        return aValue - bValue;
      if (Number.isFinite(aValue)) return -1;
      if (Number.isFinite(bValue)) return 1;
      return a.localeCompare(b, undefined, { numeric: true });
    }),
  );

  const sortedFontSizeTokens = createMemo(() =>
    [...fontSizeTokens()].sort((a, b) => {
      const aValue = parseNumericTokenValue(getTokenValue(`fontSizes.${a}`));
      const bValue = parseNumericTokenValue(getTokenValue(`fontSizes.${b}`));
      if (Number.isFinite(aValue) && Number.isFinite(bValue))
        return aValue - bValue;
      if (Number.isFinite(aValue)) return -1;
      if (Number.isFinite(bValue)) return 1;
      return a.localeCompare(b, undefined, { numeric: true });
    }),
  );

  const sortedLineHeightTokens = createMemo(() =>
    [...lineHeightTokens()].sort((a, b) => {
      const aValue = parseNumericTokenValue(getTokenValue(`lineHeights.${a}`));
      const bValue = parseNumericTokenValue(getTokenValue(`lineHeights.${b}`));
      if (Number.isFinite(aValue) && Number.isFinite(bValue))
        return aValue - bValue;
      if (Number.isFinite(aValue)) return -1;
      if (Number.isFinite(bValue)) return 1;
      return a.localeCompare(b, undefined, { numeric: true });
    }),
  );

  const sortedLetterSpacingTokens = createMemo(() =>
    [...letterSpacingTokens()].sort((a, b) => {
      const aValue = parseNumericTokenValue(
        getTokenValue(`letterSpacings.${a}`),
      );
      const bValue = parseNumericTokenValue(
        getTokenValue(`letterSpacings.${b}`),
      );
      if (Number.isFinite(aValue) && Number.isFinite(bValue))
        return aValue - bValue;
      if (Number.isFinite(aValue)) return -1;
      if (Number.isFinite(bValue)) return 1;
      return a.localeCompare(b, undefined, { numeric: true });
    }),
  );

  const typographyTokenCount = createMemo(
    () =>
      fontFamilyTokens().length +
      fontSizeTokens().length +
      fontWeightTokens().length +
      lineHeightTokens().length +
      letterSpacingTokens().length,
  );
  const layoutThemeCategories = createMemo(() =>
    themeCategories().filter((category) => category.group === "layout"),
  );
  const motionThemeCategories = createMemo(() =>
    themeCategories().filter((category) => category.group === "motion"),
  );
  const effectThemeCategories = createMemo(() =>
    themeCategories().filter((category) => category.group === "effects"),
  );
  const layoutTokenCount = createMemo(
    () =>
      sizeMetrics().length +
      layoutThemeCategories().reduce(
        (total, category) => total + category.tokens.length,
        0,
      ),
  );
  const motionTokenCount = createMemo(() =>
    motionThemeCategories().reduce(
      (total, category) => total + category.tokens.length,
      0,
    ),
  );
  const effectTokenCount = createMemo(() =>
    effectThemeCategories().reduce(
      (total, category) => total + category.tokens.length,
      0,
    ),
  );

  return (
    <VStack alignItems="stretch" gap="6">
      <VStack alignItems="stretch" gap="1">
        <Box textStyle={{ base: "xl", md: "2xl" }} fontWeight="semibold">
          {props.section === "colors"
            ? "Design System Colors"
            : props.section === "layout"
              ? "Design System Layout"
              : props.section === "typography"
                ? "Design System Typography"
                : props.section === "motion"
                  ? "Design System Motion"
                  : "Design System Effects"}
        </Box>
        <Box textStyle="sm" color="fg.muted">
          {props.section === "colors"
            ? "Palette and semantic color tokens auto-derived from runtime CSS vars. Includes live semantic variable patterns and available variant/setting names."
            : props.section === "layout"
              ? "Size and layout tokens grouped together and sorted by resolved value."
              : props.section === "typography"
                ? "Typography tokens auto-derived from runtime CSS vars."
                : props.section === "motion"
                  ? "Motion and animation tokens auto-derived from runtime CSS vars."
                  : "Visual effect tokens auto-derived from runtime CSS vars."}
        </Box>
      </VStack>

      <Show when={props.section === "colors"}>
        <VStack alignItems="stretch" gap="2" w="full" maxW="980px">
          <HStack justifyContent="space-between" alignItems="center">
            <Box textStyle="lg" fontWeight="semibold">
              Colors
            </Box>
            <Box textStyle="xs" color="fg.muted">
              {parsedColors().length} tokens
            </Box>
          </HStack>

          <Collapsible.Root>
            <VStack alignItems="stretch" gap="1">
              <HStack justifyContent="space-between" alignItems="center">
                <Collapsible.Trigger
                  asChild={(triggerProps) => (
                    <Button size="xs" variant="outline" {...triggerProps()}>
                      Semantic Variable Names
                    </Button>
                  )}
                />
              </HStack>
              <Collapsible.Content>
                <VStack alignItems="stretch" gap="1">
                  <HStack justifyContent="space-between" alignItems="center">
                    <Box textStyle="2xs" color="fg.muted">
                      Generated from live <Box as="span" fontFamily="mono">--colors-color-palette-*</Box> CSS variables.
                      Token pattern:
                      {" "}
                      <Box as="span" fontFamily="mono">colors.colorPalette.&lt;variant&gt;.&lt;setting&gt;</Box>.
                    </Box>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => void copySemanticMarkdownTable()}
                    >
                      {semanticMarkdownCopied() ? "Copied Markdown" : "Copy Markdown"}
                    </Button>
                  </HStack>
                  <Box borderWidth="1px" borderColor="border" borderRadius="l2" overflow="hidden">
                    <Box overflowX="auto">
                      <Table.Root
                        variant="surface"
                        size="md"
                        w="full"
                        minW="800px"
                        striped
                        stickyHeader
                        style={{ "table-layout": "fixed" }}
                      >
                  <Table.Head>
                    <Table.Row>
                      <Table.Header w="130px">Variant</Table.Header>
                      <Table.Header w="310px">Available Settings</Table.Header>
                      <Table.Header w="160px">Token Path</Table.Header>
                      <Table.Header w="160px">CSS Var</Table.Header>
                    </Table.Row>
                  </Table.Head>
                  <Table.Body>
                    <Table.Row>
                      <Table.Cell py="1.5">
                        <Box textStyle="xs" fontWeight="semibold">
                          Colors
                        </Box>
                      </Table.Cell>
                      <Table.Cell py="1.5">
                        <Box textStyle="2xs" fontFamily="mono" whiteSpace="normal">
                          {paletteList()}
                        </Box>
                      </Table.Cell>
                      <Table.Cell py="1.5">
                        <Box textStyle="2xs" fontFamily="mono" whiteSpace="normal">
                          colors.&lt;palette&gt;.&lt;key&gt;
                        </Box>
                      </Table.Cell>
                      <Table.Cell py="1.5">
                        <Box textStyle="2xs" fontFamily="mono" whiteSpace="normal">
                          --colors-&lt;palette&gt;-&lt;key&gt;
                        </Box>
                      </Table.Cell>
                    </Table.Row>
                    <For each={semanticVariantRows()}>
                      {(row) => (
                        <Table.Row>
                          <Table.Cell py="1.5">
                            <Box textStyle="xs" fontWeight="semibold">
                              {toTitleCase(row.variant)}
                            </Box>
                            <Box textStyle="2xs" color="fg.muted" fontFamily="mono">
                              {row.variant}
                            </Box>
                          </Table.Cell>
                          <Table.Cell py="1.5">
                            <Box textStyle="2xs" color="fg.muted" mb="0.5">
                              {row.details.length} settings
                            </Box>
                            <Box textStyle="2xs" fontFamily="mono" whiteSpace="normal">
                              {row.details.join(", ")}
                            </Box>
                          </Table.Cell>
                          <Table.Cell py="1.5">
                            <Box textStyle="2xs" fontFamily="mono" whiteSpace="normal">
                              colors.colorPalette.{row.variant}.&lt;setting&gt;
                            </Box>
                          </Table.Cell>
                          <Table.Cell py="1.5">
                            <Box textStyle="2xs" fontFamily="mono" whiteSpace="normal">
                              --colors-color-palette-{row.variant}-&lt;setting&gt;
                            </Box>
                          </Table.Cell>
                        </Table.Row>
                      )}
                    </For>
                  </Table.Body>
                      </Table.Root>
                    </Box>
                  </Box>
                </VStack>
              </Collapsible.Content>
            </VStack>
          </Collapsible.Root>

          <VStack alignItems="start" gap="1">
            <VStack alignItems="start" gap="0.5">
              <Box textStyle="xs" color="fg.muted" fontWeight="semibold">
                12-Step Palettes
              </Box>
              <Box
                borderWidth="1px"
                borderColor="border"
                borderRadius="l2"
                overflow="hidden"
                display="inline-block"
                w="fit-content"
                maxW="full"
              >
                <Box overflowX="auto">
                  <Table.Root
                    variant="surface"
                    size="md"
                    w="592px"
                    minW="592px"
                    maxW="592px"
                    striped
                    stickyHeader
                    style={{ "table-layout": "fixed" }}
                    css={{
                      "& tbody td": { py: "0.75", px: "0.5" },
                      "& tbody tr > td:nth-child(n+3)": { py: "0.25", px: "0.125" },
                    }}
                  >
                  <Table.Head>
                    <Table.Row>
                        <Table.Header w="112px">Palette</Table.Header>
                        <Table.Header w="56px">Type</Table.Header>
                        <For each={Array.from({ length: 12 }, (_, i) => `${i + 1}`)}>
                          {(step) => (
                            <Table.Header w="30px" textAlign="center" px="0.5">
                              {step}
                            </Table.Header>
                          )}
                        </For>
                      </Table.Row>
                    </Table.Head>
                    <Table.Body>
                      <For each={twelveStepPalettes()}>
                        {(group) => (
                          <Table.Row id={toColorGroupId(group.palette)}>
                          <Table.Cell>
                            <Box
                              textStyle="2xs"
                              fontWeight="semibold"
                              textTransform="capitalize"
                            >
                                {group.palette}
                              </Box>
                            </Table.Cell>
                          <Table.Cell>
                            <Box textStyle="2xs" color="fg.muted">
                              {group.primaryKind}
                            </Box>
                          </Table.Cell>
                          <For each={group.primarySteps}>
                            {(item) => (
                                <Table.Cell p="0.25" py="0.5" textAlign="center">
                                  <Tooltip
                                    openDelay={120}
                                    closeDelay={80}
                                    interactive
                                    contentProps={SWATCH_TOOLTIP_CONTENT_PROPS}
                                    content={<ColorSwatchTooltip item={item} />}
                                  >
                                  <Box
                                      h="6"
                                      w="6"
                                      borderRadius="l1"
                                      borderWidth="1px"
                                      borderColor="border"
                                      display="inline-block"
                                      style={{
                                        "background-color": `var(${item.cssVar})`,
                                      }}
                                    />
                                  </Tooltip>
                                </Table.Cell>
                              )}
                            </For>
                          </Table.Row>
                        )}
                      </For>
                    </Table.Body>
                  </Table.Root>
                </Box>
              </Box>
            </VStack>

            <VStack alignItems="start" gap="0.5">
              <Box textStyle="xs" color="fg.muted" fontWeight="semibold">
                Named Color Grid
              </Box>
              <Box
                borderWidth="1px"
                borderColor="border"
                borderRadius="l2"
                overflow="hidden"
                display="inline-block"
                w="fit-content"
                maxW="full"
              >
                <Box overflowX="auto">
                  <Table.Root
                  variant="surface"
                  size="md"
                    w="592px"
                    minW="592px"
                    maxW="592px"
                    striped
                    stickyHeader
                    style={{ "table-layout": "fixed" }}
                  >
                    <Table.Head>
                      <Table.Row>
                      <Table.Header w="78px">Variant</Table.Header>
                      <Table.Header w="108px">Detail</Table.Header>
                      <For each={namedGridPaletteColumns()}>
                        {(group) => (
                          <Table.Header
                              w="22px"
                              px="0.25"
                              textAlign="center"
                              verticalAlign="bottom"
                              h="86px"
                          >
                            <Box
                              as="span"
                              display="inline-block"
                              fontSize="xs"
                              lineHeight="tight"
                              writingMode="vertical-rl"
                              transform="rotate(180deg)"
                              textTransform="capitalize"
                              whiteSpace="nowrap"
                            >
                              {group.palette}
                            </Box>
                          </Table.Header>
                        )}
                      </For>
                      </Table.Row>
                    </Table.Head>
                    <Table.Body>
                      <For each={namedGridRoleRowGroups()}>
                        {(group) => (
                          <>
                            <Table.Row>
                              <Table.Cell
                                colSpan={2 + namedGridPaletteColumns().length}
                                bg="bg.subtle"
                                py="0.5"
                                px="1"
                              >
                                <Box
                                  textStyle="2xs"
                                  fontWeight="semibold"
                                  textTransform="uppercase"
                                  letterSpacing="wide"
                                  color="fg.muted"
                                >
                                  {group.variant}
                                </Box>
                              </Table.Cell>
                            </Table.Row>
                            <For each={group.rows}>
                              {(row) => (
                                <Table.Row>
                                <Table.Cell>
                                  <Box
                                    textStyle="2xs"
                                      fontWeight="semibold"
                                      textTransform="capitalize"
                                    >
                                      {row.variant}
                                    </Box>
                                  </Table.Cell>
                                <Table.Cell>
                                  <Box textStyle="2xs" color="fg.muted" fontFamily="mono">
                                    {row.detail}
                                  </Box>
                                </Table.Cell>
                                  <For each={namedGridPaletteColumns()}>
                                    {(paletteGroup) => {
                                      const role = paletteGroup.roles.find(
                                        (item) => item.key === row.key,
                                      );
                                      return (
                                        <Table.Cell p="0.125" py="0.25" textAlign="center">
                                          <Show
                                            when={role}
                                            fallback={
                                            <Box h="6" w="6" display="inline-block" />
                                            }
                                          >
                                            {(item) => (
                                              <Tooltip
                                                openDelay={120}
                                                closeDelay={80}
                                                interactive
                                                contentProps={SWATCH_TOOLTIP_CONTENT_PROPS}
                                                content={
                                                  <ColorSwatchTooltip item={item()} />
                                                }
                                              >
                                                <Box
                                                h="6"
                                                w="6"
                                                display="inline-block"
                                                  borderRadius="l1"
                                                  borderWidth="1px"
                                                  borderColor="border"
                                                  style={{
                                                    "background-color": `var(${item().cssVar})`,
                                                  }}
                                                />
                                              </Tooltip>
                                            )}
                                          </Show>
                                        </Table.Cell>
                                      );
                                    }}
                                  </For>
                                </Table.Row>
                              )}
                            </For>
                          </>
                        )}
                      </For>
                    </Table.Body>
                  </Table.Root>
                </Box>
              </Box>
            </VStack>
          </VStack>
        </VStack>
      </Show>

      <Show when={props.section === "layout"}>
        <VStack alignItems="stretch" gap="3">
          <HStack justifyContent="space-between" alignItems="center">
            <Box textStyle="lg" fontWeight="semibold">
              Layout
            </Box>
            <HStack gap="2" alignItems="center">
              <Box textStyle="xs" color="fg.muted">
                {layoutTokenCount()} tokens
              </Box>
              <HStack gap="1">
                <Button
                  size="xs"
                  variant={sizeDisplayUnit() === "rem" ? "solid" : "outline"}
                  onClick={() => setSizeDisplayUnit("rem")}
                >
                  Rem
                </Button>
                <Button
                  size="xs"
                  variant={sizeDisplayUnit() === "px" ? "solid" : "outline"}
                  onClick={() => setSizeDisplayUnit("px")}
                >
                  Px
                </Button>
              </HStack>
            </HStack>
          </HStack>

          <VStack alignItems="stretch" gap="2">
            <Show when={textualSizes().length > 0}>
              <VStack alignItems="stretch" gap="1.5">
                <Box textStyle="2xs" color="fg.muted">
                  Keyword / Content Sizes
                </Box>
                <Box
                  class={css({
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: "1.5",
                  })}
                >
                  <For each={textualSizes()}>
                    {(metric) => (
                      <VStack
                        alignItems="stretch"
                        gap="0.75"
                        p="2"
                        borderWidth="1px"
                        borderColor="border"
                        borderRadius="l1"
                        bg="bg.subtle"
                      >
                        <Box
                          textStyle="2xs"
                          color="fg.default"
                          fontWeight="medium"
                          fontFamily="mono"
                        >
                          {metric.token}
                        </Box>
                        <Box textStyle="2xs" color="fg.muted" fontFamily="mono">
                          {metric.rawValue}
                        </Box>
                      </VStack>
                    )}
                  </For>
                </Box>
              </VStack>
            </Show>

            <Show when={measuredSizes().length > 0}>
              <VStack alignItems="stretch" gap="1">
                <HStack justifyContent="space-between" alignItems="center">
                  <Box textStyle="2xs" color="fg.muted">
                    Measured Sizes
                  </Box>
                  <Box textStyle="2xs" color="fg.muted">
                    Sorted by resolved px, display in {sizeDisplayUnit()}
                  </Box>
                </HStack>
              </VStack>
            </Show>

            <Box
              class={css({
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "1.5",
              })}
            >
              <For each={measuredSizes()}>
                {(metric, index) => (
                  <HStack
                    alignItems="center"
                    gap="2"
                    p="2"
                    borderWidth="1px"
                    borderColor="border"
                    borderRadius="l1"
                  >
                    <Box
                      textStyle="2xs"
                      color="fg.default"
                      fontWeight="medium"
                      fontFamily="mono"
                      minW="0"
                      flex="1"
                      whiteSpace="nowrap"
                      overflow="hidden"
                      textOverflow="ellipsis"
                    >
                      {metric.token}
                    </Box>
                    <Box
                      textStyle="2xs"
                      color="fg.muted"
                      whiteSpace="nowrap"
                      fontFamily="mono"
                    >
                      <Show
                        when={sizeDisplayUnit() === "rem"}
                        fallback={
                          <Show
                            when={metric.pxValue !== null}
                            fallback={metric.rawValue}
                          >
                            {metric.pxValue?.toFixed(2).replace(/\.?0+$/, "")}px
                          </Show>
                        }
                      >
                        <Show
                          when={metric.remValue !== null}
                          fallback={metric.rawValue}
                        >
                          {metric.remValue?.toFixed(3).replace(/\.?0+$/, "")}rem
                        </Show>
                      </Show>
                    </Box>
                    <Box
                      h="2"
                      minW="70px"
                      flex="0 0 70px"
                      borderRadius="l1"
                      borderWidth="1px"
                      borderColor="border"
                      bg="bg.subtle"
                      position="relative"
                      overflow="hidden"
                    >
                      <Box
                        h="full"
                        bg={
                          recipeColorPalettes()[
                            index() % recipeColorPalettes().length
                          ] ?? "blue.9"
                        }
                        style={{
                          width:
                            metric.pxValue !== null && maxMeasuredPx() > 0
                              ? `${Math.max(
                                  2,
                                  (metric.pxValue / maxMeasuredPx()) * 100,
                                )}%`
                              : "4px",
                        }}
                      />
                    </Box>
                  </HStack>
                )}
              </For>
            </Box>

            <VStack
              alignItems="stretch"
              gap="2"
              p="3"
              borderWidth="1px"
              borderColor="border"
              borderRadius="l2"
            >
              <Box textStyle="sm" fontWeight="semibold">
                Layout Scale Tokens
              </Box>
              <For each={layoutThemeCategories()}>
                {(category) => (
                  <VStack alignItems="stretch" gap="1">
                    <HStack justifyContent="space-between" alignItems="center">
                      <Box
                        textStyle="xs"
                        color="fg.muted"
                        fontWeight="semibold"
                      >
                        {category.label}
                      </Box>
                      <Box textStyle="2xs" color="fg.muted">
                        {category.tokens.length} tokens
                      </Box>
                    </HStack>
                    <Box
                      class={css({
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(210px, 1fr))",
                        gap: "1",
                      })}
                    >
                      <For each={category.tokens}>
                        {(item) => (
                          <VStack
                            alignItems="stretch"
                            gap="1"
                            p="2"
                            borderWidth="1px"
                            borderColor="border"
                            borderRadius="l1"
                            bg={item.isAlias ? "bg.subtle" : "transparent"}
                          >
                            <HStack
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Box
                                textStyle="2xs"
                                color="fg.default"
                                fontFamily="mono"
                              >
                                {item.token}
                              </Box>
                              <Show when={item.isAlias}>
                                <Box textStyle="2xs" color="fg.muted">
                                  alias
                                </Box>
                              </Show>
                            </HStack>
                            <Box
                              textStyle="2xs"
                              color="fg.muted"
                              fontFamily="mono"
                            >
                              {String(item.value)}
                            </Box>
                            <Show
                              when={
                                category.key === "spacing" ||
                                category.key === "breakpoints"
                              }
                            >
                              <Box
                                h="2"
                                borderRadius="l1"
                                borderWidth="1px"
                                borderColor="border"
                                bg="bg.subtle"
                                overflow="hidden"
                              >
                                <Box
                                  h="full"
                                  bg="blue.9"
                                  style={{
                                    width:
                                      item.numericValue !== null
                                        ? `${Math.min(
                                            100,
                                            Math.max(2, item.numericValue * 4),
                                          )}%`
                                        : "4px",
                                  }}
                                />
                              </Box>
                            </Show>
                            <Show when={category.key === "radii"}>
                              <Box
                                h="7"
                                borderWidth="1px"
                                borderColor="border"
                                bg="bg.subtle"
                                style={{
                                  "border-radius":
                                    typeof item.value === "string"
                                      ? item.value
                                      : `${item.value}px`,
                                }}
                              />
                            </Show>
                            <Show when={category.key === "aspectRatios"}>
                              <Box
                                w="full"
                                h="0"
                                borderWidth="1px"
                                borderColor="border"
                                bg="bg.subtle"
                                style={{
                                  "padding-top":
                                    item.numericValue !== null
                                      ? `${100 / item.numericValue}%`
                                      : "56.25%",
                                }}
                              />
                            </Show>
                          </VStack>
                        )}
                      </For>
                    </Box>
                  </VStack>
                )}
              </For>
            </VStack>
          </VStack>
        </VStack>
      </Show>

      <Show when={props.section === "typography"}>
        <VStack alignItems="stretch" gap="3">
          <HStack justifyContent="space-between" alignItems="center">
            <Box textStyle="lg" fontWeight="semibold">
              Typography
            </Box>
            <Box textStyle="xs" color="fg.muted">
              {typographyTokenCount()} tokens
            </Box>
          </HStack>

          <VStack alignItems="stretch" gap="2.5">
            <Box textStyle="xs" color="fg.muted" fontWeight="semibold">
              Font Families
            </Box>
            <Box
              class={css({
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1.5",
              })}
            >
              <For each={fontFamilyTokens()}>
                {(tokenName) => (
                  <VStack
                    alignItems="stretch"
                    gap="1"
                    p="2"
                    borderWidth="1px"
                    borderColor="border"
                    borderRadius="l1"
                  >
                    <Box textStyle="2xs" color="fg.default" fontFamily="mono">
                      {tokenName}
                    </Box>
                    <Box textStyle="2xs" color="fg.muted" fontFamily="mono">
                      {getTokenValue(`fonts.${tokenName}`)}
                    </Box>
                    <Box
                      style={{
                        "font-family": getTokenValue(`fonts.${tokenName}`),
                      }}
                    >
                      The quick brown fox jumps over 123.
                    </Box>
                  </VStack>
                )}
              </For>
            </Box>
          </VStack>

          <VStack alignItems="stretch" gap="2.5">
            <Box textStyle="xs" color="fg.muted" fontWeight="semibold">
              Font Sizes
            </Box>
            <VStack alignItems="stretch" gap="1">
              <For each={sortedFontSizeTokens()}>
                {(tokenName) => (
                  <HStack
                    justifyContent="space-between"
                    alignItems="center"
                    p="2"
                    borderWidth="1px"
                    borderColor="border"
                    borderRadius="l1"
                  >
                    <HStack gap="2" minW="0" flex="1" alignItems="baseline">
                      <Box textStyle="2xs" color="fg.default" fontFamily="mono">
                        {tokenName}
                      </Box>
                      <Box
                        style={{
                          "font-size": getTokenValue(`fontSizes.${tokenName}`),
                        }}
                      >
                        Sample Aa
                      </Box>
                    </HStack>
                    <Box textStyle="2xs" color="fg.muted" fontFamily="mono">
                      {getTokenValue(`fontSizes.${tokenName}`)}
                    </Box>
                  </HStack>
                )}
              </For>
            </VStack>
          </VStack>

          <HStack alignItems="flex-start" gap="2.5">
            <VStack alignItems="stretch" gap="1.5" flex="1" minW="0">
              <Box textStyle="xs" color="fg.muted" fontWeight="semibold">
                Font Weights
              </Box>
              <For each={sortedFontWeightTokens()}>
                {(tokenName) => (
                  <HStack
                    justifyContent="space-between"
                    alignItems="center"
                    p="2"
                    borderWidth="1px"
                    borderColor="border"
                    borderRadius="l1"
                  >
                    <Box textStyle="2xs" color="fg.default" fontFamily="mono">
                      {tokenName}
                    </Box>
                    <Box
                      style={{
                        "font-weight": getTokenValue(
                          `fontWeights.${tokenName}`,
                        ),
                      }}
                    >
                      Weight
                    </Box>
                    <Box textStyle="2xs" color="fg.muted" fontFamily="mono">
                      {getTokenValue(`fontWeights.${tokenName}`)}
                    </Box>
                  </HStack>
                )}
              </For>
            </VStack>

            <VStack alignItems="stretch" gap="1.5" flex="1" minW="0">
              <Box textStyle="xs" color="fg.muted" fontWeight="semibold">
                Line Heights
              </Box>
              <For each={sortedLineHeightTokens()}>
                {(tokenName) => (
                  <HStack
                    justifyContent="space-between"
                    alignItems="center"
                    p="2"
                    borderWidth="1px"
                    borderColor="border"
                    borderRadius="l1"
                  >
                    <Box textStyle="2xs" color="fg.default" fontFamily="mono">
                      {tokenName}
                    </Box>
                    <Box
                      textStyle="xs"
                      style={{
                        "line-height": getTokenValue(
                          `lineHeights.${tokenName}`,
                        ),
                      }}
                    >
                      A line
                    </Box>
                    <Box textStyle="2xs" color="fg.muted" fontFamily="mono">
                      {getTokenValue(`lineHeights.${tokenName}`)}
                    </Box>
                  </HStack>
                )}
              </For>
            </VStack>
          </HStack>

          <VStack alignItems="stretch" gap="1.5">
            <Box textStyle="xs" color="fg.muted" fontWeight="semibold">
              Letter Spacing
            </Box>
            <For each={sortedLetterSpacingTokens()}>
              {(tokenName) => (
                <HStack
                  justifyContent="space-between"
                  alignItems="center"
                  p="2"
                  borderWidth="1px"
                  borderColor="border"
                  borderRadius="l1"
                >
                  <Box textStyle="2xs" color="fg.default" fontFamily="mono">
                    {tokenName}
                  </Box>
                  <Box
                    textStyle="xs"
                    style={{
                      "letter-spacing": getTokenValue(
                        `letterSpacings.${tokenName}`,
                      ),
                    }}
                  >
                    Tracking
                  </Box>
                  <Box textStyle="2xs" color="fg.muted" fontFamily="mono">
                    {getTokenValue(`letterSpacings.${tokenName}`)}
                  </Box>
                </HStack>
              )}
            </For>
          </VStack>
        </VStack>
      </Show>

      <Show when={props.section === "motion"}>
        <VStack alignItems="stretch" gap="3">
          <HStack justifyContent="space-between" alignItems="center">
            <Box textStyle="lg" fontWeight="semibold">
              Motion
            </Box>
            <Box textStyle="xs" color="fg.muted">
              {motionTokenCount()} tokens
            </Box>
          </HStack>

          <For each={motionThemeCategories()}>
            {(category) => (
              <VStack
                alignItems="stretch"
                gap="2"
                p="3"
                borderWidth="1px"
                borderColor="border"
                borderRadius="l2"
              >
                <HStack justifyContent="space-between" alignItems="center">
                  <Box textStyle="sm" fontWeight="semibold">
                    {category.label}
                  </Box>
                  <Box textStyle="2xs" color="fg.muted">
                    {category.tokens.length} tokens
                  </Box>
                </HStack>
                <Box
                  class={css({
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: "1",
                  })}
                >
                  <For each={category.tokens}>
                    {(item) => (
                      <VStack
                        alignItems="stretch"
                        gap="1"
                        p="2"
                        borderWidth="1px"
                        borderColor="border"
                        borderRadius="l1"
                      >
                        <Box
                          textStyle="2xs"
                          color="fg.default"
                          fontFamily="mono"
                        >
                          {item.token}
                        </Box>
                        <Box textStyle="2xs" color="fg.muted" fontFamily="mono">
                          {String(item.value)}
                        </Box>
                        <Show when={category.key === "durations"}>
                          <Box
                            h="2"
                            borderRadius="l1"
                            borderWidth="1px"
                            borderColor="border"
                            bg="bg.subtle"
                            overflow="hidden"
                          >
                            <Box
                              h="full"
                              bg="green.9"
                              style={{
                                width:
                                  item.numericValue !== null
                                    ? `${Math.min(
                                        100,
                                        Math.max(4, item.numericValue / 4),
                                      )}%`
                                    : "8px",
                              }}
                            />
                          </Box>
                        </Show>
                        <Show when={category.key === "animations"}>
                          <Box pb="28">
                            <Box
                              textStyle="2xs"
                              color="fg.default"
                              px="2"
                              py="1"
                              borderWidth="1px"
                              borderColor="border"
                              borderRadius="l1"
                              style={{
                                animation:
                                  typeof item.value === "string"
                                    ? item.value
                                    : undefined,
                              }}
                            >
                              animate
                            </Box>
                          </Box>
                        </Show>
                      </VStack>
                    )}
                  </For>
                </Box>
              </VStack>
            )}
          </For>
        </VStack>
      </Show>

      <Show when={props.section === "effects"}>
        <VStack alignItems="stretch" gap="3">
          <HStack justifyContent="space-between" alignItems="center">
            <Box textStyle="lg" fontWeight="semibold">
              Effects
            </Box>
            <Box textStyle="xs" color="fg.muted">
              {effectTokenCount()} tokens
            </Box>
          </HStack>

          <For each={effectThemeCategories()}>
            {(category) => (
              <VStack
                alignItems="stretch"
                gap="2"
                p="3"
                borderWidth="1px"
                borderColor="border"
                borderRadius="l2"
              >
                <HStack justifyContent="space-between" alignItems="center">
                  <Box textStyle="sm" fontWeight="semibold">
                    {category.label}
                  </Box>
                  <Box textStyle="2xs" color="fg.muted">
                    {category.tokens.length} tokens
                  </Box>
                </HStack>
                <Box
                  class={css({
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: "1",
                  })}
                >
                  <For each={category.tokens}>
                    {(item) => (
                      <VStack
                        alignItems="stretch"
                        gap="1"
                        p="2"
                        borderWidth="1px"
                        borderColor="border"
                        borderRadius="l1"
                        bg={item.isAlias ? "bg.subtle" : "transparent"}
                      >
                        <HStack
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Box
                            textStyle="2xs"
                            color="fg.default"
                            fontFamily="mono"
                          >
                            {item.token}
                          </Box>
                          <Show when={item.isAlias}>
                            <Box textStyle="2xs" color="fg.muted">
                              alias
                            </Box>
                          </Show>
                        </HStack>
                        <Box textStyle="2xs" color="fg.muted" fontFamily="mono">
                          {String(item.value)}
                        </Box>
                        <Show when={category.key === "shadows"}>
                          <Box
                            h="8"
                            borderRadius="l1"
                            borderWidth="1px"
                            borderColor="border"
                            bg="bg.subtle"
                            style={{
                              "box-shadow":
                                typeof item.value === "string"
                                  ? item.value
                                  : undefined,
                            }}
                          />
                        </Show>
                        <Show when={category.key === "blurs"}>
                          <Box
                            h="8"
                            borderRadius="l1"
                            borderWidth="1px"
                            borderColor="border"
                            bg="blue.subtle.bg"
                            style={{
                              filter:
                                typeof item.value === "string"
                                  ? `blur(${item.value})`
                                  : item.numericValue !== null
                                    ? `blur(${item.numericValue}px)`
                                    : undefined,
                            }}
                          />
                        </Show>
                      </VStack>
                    )}
                  </For>
                </Box>
              </VStack>
            )}
          </For>
        </VStack>
      </Show>
    </VStack>
  );
};
