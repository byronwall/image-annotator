# Usability Evaluation: Common Image Annotator Features

- Product URL: http://localhost:3003/
- Date: 2026-05-16
- Persona: competent first-time user with advanced editing expectations
- Task: load an image, create an annotation, discover editing/export controls, and assess speed for repeated annotation work
- Risk level: low; local prototype interactions only
- Viewport: desktop, 1440 x 1000
- Outcome: full success after fixes; baseline was usable but friction-heavy

## Evidence

Screenshots:

- `assets/usability-common-features-2026-05-16/usability-01-initial.png`: baseline empty state
- `assets/usability-common-features-2026-05-16/usability-02-test-image.png`: sample image loaded
- `assets/usability-common-features-2026-05-16/usability-03-rectangle.png`: baseline selected-object controls overflowed far past viewport
- `assets/usability-common-features-2026-05-16/usability-04-shortcuts.png`: keyboard shortcut dialog
- `assets/usability-common-features-2026-05-16/usability-06-after-fix-wide-context.png`: fixed reachable global and context controls

Observed path:

1. Opened the app at `/`.
2. Loaded the sample image with the toolbar sample action.
3. Selected Rectangle and dragged an annotation on the canvas.
4. Opened keyboard shortcuts.
5. Repeated the same flow after fixes.

Counters:

- Clicks: 5 core clicks plus one drag.
- Dead clicks: 0 during the happy path.
- Backtracks: 0.
- Scrolls: 0 intentional; baseline required horizontal overflow recovery for hidden controls.
- Page transitions: 0.
- Keyboard: shortcut dialog exposed substantial keyboard support.

## Baseline Findings

The app already supports the important workflows: import/sample image, choose tools, draw layers, select layers, view history, undo/redo, copy/export, and discover shortcuts.

Primary usability problems were layout and density:

- The global toolbar exceeded the 1440px viewport. `Copy PNG` started at x=1422 and `Export PNG` started at x=1548, making the final export path partly or fully unreachable without horizontal recovery.
- The selected-object context bar was a single no-wrap strip. After drawing a rectangle, stroke and opacity controls appeared thousands of pixels to the right, so advanced controls were technically present but not practically accessible.
- The canvas image extended below the visible work area at 100% zoom; this is acceptable for pan/zoom workflows, but it increases the cost of any toolbar chrome that steals vertical space.
- The shortcut dialog was useful and clear, but there is no command palette for fast expert access across the larger action set.
- Accessibility names for key icon buttons were generally present. The main concern was reachable layout, not missing names.

## Dense-Action Classification

Primary workflow: annotate an image quickly, adjust selected annotation style, and export/copy the result.

Primary actions:

- Choose annotation tool
- Draw/edit selected annotation
- Export
- Import/sample image

Secondary actions:

- Save
- Copy PNG
- Zoom
- Undo/redo

Contextual actions:

- Duplicate, reorder, delete selected layer
- Edit selected text/step
- Change style, color, stroke, opacity
- Zoom/focus selected region

Advanced actions:

- Before/after paste framing
- Expand/trim canvas
- Smart-fit selection
- Keyboard shortcut reference

Dangerous actions:

- Delete selected layer; currently separated in the selection action cluster and colored red.

Initial state after fixes:

- Active tool: Select.
- Sidebar: open.
- Selection: empty.
- Toolbar: one non-wrapping row; primary actions visible.
- Context bar: closed until tool/selection context exists, then wraps within canvas width.
- Default filters/sort: not applicable.
- Loading/empty: empty canvas shows paste/drop/choose image affordance.

## Scores

- Completion: 100 after fixes; 100 baseline for happy path.
- Efficiency: 86 after fixes; baseline 68 due to hidden export/style controls.
- Cognitive load: 82 after fixes; baseline 72 because controls existed but their location was not discoverable when overflowed.
- Error/recovery: 90; no functional errors, but baseline overflow recovery was unclear.
- Interaction quality/jank: 84 after fixes; baseline 55 because two critical toolbars overflowed.
- Accessibility: 82; accessible names mostly present, layout reachability improved.
- Confidence/trust: 84; status feedback and enabled states are clear.
- Visual design/workspace fit: 78 after fixes; baseline 58 due to toolbar/context overflow and workspace loss risk.
- General-purpose fit: 88; tool/style model supports realistic annotation variation.
- Overall goodness after fixes: 87.
- Overall badness after fixes: 13.

## Prioritized Backlog

1. Fixed: keep Save, Copy, and Export reachable in the global toolbar at desktop widths.
2. Fixed: keep selected-object style controls reachable by wrapping the context toolbar within the canvas width.
3. Add a command palette (`Cmd/Ctrl+K`) for expert access to tool selection, export, save, copy, zoom, fit, layer operations, and canvas operations.
4. Convert the context bar into a two-tier model if it grows further: visible core row plus `Style`, `Arrange`, and `Advanced` popovers.
5. Add responsive toolbar collapse rules for tablet/mobile instead of relying on desktop density.
6. Add visible shortcut hints for the active tool group, not only in the modal.
7. Add focus return after closing the keyboard shortcut dialog.
8. Consider making the context toolbar sticky to the top of the canvas but compact enough to preserve image workspace.
9. Add an explicit `More` menu for low-frequency canvas operations if the global toolbar receives more actions.
10. Keep destructive layer actions visually separated as the selection action set expands.

