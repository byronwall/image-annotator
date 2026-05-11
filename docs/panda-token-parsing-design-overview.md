# Panda Token Parsing and Design Overview Generation

This document explains how the Comps Explorer design system pages are generated from Panda CSS tokens at runtime.

## Source files

- `app/src/components/comps-explorer/CompsExplorer.tsx`
- `app/src/components/comps-explorer/compsExplorer.shared.ts`
- `app/src/components/comps-explorer/CompsExplorerSidebar.tsx`
- `app/src/components/comps-explorer/DesignSystemOverview.tsx`

## High-level flow

1. The sidebar selects a design system page via query param `?component=...`.
2. `CompsExplorer.tsx` maps that component key to a `DesignSystemSection`.
3. `DesignSystemOverview.tsx` reads all CSS custom properties from `document.documentElement` on mount.
4. It filters variables by Panda token prefixes (for example `--colors-`, `--sizes-`, `--font-sizes-`, etc.).
5. It normalizes token names from CSS var format into token paths.
6. It resolves token values through Panda's `token()` helper when needed.
7. It computes grouped/sorted view models and renders each section.

## Section routing

Design system query keys are defined in `compsExplorer.shared.ts`:

- `design-system-colors`
- `design-system-layout`
- `design-system-typography`
- `design-system-motion`
- `design-system-effects`

`CompsExplorer.tsx` maps these to:

- `colors`
- `layout`
- `typography`
- `motion`
- `effects`

Backward compatibility is included for legacy keys:

- `design-system-sizes` -> `layout`
- `design-system-theme` -> `layout`

## Runtime token discovery

In `DesignSystemOverview.tsx`, `onMount()` does runtime discovery:

- Uses `getComputedStyle(document.documentElement)`.
- Iterates all style property names.
- Keeps only keys that start with `--`.
- Builds filtered lists by prefix, for example:
  - Colors: `--colors-`
  - Sizes: `--sizes-`
  - Typography: `--fonts-`, `--font-sizes-`, `--font-weights-`, `--line-heights-`, `--letter-spacings-`
  - Theme-like categories: driven by `THEME_CATEGORY_CONFIG` prefix map

This means the UI reflects what Panda actually emitted into CSS for the current app/theme build.

## Token normalization and resolution

### CSS var name -> token key

`parseCssVarToken(cssVar, prefix)` strips the prefix and unescapes dots:

- Example: `--sizes-2\\.5` -> `2.5`
- Example: `--font-sizes-sm` -> `sm`

### Token value lookup

`getTokenValue(path)` uses Panda's `token()` helper:

- Example: `token("sizes.2.5", "sizes.2.5")`
- Returns resolved token value if available; fallback is path string.

### Numeric parsing and sorting

- `parseNumericTokenValue` safely handles `string | number | unknown`.
- `parseThemeNumericValue` has category-specific behavior:
  - Aspect ratios parse as fraction math (`16 / 9` -> `1.777...`).
  - `var(...)` aliases are treated as non-numeric.
- Numeric values are used for sorted displays (font sizes, weights, line heights, spacing-like data).

## Size token generation details

Sizes are assembled from two sources:

1. CSS vars discovered at runtime (`--sizes-*`).
2. Recipe string references discovered by regex scan of all recipe object strings (`sizes.<token>`).

This is done by:

- `collectStringValues(recipes, result)`
- `collectTokenReferences(SIZE_REFERENCE_PATTERN)`

Then `sizeTokens` de-duplicates + sorts with `toSortedList`.

For measured sizes:

- A hidden DOM host is created in `queueMicrotask`.
- Each size token is applied as `width: var(--sizes-...)` on a probe element.
- Computed `px` width is read from the browser.
- `rem` is derived using root font size when possible.
- Textual tokens (`fit-content`, `min-content`, `max-content`, `auto`) are flagged and handled separately.

## Colors page generation details

### Palette grouping

`parseColorCssVar` transforms `--colors-*` into:

- `palette` (for example `amber`, `blue`, `bg`, `fg`)
- `key` (for example `9`, `a9`, `solid.bg`)
- `tokenPath` (for display/reference)

Each palette is split into:

- Scale (`1..12`)
- Alpha (`a1..a12`)
- Semantic/state (everything else)

### Recipe-awareness

The code scans recipe variants for `colorPalette` axis values. If a palette is used there, the group header shows:

- `recipe: colorPalette="<palette>"`

### Semantic role grouping

Semantic/state tokens are compactly grouped by first segment (`solid`, `plain`, `outline`, etc.) via `groupSemanticRoles`.

## Theme category config (layout/motion/effects)

`THEME_CATEGORY_CONFIG` controls non-color/non-typography categories by mapping:

- `key` (UI identity)
- `label` (UI label)
- `prefix` (CSS var prefix)
- `tokenCategory` (Panda token lookup root)
- `group` (`layout` | `motion` | `effects`)

To add a new theme-like category:

1. Add a new entry to `THEME_CATEGORY_CONFIG`.
2. Ensure Panda emits vars with the matching prefix.
3. Optionally add category-specific preview UI.

## Typography page generation details

Typography tokens are built from runtime CSS var prefix lists:

- fonts
- font sizes
- font weights
- line heights
- letter spacing

Displays are sorted numerically when possible (not alphabetically), using `parseNumericTokenValue(getTokenValue(...))`.

## Motion and Effects page generation details

These pages render from `themeCategories` filtered by group:

- Motion: `durations`, `easings`, `animations`
- Effects: `shadows`, `blurs`

Each category has lightweight previews:

- Durations: progress bar width scaled by duration value
- Animations: animated sample label
- Shadows: box-shadow preview block
- Blurs: blur filter preview block

## Why this approach

- Uses runtime CSS vars, so the overview matches actual emitted Panda tokens.
- Uses `token()` lookup, so displayed values align with Panda token references.
- Keeps adding token categories mostly declarative (`THEME_CATEGORY_CONFIG`).
- Avoids hardcoding long token lists in the UI.

## Current limitations

- Discovery depends on CSS vars being present in the current runtime/theme scope.
- Aliased values (`var(...)`) may not produce numeric sort values.
- Size measurement requires DOM measurement and runs client-side only.

## Debugging hooks

`DesignSystemOverview` currently logs theme catalog data to console:

- `[DesignSystemOverview] theme token catalog`
- `[DesignSystemOverview] theme token catalog (detailed)`

This helps validate category coverage and token values while adjusting grouping/visualization.
