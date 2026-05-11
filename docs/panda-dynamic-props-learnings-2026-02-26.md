# Panda + Dynamic Props Learnings (2026-02-26)

## 1) Scope and Context

- Request context: Build a Storybook-lite `comps` explorer route that can preview ParkUI/Panda recipe variants, including variant grids and interactive controls.
- Primary files involved:
  - `app/src/components/comps-explorer/CompsExplorer.tsx`
  - `app/scripts/generate-comps-variants.mjs`
  - `app/src/components/comps-explorer/generated-variant-options.ts`
  - `app/src/components/comps-explorer/generated-variant-matrix/*`
  - `app/src/components/comps-explorer/generated-recipe-raw-hints.ts`
  - `app/src/routes/panda-seed.tsx`
- Constraint that shaped most decisions: Panda extracts styles statically. Runtime-resolved prop values often do not produce CSS unless those values appear as static literals in analyzable code paths.

## 2) Major Changes Delivered

- Added a recipe-driven comps explorer that:
  - reads recipe metadata from `~/theme/recipes` (TS recipe sources),
  - shows variant options,
  - renders 2D variant matrices (`variant x size`) where possible,
  - supports an additional axis for third-variant recipes by sectioning per extra value.
- Added generation tooling:
  - `pnpm -C app generate:comps-variants` (script in `app/scripts/generate-comps-variants.mjs`) to emit static TSX variant stubs and variant-option metadata.
- Added Panda seeding route:
  - `app/src/routes/panda-seed.tsx` renders generated matrix components in hidden DOM to increase static discoverability.
- Added runtime debug instrumentation in explorer:
  - variant update logs: `[CompsExplorer] variant updated`
  - menu render logs with resolved size values.
- Fixed a Solid reactivity issue in `CompsExplorer.tsx`:
  - replaced stale plain-object reads in `For` item scope with reactive accessors/memos (`selectedCombo()` and `matrixBaseCombo()`).

## 3) Design Decisions and Tradeoffs

- Decision: Keep a split model of `simple` gridable components vs complex composed components.
  - Why: single-tag/simple wrappers can be brute-force rendered safely; complex overlays and structured comps require hand-authored previews.
  - Tradeoff: two maintenance paths.
- Decision: Use a generation script to emit literal variant props.
  - Why: guarantees variant strings exist in TSX for static extraction.
  - Tradeoff: generated artifacts need periodic refresh.
- Decision: For problematic components (example: menu), prefer explicit literal branches over fully dynamic prop pass-through.
  - Why: literal branches are reliably extractable by Panda.
  - Tradeoff: verbose preview code.
- Decision: Keep interactive controls even for non-grid components.
  - Why: gives real-time validation that selected variant state changes and can be wired into composed demos.
  - Tradeoff: visual deltas may be subtle for some recipes.

## 4) Problems Encountered and Resolutions

- Problem: Variant button clicks logged correctly but preview did not update reliably.
  - Symptom: logs changed (`size: xs/sm/md/lg/xl`) while UI appeared stale.
  - Root cause: non-reactive object capture inside `For` scope in `CompsExplorer.tsx`.
  - Resolution: convert derived state to memos/accessors and read via thunk (`selectedCombo()`, `matrixBaseCombo()`).
  - Preventative action: avoid plain-object snapshots from signals in list-item render closures.
- Problem: Some dynamic variant changes produced no visible style change.
  - Symptom: runtime state changed; corresponding classes were not always present.
  - Root cause: Panda static extraction could not reliably see dynamic value usage in certain paths.
  - Resolution: emit static literals via generated TSX stubs and use explicit literal branches in critical previews (menu trigger sizes).
  - Preventative action: when debugging style-missing issues, force literal prop/value pairs in source first, then reintroduce abstractions carefully.
- Problem: Hidden “seed route” alone did not universally fix missing styles.
  - Root cause: not all runtime paths/slots are guaranteed to be represented by one generic hidden render strategy.
  - Resolution: combine seeding with per-component explicit usage patterns where needed.

## 5) Verification and Validation

- Commands run:
  - `pnpm -C app type-check` (pass).
- Manual validation:
  - clicked menu size controls repeatedly and inspected logs for both state update and render-phase size.
  - latest logs show paired events, for example:
    - `[CompsExplorer] variant updated` with `next: { size: "xl" }`
    - `Rendering menu with size: xl and variant props: { size: "xl" }`
  - this confirms state propagation from control -> selected variants -> preview render.
- Gaps:
  - no automated visual regression tests were added for variant appearance deltas.
  - no dedicated Panda CSS artifact diffing step yet.

## 6) Process Improvements

- Add a standard debug cycle for Panda extraction issues:
  - Step 1: prove state updates with logs.
  - Step 2: prove render receives updated props.
  - Step 3: replace dynamic prop usage with literal branches.
  - Step 4: if fixed, generate/static-seed or add `raw()` hints where appropriate.
- Keep a generated artifact workflow in-repo instead of ad-hoc manual edits.
  - Owner/location: `app/scripts/generate-comps-variants.mjs` + package script.
- Prefer a representative demo per complex component over forcing all combinations.
  - reduces noise and makes failures easier to isolate.

## 7) Agent/Skill Improvements

- Missing instruction discovered:
  - explicitly require reactive accessors in `For`-item derived values for Solid UI explorers.
- Proposed encoding:
  - add to `AGENTS.md` under Solid reactivity rules: "Inside `For` blocks, derived state from signals/resources should be wrapped in memo/accessor; avoid plain object snapshots."
- Why it helps:
  - prevents false attribution of bugs to Panda when root cause is stale Solid reads.

## 8) Follow-ups and Open Risks

- Open risk: some complex recipes may still not show strong visual differences for every variant axis in current demo composition.
- Open risk: hidden seed rendering may not cover all slot/part combinations for every recipe.
- Follow-ups:
  - Add a small "variant visibly changed" checklist per complex component (menu, popover, dialog, drawer, etc.).
  - Add an optional test utility that snapshots className outputs for selected recipe combinations.
  - Consider targeted Panda `staticCss` configuration for recurring runtime-driven recipe axes if generation volume is acceptable.

## Practical Rules of Thumb (for this repo)

- Do:
  - keep recipe variant values as static string literals in TSX when possible,
  - use generated TSX stubs for broad combination coverage,
  - use explicit branch rendering for high-value interactive previews,
  - verify state/reactivity before blaming extraction.
- Avoid:
  - dynamic lookups that hide final variant values from static analysis,
  - assuming one hidden seed route will cover all slot-level styles,
  - non-reactive derived objects in Solid `For` item closures.
