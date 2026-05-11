---
name: color-palette-check-and-add
description: Verify whether a Panda/ParkUI color palette exists before use, and add/register it safely when missing. Use when style tokens like `blue.*` or `colorPalette: "blue"` fail, or when introducing a new palette.
---

# Color Palette Check + Add

## Goal

Prevent broken style tokens by ensuring a requested palette is present in Panda semantic tokens and generated output before using it in UI styles.

## When To Use

- A style uses `colorPalette: "<palette>"` and the palette appears missing.
- A style uses tokens like `<palette>.2` / `<palette>.7` and runtime/typing indicates they are unavailable.
- You are introducing a new color palette for UI consistency.

## Workflow

1. Confirm the palette is expected in theme config.
2. Confirm generated tokens include the palette.
3. If missing, add palette files with Park UI CLI.
4. Ensure palette is registered in `app/panda.config.ts`.
5. Regenerate Panda output.
6. Type-check and continue feature work.

## Steps

### 1) Check theme registration

- Inspect `app/panda.config.ts`:
  - `theme.extend.semanticTokens.colors.<palette>` must be present.
- Inspect `app/src/theme/colors/`:
  - A matching file such as `app/src/theme/colors/<palette>.ts` should exist.

### 2) Check generated token availability

- Verify generated tokens include the palette:
  - `rg -n -e "colors\\.<palette>" app/styled-system/tokens/index.mjs`

If missing from generated tokens, continue to Step 3.

### 3) Add palette with Park UI CLI

- Run:
  - `pnpm dlx @park-ui/cli add <palette>`

Notes:
- Use `pnpm` (not `npx`) in this repo.
- The command may add/update `app/src/theme/colors/<palette>.ts` and `app/panda.config.ts`.

### 4) Register palette if needed

- If CLI did not wire it:
  - Add import in `app/panda.config.ts`:
    - `import { <palette> } from "~/theme/colors/<palette>";`
  - Register under `theme.extend.semanticTokens.colors`:
    - `<palette>: <palette>,`

### 5) Regenerate Panda system

- Run:
  - `pnpm -C app panda codegen`

### 6) Validate

- Run:
  - `pnpm -C app type-check`
- Re-run token verification grep:
  - `rg -n -e "colors\\.<palette>" app/styled-system/tokens/index.mjs`

## Guardrails

- Do not edit `app/styled-system/` by hand.
- Prefer palette tokens (`<palette>.*` / `colorPalette`) over one-off hex values.
- Keep palette naming consistent with ParkUI/Panda conventions.
