# Visual Notes -> Starter Reconciliation (2026-02-15)

## Goal

Bring reusable, developer-oriented improvements from:

- Source: `/Users/byronwall/Projects/visual-notes`
- Target: `/Users/byronwall/Projects/solid-start-panda-park-ui`

Scope prioritized common assets: agent guidance, local skills, docs, general-purpose UI wrappers, and tooling boosts.

## Imported Assets

### 1) Agent + skill system

- Added root agent guide:
  - `AGENTS.md`
- Added local skill packs:
  - `.agents/skills/component-structure-minimal-dom/*`
  - `.agents/skills/post-work-doc-playbook/*`
  - `.agents/skills/tiptap-codeblock-stability-playbook/*`
  - `.agents/skills/tiptap-nodeview-migration-playbook/*`
  - `.agents/skills/toc-rail-layout-playbook/*`

Why:

- Gives the starter a reusable instruction system for future implementation/debug/documentation sessions.
- Captures workflow patterns that were previously only available in the visual-notes repo.

### 2) Repo tooling boost

- Added Ark MCP wiring:
  - `.mcp.json`

Why:

- Enables component-aware tooling for Ark UI from the starter repo directly.

### 3) New general-purpose UI components

Copied from visual-notes into starter:

- `app/src/components/ui/WrapWhen.tsx`
- `app/src/components/ui/clear-button.tsx`
- `app/src/components/ui/confirm-dialog.tsx`
- `app/src/components/ui/panel-popover.tsx`
- `app/src/components/ui/simple-dialog.tsx`
- `app/src/components/ui/simple-popover.tsx`
- `app/src/components/ui/simple-select.tsx`

Why:

- These are composable wrappers/utilities not tied to visual-notes domain data.
- They reduce repeated overlay/select/dialog boilerplate and standardize interaction patterns.

### 4) Upgrades to existing starter wrappers

Updated files:

- `app/src/components/ui/button.tsx`
  - Preserves explicit `type` when passed (`type={rest.type ?? "button"}`).
- `app/src/components/ui/file-upload.tsx`
  - Fixed invalid alias import (`@/components/ui` -> `~/components/ui/span`).
- `app/src/components/ui/select.tsx`
  - Added `RootProvider` export and list collection exports (`createListCollection`, `ListCollection`) needed by simplified select wrappers.
- `app/src/components/ui/tooltip.tsx`
  - Uses `Trigger asChild` with native element wrapper for safer trigger anchoring.

Why:

- Improves correctness, wrapper interoperability, and consistency with reconciled components.

### 5) Theme improvements

Added:

- `app/src/theme/colors/amber.ts`

Updated:

- `app/panda.config.ts`
  - Registers `amber` semantic palette.
  - Adds semantic background tokens: `bg.default`, `bg.muted`, `bg.subtle`.

Why:

- Expands reusable semantic color surface for future components and variants.

### 6) Dev workflow + test/type scaffolding

Added:

- `app/vitest.config.ts`

Updated:

- `app/package.json`
  - Added scripts: `test`, `type-check`, `panda`.
  - Added dev deps: `vitest`, `typescript`, `@types/node`.
- `app/tsconfig.json`
  - Added `vite/client` and `@solidjs/start/env` types.
  - Added `skipLibCheck` and `exclude`.

Why:

- Provides a baseline test/type-check workflow expected in active starter repos.

### 7) Documentation refresh

Updated:

- `README.md`
- `app/README.md`
- `app/AGENTS.MD`

Added:

- `docs/visual-notes-reconciliation-2026-02-15.md` (this document)

Why:

- Makes the imported capabilities discoverable and operational for future contributors.

## Intentionally Not Imported

- Visual-notes app domain features (Prisma models, auth flows, AI features, routes, embeddings/UMAP, Docker deployment specifics).
- Product-specific UI and state-management code tied to visual-notes workflows.

Reason:

- The request prioritized reusable starter-level assets and dev-oriented boosts, not product-specific behavior.

## Validation Checklist

- New UI wrappers are present in starter UI directory.
- Reconciled wrapper dependencies compile against starter aliases/exports.
- Dev scripts/config for type-check and tests are in place.
- Agent + skills + docs are discoverable from repo root.

