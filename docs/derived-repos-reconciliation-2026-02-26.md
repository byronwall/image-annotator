# Derived Repos -> Starter Reconciliation (2026-02-26)

## Scope

Reviewed and reconciled from:

- `/Users/byronwall/Projects/visual-notes`
- `/Users/byronwall/Projects/llm-question-asker`
- `/Users/byronwall/Projects/vacation-planner`

Goal: bring broadly reusable guidance/components/skills back into the starter, while skipping domain-specific product features.

## Imported

### 1) Skills

Added reusable skills into `.agents/skills/`:

- `solid-props-state-patterns`
- `solid-reactivity-control-flow`
- `solid-structure-types-quality`
- `solid-ui-composition-patterns`
- `solidstart-data-async`
- `color-palette-check-and-add`

Not imported: `planner-ui-ux-preferences` (planner-specific).

### 2) AGENTS guidance updates

`AGENTS.md` now includes reconciled rules from derived repos:

- `pnpm`/`pnpm dlx` command convention.
- Prefer wrapper components over native interactive controls when wrappers exist.
- Tooltip/accessibility guidance (`Tooltip` wrapper over native `title`).
- Ark `asChild` getter callback usage (`...props()`).
- Form labeling preference (explicit labels).
- Palette-token workflow and codegen/type-check loop.

### 3) Shared UI wrapper improvements

Updated starter wrappers with reusable behavior proven in derived repos:

- `app/src/components/ui/tooltip.tsx`
  - Fixed Ark `asChild` callback spread (`...triggerProps()`).
- `app/src/components/ui/clear-button.tsx`
  - Replaced `title` tooltip behavior with shared `Tooltip` wrapper.
- `app/src/components/ui/simple-dialog.tsx`
  - Added `initialFocusEl` and `restoreFocus` pass-through for focus-control scenarios.
- `app/src/components/ui/simple-popover.tsx`
  - Added left/right placements and fit-content anchor behavior.
- `app/src/components/ui/panel-popover.tsx`
  - Added fit-content anchor behavior.
- `app/src/components/ui/simple-select.tsx`
  - Improved positioning defaults (`sameWidth` unless explicitly disabled).
  - Avoids forcing empty selected value.
  - Adds max-height constraint on dropdown content.

### 4) Reference docs imported

Imported generally reusable docs into `docs/references/` for curation:

- `docs/references/visual-notes-playwright-mcp-testing-guide.md`
- `docs/references/llm-question-asker-code-block-feature-baseline.md`
- `docs/references/llm-question-asker-websocket-architecture.md`

### 5) Additional imports (2026-02-26 follow-up)

Added reusable runtime components and utilities:

- Markdown rendering stack from `llm-question-asker`:
  - `app/src/components/MarkdownRenderer.tsx`
  - `app/src/components/markdown-*.tsx`
  - `app/src/components/line-numbered-code.tsx`
  - `app/src/components/highlighted-line-numbered-code.tsx`
  - `app/src/components/use-mermaid-viewport.ts`
  - `app/src/lib/markdown-utils.ts`
- Console capture/viewer stack from `visual-notes`:
  - `app/src/lib/console-log-capture.ts`
  - `app/src/components/ConsoleLogsPanel.tsx`
  - `app/src/components/SidePanel.tsx`
  - `app/src/components/console-logs/*`

Updated guidance to use `createResource` (instead of `createAsync`) for read patterns:

- `AGENTS.md`
- `app/AGENTS.MD`
- `.agents/skills/solidstart-data-async/SKILL.md`

## Reviewed But Not Ported

- Domain-specific feature components in `vacation-planner/app/src/components/planner/*`.
- Product-specific components/workflows from `visual-notes` and `llm-question-asker` (editor, consultation/jobs flows, route/business logic).
- Project-specific docs that do not generalize to the starter.

## Follow-up candidates

Potential future optional imports if desired:

- Markdown rendering component kit from `llm-question-asker` (requires dependency and API alignment work).
- Generalized doc/table-of-contents utilities from `visual-notes`.
