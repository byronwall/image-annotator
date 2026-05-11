# Reference: Code Block Feature Baseline (Imported)

Source: /Users/byronwall/Projects/llm-question-asker/docs/code-block-feature-baseline.md

# Code Block Features Baseline

This document defines the baseline behavior for markdown code viewing in the app. Future code-viewing features should preserve these capabilities unless explicitly replaced.

## Scope

- Applies to markdown `pre > code` rendering in the UI.
- Covers inline code, fenced code blocks, highlighted blocks, and expanded/fullscreen code view.
- Includes routing to Mermaid rendering for Mermaid-like blocks.

## Core Feature Set

### 1. Language detection and normalization

- Code block language is resolved from:
  - `data-md-language` (preferred when already resolved), then
  - class name parsing (`language-*`) fallback.
- Raw code text is preserved via `data-md-raw` and used for downstream behavior.
- Trailing newline normalization is applied before rendering/line counting.

### 2. Shared line-numbered renderer

- All block code rendering goes through a single shared line-numbered renderer pipeline.
- The same rendering pipeline is used in:
  - the main markdown block view, and
  - expanded/fullscreen code view.
- Line wrapping generates one `.code-line` span per source line with `data-line`.

### 3. Syntax highlighting with fallback

- Highlighting is attempted through Shiki (`github-light` theme).
- If highlighting fails (or language is `mermaid`), rendering falls back to escaped plain text with preserved line structure.
- Highlighting result is line-wrapped so line numbers remain aligned.

### 4. Digit-aware line number gutter

- Line number gutter width is computed from actual line count digits.
- Width is passed through shared CSS variables (`--md-code-line-digits`, derived column vars).
- Gutter behavior is consistent between inline block view and expanded view.

### 5. Auto-collapse for long blocks

- Long code blocks auto-collapse when measured height exceeds `CODE_BLOCK_COLLAPSED_HEIGHT` (`240px`).
- Collapsed state shows:
  - gradient fade overlay,
  - toggle control (`Show more` / `Show less`),
  - line-count label (`N lines`).

### 6. Copy actions

- Primary block actions include copy-to-clipboard.
- Expanded view has its own copy action.
- Copy success gives transient visual confirmation (`Copied`) with timeout reset.

### 7. Expanded/fullscreen view (modal-style drawer)

- Code blocks can open an expanded overlay view via action tray trigger.
- Expanded view includes:
  - title and language/line metadata,
  - sticky header actions,
  - copy action,
  - download action,
  - scrollable code body.

### 8. Download action

- Expanded code view supports downloading snippet contents as a file.
- Filename uses `code-snippet.<ext>` with language-based extension mapping.
- Unknown or text-like languages default to `.txt`.

### 9. Hydration-safe progressive behavior

- Initial render keeps plain `<pre>` output for SSR safety.
- Enhanced behavior (actions, collapse controls, mode switch) activates after hydration.

### 10. Mermaid detection and routing

- Blocks are classified as Mermaid when:
  - language resolves to `mermaid`, or
  - raw first non-empty line matches Mermaid syntax starters.
- Mermaid blocks route to dedicated Mermaid rendering UI, not the normal code-block renderer.

## UI/Interaction Baseline

- Action tray appears on hover/focus within the code block wrapper.
- Action controls include accessible labels/titles for icon-only actions.
- Expanded code header actions remain visible while code body scrolls.

## Data and Attribute Contract

The following attributes are part of the baseline contract and should be preserved:

- `data-md-raw`: exact raw source used for copy/mermaid detection/expanded view.
- `data-md-language`: resolved language used directly by downstream components.
- `data-code-action="true"`: marks overlay actions controlled by hover/focus styles.

## Source of Truth (Current Implementation)

- `/Users/byronwall/Projects/llm-question-asker/app/src/components/markdown-code.tsx`
- `/Users/byronwall/Projects/llm-question-asker/app/src/components/markdown-pre.tsx`
- `/Users/byronwall/Projects/llm-question-asker/app/src/components/markdown-code-block.tsx`
- `/Users/byronwall/Projects/llm-question-asker/app/src/components/highlighted-line-numbered-code.tsx`
- `/Users/byronwall/Projects/llm-question-asker/app/src/components/line-numbered-code.tsx`
- `/Users/byronwall/Projects/llm-question-asker/app/src/components/markdown-code-utils.ts`
- `/Users/byronwall/Projects/llm-question-asker/app/src/components/markdown-styles.ts`
- `/Users/byronwall/Projects/llm-question-asker/app/src/components/markdown-mermaid-block.tsx`

## Non-Regression Checklist for Future Work

- Preserve one shared render pipeline for line-numbered highlighted code.
- Do not re-parse `data-md-language` when already resolved.
- Preserve raw source text separately from rendered DOM text.
- Keep gutter width digit-aware and shared between normal and expanded views.
- Keep Mermaid detection based on raw source text.
- Keep expanded header actions sticky and body scrollable.
- Maintain hydration-safe SSR-first render path.
